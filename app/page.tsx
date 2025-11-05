import Link from 'next/link';
import { StatusCards } from '@/components/StatusCards';
import { TriggerForms } from '@/components/TriggerForms';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl">
                U
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Upstox PR Automation
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-Powered Code Review & PR Management
                </p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/docs"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Documentation
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
        {/* Hero Section */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-lg">
          <h2 className="mb-2 text-3xl font-bold">Welcome to PR Automation Platform</h2>
          <p className="mb-6 text-blue-100">
            Automate code reviews and PR descriptions using AI. Powered by Groq/OpenAI and integrated with Bitbucket & Slack.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm">🤖</span>
              </div>
              <span className="text-sm">AI Code Reviews</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm">📝</span>
              </div>
              <span className="text-sm">Auto PR Descriptions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm">⏰</span>
              </div>
              <span className="text-sm">Scheduled Jobs</span>
            </div>
          </div>
        </div>

        {/* API Status Cards */}
        <StatusCards />

        {/* Manual Trigger Section */}
        <div className="mt-8">
          <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Manual Triggers
          </h3>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Manually trigger PR reviews or description generation for specific PRs or repositories.
          </p>
          <TriggerForms />
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Link
            href="/docs"
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              📚
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              API Documentation
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Learn how to use the API endpoints and configure webhooks
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
              View Docs →
            </span>
          </Link>

          <Link
            href="/settings"
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              ⚙️
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Settings
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configure repositories, AI models, and Slack integrations
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
              Configure →
            </span>
          </Link>

          <a
            href="https://github.com/Haneef0123/upstox-actions"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              💻
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              GitHub Repository
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View source code, report issues, and contribute
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
              Open GitHub →
            </span>
          </a>
        </div>

        {/* Footer Info */}
        <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                About This Platform
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This platform automates PR reviews and description generation using AI. It's built with Next.js 14+,
                integrates with Bitbucket REST API, and uses Groq/OpenAI for intelligent code analysis.
                Originally migrated from N8n workflows to a full-stack TypeScript application.
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                Features
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>✅ Automated AI code reviews with severity levels</li>
                <li>✅ Smart PR description generation</li>
                <li>✅ Slack notifications with rich formatting</li>
                <li>✅ Scheduled cron jobs for batch processing</li>
                <li>✅ Webhook support for real-time triggers</li>
                <li>✅ Configurable batching and rate limiting</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
