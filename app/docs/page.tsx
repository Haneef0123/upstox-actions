import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl">
                  U
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Upstox PR Automation
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    API Documentation
                  </p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            API Documentation
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Complete guide to using the Upstox PR Automation Platform APIs
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Overview
            </h3>
            <p className="mb-4 text-slate-600 dark:text-slate-400">
              This platform provides three main API endpoints for automating PR reviews and description generation:
            </p>
            <ul className="list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>/api/prreview</strong> - AI-powered code reviews triggered by Slack webhooks</li>
              <li><strong>/api/prdescription</strong> - Automated PR description generation</li>
              <li><strong>/api/cron</strong> - Scheduled job endpoint for batch processing</li>
            </ul>
          </section>

          {/* PR Review API */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              1. PR Review API
            </h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center space-x-2">
                  <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    POST
                  </span>
                  <code className="text-sm text-slate-700 dark:text-slate-300">/api/prreview</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generates AI code reviews for PRs. Accepts PR URLs from Slack webhooks or direct API calls.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Request Body:</h4>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`{
  "text": "https://bitbucket.company.com/projects/PROJ/repos/repo/pull-requests/123"
}`}
                </pre>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Features:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Extracts PR URLs from Slack message format (supports &lt;url&gt; wrapping)</li>
                  <li>Fetches PR details, commits, and diff from Bitbucket</li>
                  <li>Splits diff into batches (2 files per batch by default)</li>
                  <li>Generates AI review with severity levels: 🔴 🟠 🟡 🟢 ✅</li>
                  <li>Chunks messages for Slack (2800 char limit)</li>
                  <li>Posts results to Slack with 2s delay between chunks</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Response:</h4>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`{
  "success": true,
  "data": {
    "processed": 1,
    "duration": 15234,
    "results": [
      {
        "url": "https://...",
        "success": true
      }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* PR Description API */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              2. PR Description API
            </h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center space-x-2">
                  <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    POST
                  </span>
                  <code className="text-sm text-slate-700 dark:text-slate-300">/api/prdescription</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generates AI-powered descriptions for open PRs with missing or short descriptions.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Request Body:</h4>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`{
  "repos": [
    {
      "project": "GROWTH",
      "repo": "ui-stock-details"
    },
    {
      "project": "GROWTH",
      "repo": "ui-upstox-ipo"
    }
  ],
  "authorFilter": "John Doe",
  "forceUpdate": false,
  "notifySlack": true
}`}
                </pre>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Parameters:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li><strong>repos</strong> - Array of {`{project, repo}`} objects to process</li>
                  <li><strong>authorFilter</strong> (optional) - Only process PRs by this author</li>
                  <li><strong>forceUpdate</strong> (optional) - Update all PRs, even with existing descriptions</li>
                  <li><strong>notifySlack</strong> (optional) - Post Slack notification on success (default: true)</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Features:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Fetches open PRs from specified repositories</li>
                  <li>Filters by description length (default: &lt; 10 characters)</li>
                  <li>Processes diff to extract key changes</li>
                  <li>Generates 5-7 sentence description with file summary</li>
                  <li>Updates PR in Bitbucket automatically</li>
                  <li>Posts Slack notification with description preview</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Response:</h4>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`{
  "success": true,
  "data": {
    "processed": 3,
    "skipped": 7,
    "total": 10,
    "duration": 45123,
    "results": [...]
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Cron API */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              3. Cron Job API
            </h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center space-x-2">
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    GET
                  </span>
                  <code className="text-sm text-slate-700 dark:text-slate-300">/api/cron</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Scheduled endpoint for automated PR description generation. Triggered by cron jobs or external schedulers.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Headers:</h4>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`Authorization: Bearer <CRON_SECRET>`}
                </pre>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  The <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">CRON_SECRET</code> environment variable is required for authentication.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Configuration:</h4>
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                  Reads configuration from environment variables:
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li><strong>CRON_REPO_WHITELIST</strong> - JSON array of repositories to process</li>
                  <li><strong>CRON_AUTHOR_FILTER</strong> - Optional author name filter</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Example with curl:</h4>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`curl -X GET https://your-domain.com/api/cron \\
  -H "Authorization: Bearer your-cron-secret"`}
                </pre>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Scheduling Options:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li><strong>Vercel Cron</strong> - Add to <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">vercel.json</code></li>
                  <li><strong>GitHub Actions</strong> - Use schedule trigger with curl command</li>
                  <li><strong>External Cron</strong> - Any service that can make HTTP requests</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Webhook Setup */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Slack Webhook Setup
            </h3>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                To trigger PR reviews via Slack:
              </p>
              <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Create a Slack Outgoing Webhook or use Slack Workflow Builder</li>
                <li>Configure it to trigger on messages containing PR URLs</li>
                <li>Set the webhook URL to: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">https://your-domain.com/api/prreview</code></li>
                <li>Post a message with a PR URL to your Slack channel</li>
                <li>The bot will automatically generate a review and post results</li>
              </ol>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
                <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
                  Example Slack Message:
                </h4>
                <pre className="text-sm text-blue-800 dark:text-blue-300">
{`Please review: https://bitbucket.company.com/projects/PROJ/repos/repo/pull-requests/123`}
                </pre>
              </div>
            </div>
          </section>

          {/* Error Handling */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Error Handling
            </h3>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                All API endpoints return consistent error responses:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950">
{`{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}`}
              </pre>
              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Common Error Codes:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li><strong>NO_PR_URLS</strong> - No PR URLs found in request</li>
                  <li><strong>NO_REPOS</strong> - No repositories specified</li>
                  <li><strong>UNAUTHORIZED</strong> - Invalid cron secret</li>
                  <li><strong>INVALID_CONFIG</strong> - Invalid configuration format</li>
                  <li><strong>PROCESSING_ERROR</strong> - General processing error</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Rate Limits */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Rate Limits & Best Practices
            </h3>
            <div className="space-y-4">
              <ul className="list-inside list-disc space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><strong>Bitbucket API</strong> - Includes retry logic with exponential backoff (3 retries: 1s, 2s, 4s)</li>
                <li><strong>Slack Posting</strong> - Automatic 2s delay between messages to avoid rate limiting</li>
                <li><strong>AI API</strong> - Respects provider rate limits (Groq/OpenAI)</li>
                <li><strong>Batching</strong> - Diffs are split into batches (2 files per batch) to manage token limits</li>
                <li><strong>Cron Jobs</strong> - Recommended interval: Every 30 minutes (adjust based on load)</li>
              </ul>
            </div>
          </section>

          {/* Additional Resources */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Additional Resources
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Documentation Files:</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li><code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">README.md</code> - Project overview and setup guide</li>
                  <li><code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">N8N_WORKFLOW_ANALYSIS.md</code> - Complete N8n workflow analysis</li>
                  <li><code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">CLAUDE.md</code> - Development guide for contributors</li>
                  <li><code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">.env.example</code> - Environment variable reference</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">External Links:</h4>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>
                    <a href="https://github.com/Haneef0123/upstox-actions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                      GitHub Repository
                    </a>
                  </li>
                  <li>
                    <a href="https://developer.atlassian.com/server/bitbucket/rest/v801/intro/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                      Bitbucket REST API Documentation
                    </a>
                  </li>
                  <li>
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                      Slack Webhooks Documentation
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
