/**
 * Parsing Utilities
 *
 * Functions for parsing PR URLs, extracting components, and processing data
 * Based on N8n workflow analysis - see N8N_WORKFLOW_ANALYSIS.md for details
 */

export interface PRUrlComponents {
  domain: string;
  project: string;
  repo: string;
  prId: string;
  fullUrl: string;
}

/**
 * Extract PR URLs from a message
 *
 * Supports Bitbucket and GitHub PR URLs, including Slack-wrapped URLs
 * Regex from N8n workflow: /<?(https?:\/\/[^\s>]*?(?:pull-requests|pull)\/\d+[^\s>]*)>?/gi
 */
export function extractPRUrls(message: string): string[] {
  // Regex to match Bitbucket or GitHub PR URLs (with optional Slack wrapping)
  const prUrlRegex = /<?(https?:\/\/[^\s>]*?(?:pull-requests|pull)\/\d+[^\s>]*)>?/gi;
  const matches = [...message.matchAll(prUrlRegex)];

  // Extract and clean URLs (remove Slack wrapping and trailing characters)
  return matches.map(m => m[1].replace(/[>\s]+$/, ''));
}

/**
 * Parse a Bitbucket PR URL into its components
 *
 * Supports URLs with optional suffixes like /overview, /diff, /commits
 * Examples:
 *   - https://bitbucket.upstox.com/projects/GROWTH/repos/ui-stock-details/pull-requests/26
 *   - https://bitbucket.upstox.com/projects/GROWTH/repos/ui-stock-details/pull-requests/26/overview
 *   - https://bitbucket.upstox.com/projects/GROWTH/repos/ui-stock-details/pull-requests/26/diff
 */
export function parsePRUrl(url: string): PRUrlComponents | null {
  // Updated regex to optionally match any suffix after the PR number (e.g., /overview, /diff, /commits)
  const regex = /https?:\/\/([^\/]+)\/projects\/([^\/]+)\/repos\/([^\/]+)\/pull-requests\/(\d+)(?:\/.*)?/;
  const match = url.match(regex);

  if (!match) {
    return null;
  }

  return {
    domain: match[1],
    project: match[2],
    repo: match[3],
    prId: match[4],
    fullUrl: url
  };
}

/**
 * Split an array into batches of specified size
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Split diff content into file-based batches
 */
export function splitDiffIntoBatches(diff: string, filesPerBatch: number): string[] {
  // Split by file boundaries (diff --git pattern)
  const filePattern = /^diff --git/gm;
  const fileDiffs: string[] = [];

  let lastIndex = 0;
  let match;

  while ((match = filePattern.exec(diff)) !== null) {
    if (lastIndex > 0) {
      fileDiffs.push(diff.substring(lastIndex, match.index));
    }
    lastIndex = match.index;
  }

  // Add the last file
  if (lastIndex < diff.length) {
    fileDiffs.push(diff.substring(lastIndex));
  }

  // Group files into batches
  return batchArray(fileDiffs, filesPerBatch).map(batch => batch.join('\n'));
}
