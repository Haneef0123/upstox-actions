/**
 * Bitbucket API Integration
 *
 * This module provides functions to interact with Bitbucket Server/Data Center API.
 * Based on N8n workflow analysis - see N8N_WORKFLOW_ANALYSIS.md for details.
 *
 * API Documentation: https://docs.atlassian.com/bitbucket-server/rest/latest/bitbucket-rest.html
 */

import { withRetry } from '../utils/batch';

export interface BitbucketConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
  commitLimit?: number;
}

export interface PRDetails {
  id: number;
  title: string;
  description: string;
  author: {
    name: string;
    emailAddress: string;
  };
  fromRef: {
    displayId: string;
    id: string;
    repository?: {
      slug: string;
      project: {
        key: string;
      };
    };
  };
  toRef: {
    displayId: string;
    id: string;
    repository?: {
      slug: string;
      project: {
        key: string;
      };
    };
  };
  state: string;
  version: number;
}

export interface PRCommit {
  id: string;
  message: string;
  author: {
    name: string;
    emailAddress: string;
  };
  authorTimestamp: number;
}

export interface PRDiff {
  diffs: DiffEntry[];
}

export interface DiffEntry {
  source?: {
    toString: string;
  };
  destination?: {
    toString: string;
  };
  hunks?: Hunk[];
  binary?: boolean;
}

export interface Hunk {
  segments?: Segment[];
}

export interface Segment {
  type: 'ADDED' | 'REMOVED' | 'CONTEXT';
  lines?: Line[];
}

export interface Line {
  source?: number;
  destination?: number;
  line?: string;
}

/**
 * Create Basic Auth header for Bitbucket API
 */
function createAuthHeader(config: BitbucketConfig): string {
  const credentials = `${config.username}:${config.appPassword}`;
  const base64 = Buffer.from(credentials).toString('base64');
  return `Basic ${base64}`;
}

/**
 * Make HTTP request to Bitbucket API with retry logic
 */
async function bitbucketRequest<T>(
  url: string,
  config: BitbucketConfig,
  options: RequestInit = {}
): Promise<T> {
  return withRetry(
    async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: createAuthHeader(config),
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Bitbucket API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return response.json();
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    }
  );
}

/**
 * Fetch PR details from Bitbucket
 *
 * GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
 *
 * @param config - Bitbucket configuration
 * @param project - Project key
 * @param repo - Repository slug
 * @param prId - Pull request ID
 * @returns PR details object
 */
export async function fetchPRDetails(
  config: BitbucketConfig,
  project: string,
  repo: string,
  prId: string
): Promise<PRDetails> {
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests/${prId}`;

  console.log(`🔍 Fetching PR details: ${project}/${repo}#${prId}`);

  const response = await bitbucketRequest<any>(url, config);

  return {
    id: response.id,
    title: response.title,
    description: response.description || '',
    author: {
      name: response.author?.user?.displayName || 'Unknown',
      emailAddress: response.author?.user?.emailAddress || '',
    },
    fromRef: {
      displayId: response.fromRef?.displayId || '',
      id: response.fromRef?.id || '',
      repository: response.fromRef?.repository
        ? {
            slug: response.fromRef.repository.slug,
            project: {
              key: response.fromRef.repository.project?.key || '',
            },
          }
        : undefined,
    },
    toRef: {
      displayId: response.toRef?.displayId || '',
      id: response.toRef?.id || '',
      repository: response.toRef?.repository
        ? {
            slug: response.toRef.repository.slug,
            project: {
              key: response.toRef.repository.project?.key || '',
            },
          }
        : undefined,
    },
    state: response.state,
    version: response.version,
  };
}

/**
 * Fetch PR commits from Bitbucket
 *
 * GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/commits
 *
 * @param config - Bitbucket configuration
 * @param project - Project key
 * @param repo - Repository slug
 * @param prId - Pull request ID
 * @returns Array of commits
 */
