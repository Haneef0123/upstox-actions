/**
 * PR Review Webhook Endpoint
 *
 * This endpoint receives webhook requests from Slack or other sources
 * and triggers batch PR review processing.
 *
 * Based on N8n "PR Review - Batch Processing" workflow
 * See N8N_WORKFLOW_ANALYSIS.md for complete flow diagram
 *
 * Flow:
 * 1. Parse Slack webhook payload
 * 2. Extract PR URLs from message
 * 3. For each PR:
 *    - Fetch PR details, commits, and diff from Bitbucket
 *    - Split diff into batches (2 files per batch)
 *    - Generate AI review for each batch
 *    - Aggregate all reviews
 *    - Chunk long messages for Slack (2800 char limit)
 *    - Post to Slack with 2s delay between chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse } from '@/types';
import { config } from '@/config';
import { extractPRUrls, parsePRUrl } from '@/lib/utils/parse';
import { fetchPRDetails, fetchPRCommits, fetchPRDiff } from '@/lib/bitbucket';
import { generateCodeReview } from '@/lib/ai';
import { postSlackMessage, formatCodeReviewMessage, chunkMessage, delay } from '@/lib/slack';
import { splitDiffsIntoBatches, buildReviewFileChangesText } from '@/lib/utils/diff';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            message: 'Invalid JSON in request body',
            code: 'INVALID_JSON',
          },
        },
        { status: 400 }
      );
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📨 PR Review Webhook Received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Extract message text from Slack payload
    // Supports both direct text and Slack message action format
    const messageText = body.text || body.payload?.message?.text || body.message || '';

    if (!messageText) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            message: 'No message text found in payload',
            code: 'MISSING_MESSAGE',
          },
        },
        { status: 400 }
      );
    }

    // Extract PR URLs from message
    const prUrls = extractPRUrls(messageText);

    if (prUrls.length === 0) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            message: 'No PR URLs found in message',
            code: 'NO_PR_URLS',
          },
        },
        { status: 400 }
      );
    }

    console.log(`📋 Found ${prUrls.length} PR URL(s)`);

    const results = [];

    // Process each PR
    for (const prUrl of prUrls) {
      try {
        console.log(`\n🔍 Processing PR: ${prUrl}`);

        // Parse PR URL
        const components = parsePRUrl(prUrl);
        if (!components) {
          console.error(`❌ Invalid PR URL format: ${prUrl}`);
          results.push({ url: prUrl, success: false, error: 'Invalid URL format' });
          continue;
        }

        const { project, repo, prId } = components;

        // Fetch PR data in parallel
        console.log(`📥 Fetching PR data: ${project}/${repo}#${prId}`);

        const [prDetails, commits, diffData] = await Promise.all([
          fetchPRDetails(config.bitbucket, project, repo, prId),
          fetchPRCommits(config.bitbucket, project, repo, prId),
          fetchPRDiff(config.bitbucket, project, repo, prId, config.review.contextLines),
        ]);

        console.log(`✅ PR Data fetched: ${prDetails.title}`);
        console.log(`   Author: ${prDetails.author.name}`);
        console.log(`   Commits: ${commits.length}`);
        console.log(`   Files changed: ${diffData.diffs?.length || 0}`);

        // Split diffs into batches
        const diffs = diffData.diffs || [];
        const diffBatches = splitDiffsIntoBatches(diffs, config.review.filesPerBatch);

        console.log(`📦 Split into ${diffBatches.length} batch(es) (${config.review.filesPerBatch} files per batch)`);

        // Generate reviews for each batch IN PARALLEL with concurrency limit
        console.log(`🚀 Processing batches with concurrency limit: ${config.review.batchConcurrency}`);

        const reviews = [];

        // Process batches in parallel with concurrency limit
        for (let i = 0; i < diffBatches.length; i += config.review.batchConcurrency) {
          const batchSlice = diffBatches.slice(i, i + config.review.batchConcurrency);
          const startIdx = i;

          const batchPromises = batchSlice.map(async (batch, sliceIdx) => {
            const batchIdx = startIdx + sliceIdx;
            console.log(`🤖 Processing batch ${batchIdx + 1}/${diffBatches.length} (${batch.length} files)...`);

            // Build file changes text for this batch
            const fileChangesText = buildReviewFileChangesText(batch, 200);

            // Generate AI review
            return generateCodeReview(config.ai, {
              prTitle: prDetails.title,
              prAuthor: prDetails.author.name,
              project,
              repository: repo,
              fromBranch: prDetails.fromRef.displayId,
              toBranch: prDetails.toRef.displayId,
              commits: commits.map(c => c.message),
              fileChanges: fileChangesText,
              batchIndex: batchIdx,
              totalBatches: diffBatches.length,
            });
          });

          const batchResults = await Promise.all(batchPromises);
          reviews.push(...batchResults);
        }

        console.log(`✅ Generated ${reviews.length} review(s) in parallel`);

        // Aggregate all reviews
        const combinedReview = `# 🤖 Complete AI Code Review

**PR:** ${prDetails.title}
**Author:** ${prDetails.author.name}
**Repository:** ${project}/${repo}
**Files Reviewed:** ${diffs.length} files in ${reviews.length} batch(es)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${reviews.map(r => r.review).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 Summary
Total batches processed: ${reviews.length}
Review completed successfully.`;

        console.log(`📏 Combined review length: ${combinedReview.length} chars`);

        // Chunk review for Slack (2800 char limit)
        const chunks = chunkMessage(combinedReview, config.slack.messageMaxLength);

        console.log(`✂️ Split into ${chunks.length} chunk(s) for Slack`);

        // Post each chunk to Slack with optimized delay
        // Reduce delay to 500ms to prevent timeout while still respecting rate limits
        const slackDelay = Math.min(config.slack.waitBetweenPosts, 500);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkIndex = i + 1;

          console.log(`📤 Posting chunk ${chunkIndex}/${chunks.length} to Slack...`);

          const slackMessage = formatCodeReviewMessage(
            prUrl,
            prDetails.title,
            prDetails.author.name,
            chunk,
            chunkIndex,
            chunks.length
          );

          await postSlackMessage(config.slack, slackMessage);

          // Wait between posts (except after last one) - reduced delay
          if (i < chunks.length - 1 && slackDelay > 0) {
            console.log(`⏱️ Waiting ${slackDelay}ms before next post...`);
            await delay(slackDelay);
          }
        }

        console.log(`✅ Successfully posted all ${chunks.length} chunk(s) to Slack`);

        results.push({
          url: prUrl,
          success: true,
          batches: reviews.length,
          chunks: chunks.length,
        });
      } catch (error) {
        console.error(`❌ Error processing PR ${prUrl}:`, error);
        results.push({
          url: prUrl,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const duration = Date.now() - startTime;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PR Review Complete: ${successCount}/${prUrls.length} successful`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: `Processed ${prUrls.length} PR(s)`,
        processed: successCount,
        total: prUrls.length,
        duration,
        results,
      },
    });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ PR Review webhook error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'PROCESSING_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PR Review webhook endpoint',
    method: 'POST',
    description: 'Send PR URLs in message text to trigger AI code reviews',
    example: {
      text: 'Review this PR: https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123',
    },
  });
}
