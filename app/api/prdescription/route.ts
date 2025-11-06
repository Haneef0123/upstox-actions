/**
 * PR Description Agent Endpoint
 *
 * This endpoint can be triggered manually or via cron to process
 * open PRs and generate/update descriptions using AI.
 *
 * Based on N8n "PR Description Agent" workflow
 * See N8N_WORKFLOW_ANALYSIS.md for complete flow diagram
 *
 * Flow:
 * 1. Fetch all open PRs from configured repositories
 * 2. Filter PRs that need descriptions (empty or too short, author matches)
 * 3. For each PR:
 *    - Fetch commits and diff from Bitbucket (contextLines: 3)
 *    - Process diff to extract key changes
 *    - Build description prompt with file summary
 *    - Generate AI description
 *    - Update PR in Bitbucket
 *    - Optionally notify via Slack
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse } from '@/types';
import { config } from '@/config';
import { fetchOpenPRs, fetchPRCommits, fetchPRDiff, updatePRDescription } from '@/lib/bitbucket';
import { generatePRDescription } from '@/lib/ai';
import { postSlackMessage, formatPRDescriptionMessage } from '@/lib/slack';
import { processDiffEntries, buildDescriptionFileChangesText } from '@/lib/utils/diff';

interface RepoConfig {
  project: string;
  repo: string;
}

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

    const { repos, forceUpdate, authorFilter, notifySlack } = body;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 PR Description Agent Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse repositories to process
    const reposList: RepoConfig[] = repos || [];

    if (reposList.length === 0) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            message: 'No repositories specified',
            code: 'NO_REPOS',
          },
        },
        { status: 400 }
      );
    }

    console.log(`📂 Processing ${reposList.length} repository(ies)`);

    const results = [];
    let totalProcessed = 0;
    let totalSkipped = 0;

    // Process each repository
    for (const repoConfig of reposList) {
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
          const needsDescription = forceUpdate ||
            !pr.description ||
            pr.description.trim().length < config.description.minLength;

          // Check author filter if provided
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

            // Notify via Slack if enabled
            if (notifySlack !== false && config.slack.webhookUrl) {
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
    console.log(`✅ PR Description Agent Complete`);
    console.log(`   Processed: ${successCount} PR(s)`);
    console.log(`   Skipped: ${totalSkipped} PR(s)`);
    console.log(`   Failed: ${results.length - successCount}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: `Processed ${totalProcessed} PR(s)`,
        processed: totalProcessed,
        skipped: totalSkipped,
        total: totalProcessed + totalSkipped,
        duration,
        results,
      },
    });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ PR Description Agent error:', error);
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
    message: 'PR Description generation endpoint',
    method: 'POST',
    description: 'Generate AI descriptions for PRs with missing or short descriptions',
    example: {
      repos: [
        { project: 'PROJ', repo: 'repo-name' },
      ],
      forceUpdate: false,
      authorFilter: 'John Doe',
      notifySlack: true,
    },
  });
}
