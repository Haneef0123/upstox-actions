import Link from 'next/link';

export default function SettingsPage() {
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
                    Settings & Configuration
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
                href="/docs"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Documentation
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Settings & Configuration
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Configure your environment variables and system settings. All settings are read from environment variables.
          </p>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6">
          {/* Bitbucket Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Bitbucket Configuration
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  BITBUCKET_BASE_URL
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Bitbucket server URL
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  BITBUCKET_USERNAME
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  API username
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  BITBUCKET_APP_PASSWORD
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  App password/token
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  BITBUCKET_COMMIT_LIMIT
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 100
                </span>
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                AI Configuration
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  AI_PROVIDER
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  groq or openai
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  AI_API_KEY
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  API key
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  AI_MODEL
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: openai/gpt-oss-120b
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  AI_TEMPERATURE
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 1
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  AI_MAX_TOKENS
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 8192
                </span>
              </div>
            </div>
          </div>

          {/* Slack Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Slack Configuration
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  SLACK_WEBHOOK_URL
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Incoming webhook URL
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  SLACK_MESSAGE_MAX_LENGTH
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 2800
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  SLACK_WAIT_BETWEEN_POSTS
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 2000ms
                </span>
              </div>
            </div>
          </div>

          {/* PR Review Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                PR Review Settings
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  REVIEW_FILES_PER_BATCH
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 2
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  REVIEW_CONTEXT_LINES
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 5
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  REVIEW_MAX_COMMITS
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 10
                </span>
              </div>
            </div>
          </div>

          {/* PR Description Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                PR Description Settings
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  DESCRIPTION_CONTEXT_LINES
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 3
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  DESCRIPTION_MIN_LENGTH
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: 10
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  CRON_PR_DESCRIPTION_INTERVAL
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Default: */10 * * * *
                </span>
              </div>
            </div>
          </div>

          {/* Cron Job Configuration */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Cron Job Settings
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  CRON_SECRET
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Authorization token
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  CRON_REPO_WHITELIST
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  JSON array of repos
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  CRON_AUTHOR_FILTER
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Author name filter
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
            How to Configure
          </h3>
          <p className="mb-4 text-sm text-blue-800 dark:text-blue-300">
            All settings are managed via environment variables. To configure:
          </p>
          <ol className="list-inside list-decimal space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>Copy <code className="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900/30">.env.example</code> to <code className="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900/30">.env.local</code></li>
            <li>Update the values with your actual credentials and settings</li>
            <li>Restart the Next.js development server or rebuild for production</li>
            <li>Check the <Link href="/docs" className="font-medium underline">Documentation</Link> for detailed configuration guides</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
