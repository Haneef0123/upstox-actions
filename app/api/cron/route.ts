/**
 * Cron Job Endpoint
 *
 * This endpoint is triggered by a cron job (e.g., Vercel Cron, external scheduler)
 * to run periodic tasks like PR description generation.
 *
 * Based on N8n "PR Description Agent" workflow
 * See N8N_WORKFLOW_ANALYSIS.md for details
 *
 * Configure your cron trigger to hit this endpoint at the desired interval:
 * - Default from N8n: */10 * * * * (every 10 minutes)
 * - Recommended: */30 * * * * (every 30 minutes)
 *
 * Authorization:
 * - Set CRON_SECRET environment variable
 * - Include as Bearer token: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse } from '@/types';
import { config } from '@/config';
import { fetchOpenPRs, fetchPRCommits, fetchPRDiff, updatePRDescription } from '@/lib/bitbucket';
import { generatePRDescription } from '@/lib/ai';
import { postSlackMessage, formatPRDescriptionMessage } from '@/lib/slack';
import { processDiffEntries, buildDescriptionFileChangesText } from '@/lib/utils/diff';

interface RepoWhitelist {
  project: string;
  repo: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Cron job unauthorized access attempt');
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      );
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Cron Job: PR Description Agent');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse repository whitelist from environment
    const repoWhitelistEnv = process.env.CRON_REPO_WHITELIST;
    const authorFilter = process.env.CRON_AUTHOR_FILTER;

    let repos: RepoWhitelist[] = [];

    if (repoWhitelistEnv) {
      try {
        repos = JSON.parse(repoWhitelistEnv);
        console.log(`📋 Processing ${repos.length} whitelisted repository(ies)`);
      } catch (error) {
        console.error('❌ Failed to parse CRON_REPO_WHITELIST:', error);
        return NextResponse.json<APIResponse>(
          {
            success: false,
            error: {
              message: 'Invalid CRON_REPO_WHITELIST format',
              code: 'INVALID_CONFIG',
            },
          },
          { status: 500 }
        );
      }
    } else {
      console.log('⚠️ No CRON_REPO_WHITELIST configured, skipping...');
      return NextResponse.json<APIResponse>({
        success: true,
        data: {
          message: 'No repositories configured for cron processing',
          timestamp: new Date().toISOString(),
          processed: 0,
        },
      });
    }

    const results = [];
    let totalProcessed = 0;
    let totalSkipped = 0;

    // Process each repository
    for (const repoConfig of repos) {
      const { project, repo } = repoConfig;

      try {
        console.log(`\n🔍 Repository: ${project}/${repo}`);

        // Fetch all open PRs
        const openPRs = await fetchOpenPRs(config.bitbucket, project, repo);

        console.log(`📋 Found ${openPRs.length} open PR(s)`);

        if (openPRs.length === 0) {
          console.log('   ⏭️  No open PRs, skipping...');
          continue;
        }

        // Filter PRs that need descriptions
        const filteredPRs = openPRs.filter(pr => {
          // Check description length
          const needsDescription =
            !pr.description || pr.description.trim().length < config.description.minLength;

          // Check author filter if configured
          const authorMatches = !authorFilter || pr.author.name === authorFilter;

          return needsDescription && authorMatches;
        });

        console.log(`✅ Filtered to ${filteredPRs.length} PR(s) needing descriptions`);

        if (filteredPRs.length === 0) {
          console.log('   ⏭️  No PRs need descriptions, skipping...');
          totalSkipped += openPRs.length;
          continue;
        }

        // Process each filtered PR
        for (const pr of filteredPRs) {
          try {
            console.log(`\n📝 Processing PR #${pr.id}: ${pr.title}`);
            console.log(`   Author: ${pr.author.name}`);
            console.log(`   Current description length: ${pr.description?.length || 0} chars`);

            // Get repo info from PR refs
            const prProject = pr.toRef.repository?.project.key || project;
            const prRepo = pr.toRef.repository?.slug || repo;

            // Fetch commits and diff
            console.log(`📥 Fetching commits and diff...`);

            const [commits, diffData] = await Promise.all([
              fetchPRCommits(config.bitbucket, prProject, prRepo, pr.id.toString()),
              fetchPRDiff(
                config.bitbucket,
                prProject,
                prRepo,
                pr.id.toString(),
                config.description.contextLines
              ),
            ]);

            console.log(`   ✅ Fetched ${commits.length} commit(s)`);
            console.log(`   ✅ Fetched diff: ${diffData.diffs?.length || 0} file(s) changed`);

            // Process diff to extract key changes
            const diffs = diffData.diffs || [];
            const fileChanges = processDiffEntries(diffs, 5, 150);

            console.log(`   📊 Processed ${fileChanges.length} file change(s)`);

            // Build file changes summary for prompt
            const fileChangesText = buildDescriptionFileChangesText(fileChanges, 10);

            // Generate AI description
            console.log(`🤖 Generating PR description with AI...`);

            const descriptionResult = await generatePRDescription(config.ai, {
              prTitle: pr.title,
              prAuthor: pr.author.name,
              fromBranch: pr.fromRef.displayId,
              toBranch: pr.toRef.displayId,
              commits: commits.map(c => c.message),
              fileChanges: fileChangesText,
            });

            const newDescription = descriptionResult.description;

            console.log(`   ✅ Generated description (${newDescription.length} chars)`);

            // Update PR in Bitbucket
            console.log(`💾 Updating PR in Bitbucket...`);

            await updatePRDescription(
              config.bitbucket,
              prProject,
              prRepo,
              pr.id.toString(),
              newDescription,
              pr.version
            );

            console.log(`   ✅ PR description updated successfully`);

            // Construct PR URL
            const prUrl = `${config.bitbucket.baseUrl}/projects/${prProject}/repos/${prRepo}/pull-requests/${pr.id}`;

            // Notify via Slack if configured
            if (config.slack.webhookUrl) {
              console.log(`📤 Posting notification to Slack...`);

              const slackMessage = formatPRDescriptionMessage(
                prUrl,
                pr.id.toString(),
                pr.title,
                pr.author.name,
                `${prProject}/${prRepo}`,
                newDescription
              );

              await postSlackMessage(config.slack, slackMessage);

              console.log(`   ✅ Posted to Slack successfully`);
            }

            totalProcessed++;

            results.push({
              project: prProject,
              repo: prRepo,
              prId: pr.id,
              prTitle: pr.title,
              success: true,
              descriptionLength: newDescription.length,
            });
          } catch (error) {
            console.error(`❌ Error processing PR #${pr.id}:`, error);
            results.push({
              project,
              repo,
              prId: pr.id,
              prTitle: pr.title,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        totalSkipped += openPRs.length - filteredPRs.length;
      } catch (error) {
        console.error(`❌ Error processing repository ${project}/${repo}:`, error);
        results.push({
          project,
          repo,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Cron Job Complete`);
    console.log(`   Processed: ${successCount} PR(s)`);
    console.log(`   Skipped: ${totalSkipped} PR(s)`);
    console.log(`   Failed: ${results.length - successCount}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: `Cron job executed: ${totalProcessed} PR(s) processed`,
        timestamp: new Date().toISOString(),
        processed: totalProcessed,
        skipped: totalSkipped,
        total: totalProcessed + totalSkipped,
        duration,
        results,
      },
    });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Cron job error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'CRON_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
