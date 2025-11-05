/**
 * Application Configuration
 *
 * Central configuration for the application
 */

export const config = {
  // Bitbucket Configuration
  bitbucket: {
    baseUrl: process.env.BITBUCKET_BASE_URL || '',
    username: process.env.BITBUCKET_USERNAME || '',
    appPassword: process.env.BITBUCKET_APP_PASSWORD || '',
  },

  // AI Configuration
  ai: {
    provider: (process.env.AI_PROVIDER || 'groq') as 'groq' | 'openai',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'mixtral-8x7b-32768',
  },

  // Slack Configuration
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '',
  },

  // Processing Configuration
  processing: {
    filesPerBatch: parseInt(process.env.FILES_PER_BATCH || '10', 10),
    maxCommitsPerReview: parseInt(process.env.MAX_COMMITS_PER_REVIEW || '10', 10),
    slackMessageMaxLength: parseInt(process.env.SLACK_MESSAGE_MAX_LENGTH || '2800', 10),
    batchConcurrency: parseInt(process.env.BATCH_CONCURRENCY || '3', 10),
  },

  // Cron Configuration
  cron: {
    prDescriptionInterval: process.env.CRON_PR_DESCRIPTION_INTERVAL || '*/15 * * * *', // Every 15 minutes
  },

  // Repository Configuration
  repos: {
    whitelist: process.env.REPOS_WHITELIST?.split(',') || [],
    blacklist: process.env.REPOS_BLACKLIST?.split(',') || [],
  },
} as const;

// Validation function
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.bitbucket.baseUrl) {
    errors.push('BITBUCKET_BASE_URL is required');
  }
  if (!config.bitbucket.username) {
    errors.push('BITBUCKET_USERNAME is required');
  }
  if (!config.bitbucket.appPassword) {
    errors.push('BITBUCKET_APP_PASSWORD is required');
  }
  if (!config.ai.apiKey) {
    errors.push('AI_API_KEY is required');
  }
  if (!config.slack.webhookUrl) {
    errors.push('SLACK_WEBHOOK_URL is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
