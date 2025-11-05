# Upstox PR Automation Platform

A modern, full-stack Next.js application that automates pull request reviews and description generation using AI. This platform replaces N8n workflow automations with a maintainable, scalable web application.

## Features

### 🤖 Batch PR Review Processing
- **Webhook-triggered**: Receives PR URLs from Slack or other sources
- **Batch Processing**: Splits large diffs into manageable batches for AI review
- **AI-Powered Reviews**: Uses Groq or OpenAI to generate comprehensive code reviews
- **Slack Integration**: Posts formatted review results with chunking for long messages

### ✍️ Automatic PR Description Generation
- **Scheduled Jobs**: Runs periodically to find PRs needing descriptions
- **Smart Filtering**: Only processes PRs with missing or inadequate descriptions
- **Context-Aware**: Analyzes commits, diffs, and file changes
- **Auto-Update**: Updates PR descriptions directly in Bitbucket

## Architecture

### Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes & Server Actions
- **AI**: Groq SDK / OpenAI SDK
- **APIs**: Bitbucket REST API, Slack Webhooks
- **Language**: TypeScript

### Project Structure

```
upstox-actions/
├── app/
│   ├── api/
│   │   ├── prreview/         # PR review webhook endpoint
│   │   ├── prdescription/    # PR description generation endpoint
│   │   └── cron/             # Scheduled job endpoint
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── bitbucket/            # Bitbucket API integration
│   ├── ai/                   # AI service integration (Groq/OpenAI)
│   ├── slack/                # Slack API integration
│   └── utils/                # Utility functions (parsing, batching)
├── types/                    # TypeScript type definitions
├── config/                   # Application configuration
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── dashboard/            # Dashboard components
│   └── pr-review/            # PR review components
└── public/                   # Static assets
```

## Documentation

### Core Documentation
- **[N8N_WORKFLOW_ANALYSIS.md](./N8N_WORKFLOW_ANALYSIS.md)** - Comprehensive analysis of the original N8n workflows with all constants, API endpoints, regex patterns, and implementation details
- **[GIT_BRANCHING_STRATEGY.md](./GIT_BRANCHING_STRATEGY.md)** - Git workflow, branching conventions, and PR guidelines

### AI-Assisted Development
- **[CLAUDE.md](./CLAUDE.md)** - Detailed development guide for Claude Code
- **[AGENTS.md](./AGENTS.md)** - Agentic coding patterns and autonomous development workflows
- **[AI_DEVELOPMENT.md](./AI_DEVELOPMENT.md)** - Quick reference guide for all AI assistants
- **[.cursorrules](./.cursorrules)** - Cursor AI specific rules and conventions

### Project Documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[PR_SUMMARY.md](./PR_SUMMARY.md)** - Initial PR summary (historical reference)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Bitbucket account with API access
- Groq or OpenAI API key
- Slack webhook URL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd upstox-actions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in your configuration:
   - Bitbucket credentials
   - AI API key (Groq or OpenAI)
   - Slack webhook URL
   - Processing settings

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### POST /api/prreview
Webhook endpoint for triggering PR reviews.

**Request Body:**
```json
{
  "text": "Review these PRs: https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123",
  "user": "username",
  "channel": "#channel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "PR review processing started",
    "processed": 1
  }
}
```

### POST /api/prdescription
Manual trigger for PR description generation.

**Request Body:**
```json
{
  "repos": ["PROJECT/repo1", "PROJECT/repo2"],
  "forceUpdate": false
}
```

### GET /api/cron
Cron job endpoint for scheduled tasks.

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BITBUCKET_BASE_URL` | Bitbucket server URL | Yes | - |
| `BITBUCKET_USERNAME` | Bitbucket username | Yes | - |
| `BITBUCKET_APP_PASSWORD` | Bitbucket app password | Yes | - |
| `AI_PROVIDER` | AI provider ('groq' or 'openai') | Yes | groq |
| `AI_API_KEY` | AI service API key | Yes | - |
| `AI_MODEL` | AI model to use | No | mixtral-8x7b-32768 |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | Yes | - |
| `SLACK_DEFAULT_CHANNEL` | Default Slack channel | No | #pr-reviews |
| `FILES_PER_BATCH` | Files per AI review batch | No | 10 |
| `MAX_COMMITS_PER_REVIEW` | Max commits in review | No | 10 |
| `BATCH_CONCURRENCY` | Concurrent batch limit | No | 3 |
| `CRON_SECRET` | Cron auth token | No | - |

### Setting up Cron Jobs

For scheduled PR description generation, configure a cron job to call the `/api/cron` endpoint:

**Vercel Cron (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "*/15 * * * *"
  }]
}
```

**External Cron:**
```bash
# Every 15 minutes
*/15 * * * * curl -X GET https://your-domain.com/api/cron -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## N8n to Next.js Mapping

| N8n Component | Next.js Replacement | Location |
|---------------|-------------------|----------|
| Webhook Trigger | API Route | `/app/api/prreview/route.ts` |
| HTTP Request | Fetch/Axios | `/lib/bitbucket/index.ts` |
| Code Node | TypeScript Function | `/lib/utils/*.ts` |
| Split In Batches | Array Processing | `/lib/utils/batch.ts` |
| AI Generation | SDK Calls | `/lib/ai/index.ts` |
| Schedule Trigger | Cron Job | `/app/api/cron/route.ts` |
| Slack Request | Webhook Post | `/lib/slack/index.ts` |

## Development Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Project initialization
- [x] Folder structure setup
- [x] Type definitions
- [x] Configuration system

### Phase 2: API Integrations (To Do)
- [ ] Bitbucket API implementation
- [ ] AI service integration (Groq/OpenAI)
- [ ] Slack webhook integration
- [ ] Error handling & retries

### Phase 3: Core Features (To Do)
- [ ] PR review batch processing
- [ ] PR description generation
- [ ] Cron job implementation
- [ ] Message chunking & formatting

### Phase 4: UI/Dashboard (To Do)
- [ ] PR dashboard
- [ ] Review results display
- [ ] Admin settings page
- [ ] Job status monitoring

### Phase 5: Testing & Deployment (To Do)
- [ ] Unit tests
- [ ] Integration tests
- [ ] CI/CD pipeline
- [ ] Production deployment

## Contributing

This is a work in progress. Contributions are welcome!

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
