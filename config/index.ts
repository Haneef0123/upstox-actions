/**
 * Application Configuration
 *
 * Central configuration for the application
 * Based on N8n workflow analysis - see N8N_WORKFLOW_ANALYSIS.md
 */

export const config = {
  // Bitbucket Configuration
  bitbucket: {
    baseUrl: process.env.BITBUCKET_BASE_URL || '',
    username: process.env.BITBUCKET_USERNAME || '',
    appPassword: process.env.BITBUCKET_APP_PASSWORD || '',
    commitLimit: parseInt(process.env.BITBUCKET_COMMIT_LIMIT || '100', 10),
  },

  // AI Configuration (Groq/OpenAI)
  ai: {
    provider: (process.env.AI_PROVIDER || 'groq') as 'groq' | 'openai',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'openai/gpt-oss-120b', // Default from N8n workflows
    temperature: parseFloat(process.env.AI_TEMPERATURE || '1'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '8192', 10),
    topP: parseFloat(process.env.AI_TOP_P || '1'),
    reasoningEffort: (process.env.AI_REASONING_EFFORT || 'medium') as 'low' | 'medium' | 'high',
  },

  // Slack Configuration
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '',
    messageMaxLength: parseInt(process.env.SLACK_MESSAGE_MAX_LENGTH || '2800', 10),
    waitBetweenPosts: parseInt(process.env.SLACK_WAIT_BETWEEN_POSTS || '2000', 10), // ms
  },

  // PR Review Processing Configuration
  review: {
    filesPerBatch: parseInt(process.env.REVIEW_FILES_PER_BATCH || '2', 10), // N8n default: 2
    contextLines: parseInt(process.env.REVIEW_CONTEXT_LINES || '5', 10),
    maxCommits: parseInt(process.env.REVIEW_MAX_COMMITS || '10', 10),
    lineLengthLimit: parseInt(process.env.REVIEW_LINE_LENGTH_LIMIT || '120', 10),
    batchConcurrency: parseInt(process.env.BATCH_CONCURRENCY || '3', 10),
  },

  // PR Description Generation Configuration
  description: {
    contextLines: parseInt(process.env.DESCRIPTION_CONTEXT_LINES || '3', 10),
    minLength: parseInt(process.env.DESCRIPTION_MIN_LENGTH || '10', 10),
    maxCommits: parseInt(process.env.DESCRIPTION_MAX_COMMITS || '10', 10),
    maxKeyChangesPerFile: parseInt(process.env.DESCRIPTION_MAX_KEY_CHANGES || '5', 10),
    lineLengthLimit: parseInt(process.env.DESCRIPTION_LINE_LENGTH_LIMIT || '150', 10),
    commitLengthLimit: parseInt(process.env.DESCRIPTION_COMMIT_LENGTH_LIMIT || '80', 10),
    topModifiedFiles: parseInt(process.env.DESCRIPTION_TOP_MODIFIED_FILES || '10', 10),
    authorEmail: process.env.PR_DESCRIPTION_AUTHOR_EMAIL || '', // User email to filter PRs
    cronInterval: process.env.CRON_PR_DESCRIPTION_INTERVAL || '*/10 * * * *', // Every 10 minutes (N8n default)
  },

  // Repository Configuration
  repos: {
    // Comma-separated list: PROJECT/repo,PROJECT/repo
    whitelist: process.env.REPOS_WHITELIST?.split(',').filter(Boolean) || [],
    blacklist: process.env.REPOS_BLACKLIST?.split(',').filter(Boolean) || [],
  },

  // Cron Job Configuration
  cron: {
    secret: process.env.CRON_SECRET || '', // Optional: secret token for cron auth
  },
} as const;

// Validation function
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Bitbucket
  if (!config.bitbucket.baseUrl) {
    errors.push('BITBUCKET_BASE_URL is required');
  }
  if (!config.bitbucket.username) {
    errors.push('BITBUCKET_USERNAME is required');
  }
  if (!config.bitbucket.appPassword) {
    errors.push('BITBUCKET_APP_PASSWORD is required');
  }

  // AI
  if (!config.ai.apiKey) {
    errors.push('AI_API_KEY is required');
  }
  if (!config.ai.model) {
    errors.push('AI_MODEL is required');
  }

  // Slack
  if (!config.slack.webhookUrl) {
    errors.push('SLACK_WEBHOOK_URL is required');
  }

  // Warnings (non-blocking)
  const warnings: string[] = [];

  if (!config.description.authorEmail) {
    warnings.push('PR_DESCRIPTION_AUTHOR_EMAIL not set - PR description agent will not filter by author');
  }

  if (config.repos.whitelist.length === 0) {
    warnings.push('REPOS_WHITELIST not set - PR description agent may not have repos to process');
  }

  return {
    valid: errors.length === 0,
    errors: [...errors, ...warnings.map(w => `Warning: ${w}`)],
  };
}
