'use client';

import { useState } from 'react';

export function TriggerForms() {
  const [prReviewUrl, setPrReviewUrl] = useState('');
  const [prReviewLoading, setPrReviewLoading] = useState(false);
  const [prReviewResult, setPrReviewResult] = useState<string | null>(null);

  const [repos, setRepos] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [prDescLoading, setPrDescLoading] = useState(false);
  const [prDescResult, setPrDescResult] = useState<string | null>(null);

  const handlePRReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrReviewLoading(true);
    setPrReviewResult(null);

    try {
      const response = await fetch('/api/prreview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prReviewUrl,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }

      const data = await response.json();

      if (data.success) {
        setPrReviewResult(
          `✅ Success! Processed ${data.data.processed} PR(s). Check Slack for results.`
        );
        setPrReviewUrl('');
      } else {
        setPrReviewResult(`❌ Error: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setPrReviewResult(
        `❌ Error: ${error instanceof Error ? error.message : 'Failed to trigger review'}`
      );
    } finally {
      setPrReviewLoading(false);
    }
  };

  const handlePRDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrDescLoading(true);
    setPrDescResult(null);

    try {
      // Parse repos from comma-separated format
      const reposList = repos.split(',').map((repo) => {
        const [project, repoName] = repo.trim().split('/');
        return { project, repo: repoName };
      });

      const response = await fetch('/api/prdescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repos: reposList,
          authorFilter: authorFilter || undefined,
          notifySlack: true,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }

      const data = await response.json();

      if (data.success) {
        setPrDescResult(
          `✅ Success! Processed ${data.data.processed} PR(s), skipped ${data.data.skipped}.`
        );
      } else {
        setPrDescResult(`❌ Error: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setPrDescResult(
        `❌ Error: ${error instanceof Error ? error.message : 'Failed to trigger description generation'}`
      );
    } finally {
      setPrDescLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* PR Review Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-2xl dark:bg-blue-900/30">
            🤖
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Trigger PR Review
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get AI code review for a PR
            </p>
          </div>
        </div>

        <form onSubmit={handlePRReview} className="space-y-4">
          <div>
            <label
              htmlFor="prUrl"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              PR URL
            </label>
            <input
              type="text"
              id="prUrl"
              value={prReviewUrl}
              onChange={(e) => setPrReviewUrl(e.target.value)}
              placeholder="https://bitbucket.company.com/projects/PROJ/repos/repo/pull-requests/123"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              required
              disabled={prReviewLoading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enter the full Bitbucket PR URL
            </p>
          </div>

          <button
            type="submit"
            disabled={prReviewLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
          >
            {prReviewLoading ? 'Processing...' : 'Generate Review'}
          </button>

          {prReviewResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                prReviewResult.startsWith('✅')
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {prReviewResult}
            </div>
          )}
        </form>
      </div>

      {/* PR Description Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-2xl dark:bg-purple-900/30">
            📝
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Generate PR Descriptions
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auto-generate descriptions for open PRs
            </p>
          </div>
        </div>

        <form onSubmit={handlePRDescription} className="space-y-4">
          <div>
            <label
              htmlFor="repos"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Repositories
            </label>
            <input
              type="text"
              id="repos"
              value={repos}
              onChange={(e) => setRepos(e.target.value)}
              placeholder="PROJECT/repo1,PROJECT/repo2"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              required
              disabled={prDescLoading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Comma-separated list of PROJECT/repo
            </p>
          </div>

          <div>
            <label
              htmlFor="author"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Author Filter (Optional)
            </label>
            <input
              type="text"
              id="author"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              disabled={prDescLoading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Only process PRs by this author
            </p>
          </div>

          <button
            type="submit"
            disabled={prDescLoading}
            className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
          >
            {prDescLoading ? 'Processing...' : 'Generate Descriptions'}
          </button>

          {prDescResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                prDescResult.startsWith('✅')
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {prDescResult}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
