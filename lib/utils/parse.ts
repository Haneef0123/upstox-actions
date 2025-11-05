/**
 * Parsing Utilities
 *
 * Functions for parsing PR URLs, extracting components, and processing data
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
 */
export function extractPRUrls(message: string): string[] {
  // Regex to match Bitbucket PR URLs
  const prUrlRegex = /https?:\/\/[^\/]+\/projects\/[^\/]+\/repos\/[^\/]+\/pull-requests\/\d+/g;
  const matches = message.match(prUrlRegex);
  return matches || [];
}

/**
 * Parse a Bitbucket PR URL into its components
 */
export function parsePRUrl(url: string): PRUrlComponents | null {
  const regex = /https?:\/\/([^\/]+)\/projects\/([^\/]+)\/repos\/([^\/]+)\/pull-requests\/(\d+)/;
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