export async function fetchPRCommits(
  config: BitbucketConfig,
  project: string,
  repo: string,
  prId: string
): Promise<PRCommit[]> {
  const limit = config.commitLimit || 100;
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests/${prId}/commits?limit=${limit}`;

  console.log(`📝 Fetching PR commits: ${project}/${repo}#${prId} (limit: ${limit})`);

  const response = await bitbucketRequest<any>(url, config);

  const commits = response.values || [];

  return commits.map((commit: any) => ({
    id: commit.id,
    message: commit.message,
    author: {
      name: commit.author?.name || 'Unknown',
      emailAddress: commit.author?.emailAddress || '',
    },
    authorTimestamp: commit.authorTimestamp || 0,
  }));
}

/**
 * Fetch PR diff from Bitbucket
 *
 * GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff
 *
 * @param config - Bitbucket configuration
 * @param project - Project key
 * @param repo - Repository slug
 * @param prId - Pull request ID
 * @param contextLines - Number of context lines (default: 5 for reviews, 3 for descriptions)
 * @returns PR diff object
 */
export async function fetchPRDiff(
  config: BitbucketConfig,
  project: string,
  repo: string,
  prId: string,
  contextLines: number = 5
): Promise<PRDiff> {
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests/${prId}/diff?contextLines=${contextLines}&whitespace=show`;

  console.log(`📊 Fetching PR diff: ${project}/${repo}#${prId} (context: ${contextLines} lines)`);

  const response = await bitbucketRequest<PRDiff>(url, config);

  return response;
}

/**
 * Update PR description in Bitbucket
 *
 * PUT /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
 *
 * @param config - Bitbucket configuration
 * @param project - Project key
 * @param repo - Repository slug
 * @param prId - Pull request ID
 * @param description - New description text
 * @param version - Current PR version (required for optimistic locking)
 * @returns Updated PR details
 */
export async function updatePRDescription(
  config: BitbucketConfig,
  project: string,
  repo: string,
  prId: string,
  description: string,
  version: number
): Promise<PRDetails> {
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests/${prId}`;

  console.log(`✏️ Updating PR description: ${project}/${repo}#${prId}`);

  const response = await bitbucketRequest<any>(url, config, {
    method: 'PUT',
    body: JSON.stringify({
      id: parseInt(prId, 10),
      version,
      description,
    }),
  });

  return {
    id: response.id,
    title: response.title,
    description: response.description || '',
    author: {
      name: response.author?.user?.displayName || 'Unknown',
      emailAddress: response.author?.user?.emailAddress || '',
    },
    fromRef: {
      displayId: response.fromRef?.displayId || '',
      id: response.fromRef?.id || '',
    },
    toRef: {
      displayId: response.toRef?.displayId || '',
      id: response.toRef?.id || '',
    },
    state: response.state,
    version: response.version,
  };
}

/**
 * Fetch open PRs from a repository
 *
 * GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests?state=OPEN
 *
 * @param config - Bitbucket configuration
 * @param project - Project key
 * @param repo - Repository slug
 * @returns Array of open PRs
 */
export async function fetchOpenPRs(
  config: BitbucketConfig,
  project: string,
  repo: string
): Promise<PRDetails[]> {
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests?state=OPEN`;

  console.log(`📂 Fetching open PRs: ${project}/${repo}`);

  const response = await bitbucketRequest<any>(url, config);

  const prs = response.values || [];

  return prs.map((pr: any) => ({
    id: pr.id,
    title: pr.title,
    description: pr.description || '',
    author: {
      name: pr.author?.user?.displayName || 'Unknown',
      emailAddress: pr.author?.user?.emailAddress || '',
    },
    fromRef: {
      displayId: pr.fromRef?.displayId || '',
      id: pr.fromRef?.id || '',
      repository: pr.fromRef?.repository
        ? {
            slug: pr.fromRef.repository.slug,
            project: {
              key: pr.fromRef.repository.project?.key || '',
            },
          }
        : undefined,
    },
    toRef: {
      displayId: pr.toRef?.displayId || '',
      id: pr.toRef?.id || '',
      repository: pr.toRef?.repository
        ? {
            slug: pr.toRef.repository.slug,
            project: {
              key: pr.toRef.repository.project?.key || '',
            },
          }
        : undefined,
    },
    state: pr.state,
    version: pr.version,
  }));
}
