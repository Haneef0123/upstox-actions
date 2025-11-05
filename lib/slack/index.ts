/**
 * Slack Integration
 *
 * This module provides functions to interact with Slack via webhooks.
 * Based on N8n workflow analysis - see N8N_WORKFLOW_ANALYSIS.md for details.
 *
 * API Documentation: https://api.slack.com/messaging/webhooks
 */

export interface SlackConfig {
  webhookUrl: string;
  messageMaxLength?: number;
  waitBetweenPosts?: number;
}

export interface SlackMessageBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: any[];
  accessory?: any;
}

export interface SlackMessage {
  text: string;
  blocks?: SlackMessageBlock[];
  channel?: string;
  username?: string;
}

/**
 * Post a message to Slack via webhook
 *
 * @param config - Slack configuration
 * @param message - Message to post
 */
export async function postSlackMessage(
  config: SlackConfig,
  message: SlackMessage
): Promise<void> {
  console.log(`📤 Posting to Slack: ${message.text.substring(0, 50)}...`);

  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Slack webhook error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  console.log(`✅ Posted to Slack successfully`);
}

/**
 * Format a code review message for Slack
 *
 * Based on N8n workflow format with Block Kit
 *
 * @param prUrl - PR URL
 * @param prTitle - PR title
 * @param prAuthor - PR author
 * @param review - Review text
 * @param chunkIndex - Current chunk index (1-based)
 * @param totalChunks - Total number of chunks
 * @returns Formatted Slack message
 */
export function formatCodeReviewMessage(
  prUrl: string,
  prTitle: string,
  prAuthor: string,
  review: string,
  chunkIndex: number,
  totalChunks: number
): SlackMessage {
  const blocks: SlackMessageBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🤖 AI Code Review (${chunkIndex}/${totalChunks})`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*PR:*\n${prTitle}`,
        },
        {
          type: 'mrkdwn',
          text: `*Author:*\n${prAuthor}`,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: review,
      },
    },
  ];

  // Add "View PR" button only on last chunk
  if (chunkIndex === totalChunks) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View PR',
          },
          url: prUrl,
          action_id: 'view_pr',
        },
      ],
    });
  }

  return {
    text: `🤖 AI Code Review (Part ${chunkIndex}/${totalChunks})`,
    blocks,
  };
}

/**
 * Format a PR description update message for Slack
 *
 * Based on N8n workflow format
 *
 * @param prUrl - PR URL
 * @param prId - PR ID
 * @param prTitle - PR title
 * @param prAuthor - PR author
 * @param repository - Repository name
 * @param description - Generated description
 * @returns Formatted Slack message
 */
export function formatPRDescriptionMessage(
  prUrl: string,
  prId: string,
  prTitle: string,
  prAuthor: string,
  repository: string,
  description: string
): SlackMessage {
  return {
    text: '✅ Your PR Description Auto-Generated',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '✅ PR Description Auto-Generated',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `PR #${prId}\n${prTitle}\n\nRepository: ${repository}\nAuthor: ${prAuthor}\n\nGenerated Description:\n${description}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Pull Request',
            },
            url: prUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Chunk a long message into smaller parts for Slack
 *
 * Slack has a ~3000 character limit per message. We use 2800 to be safe.
 *
 * @param message - Message to chunk
 * @param maxLength - Maximum length per chunk (default: 2800 from N8n)
 * @returns Array of message chunks
 */
export function chunkMessage(message: string, maxLength: number = 2800): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  const lines = message.split('\n');

  for (const line of lines) {
    if ((currentChunk + line + '\n').length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      // If single line exceeds limit, truncate it
      if (line.length > maxLength) {
        chunks.push(line.substring(0, maxLength - 3) + '...');
        continue;
      }
    }

    currentChunk += line + '\n';
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Wait between Slack posts to avoid rate limiting
 *
 * From N8n workflow: 2 second wait between posts
 *
 * @param ms - Milliseconds to wait (default: 2000)
 */
export function delay(ms: number = 2000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
