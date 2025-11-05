# Claude Code Development Guide

This document provides guidance for Claude Code (and other AI assistants) working on the Upstox PR Automation Platform.

## Project Overview

This is a Next.js 14+ full-stack application that automates:
1. **PR Review Processing** - AI-powered code reviews triggered by webhooks
2. **PR Description Generation** - Automatic PR description creation via scheduled jobs

**Architecture Pattern**: Migrating from N8n node-based workflows to Next.js API routes and server actions.

## Key Technologies

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **AI Services**: Groq SDK, OpenAI SDK
- **APIs**: Bitbucket REST API, Slack Webhooks

## Project Structure

```
/app/api/          - API route handlers (webhook endpoints, cron jobs)
/lib/              - Core business logic (API integrations, utilities)
  /bitbucket/      - Bitbucket API wrapper functions
  /ai/             - AI service integration (Groq/OpenAI)
  /slack/          - Slack API integration
  /utils/          - Utility functions (parsing, batching, retry logic)
/types/            - Shared TypeScript type definitions
/config/           - Centralized configuration (reads from env vars)
/components/       - React components (UI, dashboard, PR views)
```

## Coding Patterns

### 1. API Route Structure

All API routes follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process request
    return NextResponse.json<APIResponse>({
      success: true,
      data: { /* results */ }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
```

### 2. Library Functions

Library functions in `/lib` should:
- Export typed interfaces
- Be pure functions where possible
- Handle errors gracefully
- Support retry logic for external APIs
- Be well-documented with JSDoc comments

Example:
```typescript
/**
 * Fetch PR details from Bitbucket
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
  // Implementation with error handling and retry logic
}
```

### 3. Configuration Management

- All secrets and config come from environment variables
- Use the centralized config in `/config/index.ts`
- Never hardcode API keys, URLs, or credentials
- Always validate configuration before use

### 4. Type Safety

- Use TypeScript types for all function parameters and returns
- Import types from `/types/index.ts` for shared types
- Define module-specific types in the respective `/lib` folder
- Use `APIResponse<T>` for all API route responses

## Implementation Guidelines

### When Implementing Bitbucket Integration (`/lib/bitbucket/`)

1. **Authentication**: Use Basic Auth with username + app password
2. **Base URL**: Constructed from `config.bitbucket.baseUrl`
3. **Endpoints to implement**:
   - `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}`
   - `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/commits`
   - `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff`
   - `PUT /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}`
   - `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests?state=OPEN`
4. **Error Handling**: Wrap in try-catch, use retry logic for transient failures
5. **Response Parsing**: Map Bitbucket API responses to our `PRInfo` type

### When Implementing AI Integration (`/lib/ai/`)

1. **Provider Selection**: Support both Groq and OpenAI based on `config.ai.provider`
2. **Groq SDK**: Use `groq-sdk` package
   ```typescript
   import Groq from 'groq-sdk';
   const groq = new Groq({ apiKey: config.ai.apiKey });
   ```
3. **OpenAI SDK**: Use `openai` package
   ```typescript
   import OpenAI from 'openai';
   const openai = new OpenAI({ apiKey: config.ai.apiKey });
   ```
4. **Prompt Engineering**:
   - For code reviews: Include PR context, file changes, commit messages
   - For descriptions: Include branch names, commit messages, file summary
   - Use structured prompts with clear sections
5. **Response Handling**: Extract text from completion, handle streaming if needed

### When Implementing Slack Integration (`/lib/slack/`)

1. **Webhook Posting**: Use `POST` to `config.slack.webhookUrl`
2. **Message Format**: Use Slack Block Kit format
3. **Chunking**: Messages > 2800 chars must be split (see `chunkMessage` in `/lib/slack/`)
4. **Formatting**:
   - Use code blocks for code snippets
   - Add "View PR" buttons using action blocks
   - Include metadata (PR author, title, etc.)

### When Implementing PR Review Processing (`/app/api/prreview/`)

**Flow**:
1. Parse webhook payload for PR URLs
2. Extract PR components (domain, project, repo, PR ID)
3. For each PR:
   - Fetch PR details, commits, and diff from Bitbucket
   - Split diff into batches (configurable files per batch)
   - For each batch:
     - Build review prompt with context
     - Call AI service
     - Collect response
   - Aggregate all batch reviews
   - Chunk long messages if needed
   - Post to Slack with formatted blocks

**Key Functions to Use**:
- `extractPRUrls()` from `/lib/utils/parse.ts`
- `parsePRUrl()` from `/lib/utils/parse.ts`
- `splitDiffIntoBatches()` from `/lib/utils/parse.ts`
- `processBatch()` from `/lib/utils/batch.ts`
- `fetchPRDetails()`, etc. from `/lib/bitbucket/`
- `generateCodeReview()` from `/lib/ai/`
- `chunkMessage()`, `postSlackMessage()` from `/lib/slack/`

### When Implementing PR Description Generation (`/app/api/prdescription/`)

**Flow**:
1. Fetch open PRs from configured repositories
2. Filter PRs:
   - Author matches configured user
   - Description is empty or < 10 characters
   - Not already processed recently
3. For each filtered PR:
   - Fetch commits and diff
   - Build description prompt
   - Generate description via AI
   - Update PR in Bitbucket
   - Optionally notify via Slack

**Scheduling**: This should be called by the `/app/api/cron/` endpoint

## Common Tasks

### Adding a New Environment Variable

1. Add to `.env.example` with documentation
2. Add to `/config/index.ts` with type and default
3. Add to `validateConfig()` if required
4. Document in README.md environment variables table

### Adding a New Utility Function

1. Create in appropriate `/lib/utils/*.ts` file
2. Export with TypeScript types
3. Add JSDoc documentation
4. Import and use in consuming code

### Adding Error Handling

Use this pattern for retry-able operations:
```typescript
import { withRetry } from '@/lib/utils/batch';

const result = await withRetry(
  async () => {
    // Your operation here
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2
  }
);
```

## Testing Strategy (Future)

When implementing tests:
- Unit tests for utility functions (`/lib/utils/`)
- Integration tests for API routes (`/app/api/`)
- Mock external APIs (Bitbucket, AI services, Slack)
- Use Jest or Vitest
- Test error cases and edge conditions

## N8n Migration Notes

When translating N8n workflows:

| N8n Node | Next.js Pattern | Notes |
|----------|-----------------|-------|
| HTTP Request | `fetch()` or `axios` in `/lib` | Add retry logic |
| Code Node | TypeScript function in `/lib` | Extract to reusable function |
| Split In Batches | `batchArray()` or `processBatch()` | Use utility functions |
| Set Fields | Object transformation | Plain JS/TS |
| If/Switch | `if`/`switch` or ternary | Standard control flow |
| Aggregate | `Array.reduce()` or loops | Standard JS |
| Wait | `setTimeout()` with Promise | For delays |

## Best Practices

1. **Error Messages**: Always include context (which PR, which step failed)
2. **Logging**: Use `console.error()` for errors, `console.log()` for info
3. **Rate Limiting**: Be mindful of API rate limits (add delays if needed)
4. **Secrets**: Never log secrets or API keys
5. **Type Safety**: Always use TypeScript types, avoid `any`
6. **Documentation**: Update README.md when adding new features
7. **Git Commits**: Use conventional commit format (feat:, fix:, chore:, etc.)

## Development Workflow

1. **Read Configuration**: Start by reading `/config/index.ts` and `.env.example`
2. **Check Types**: Review `/types/index.ts` for data structures
3. **Implement Logic**: Write code in `/lib` folders
4. **Create Endpoints**: Wire up logic in `/app/api` routes
5. **Test Locally**: Use `npm run dev` and test with curl or Postman
6. **Update Docs**: Keep README.md and this file updated

## Current State

✅ **Completed**:
- Project initialization
- Folder structure
- Type definitions
- Configuration system
- Placeholder implementations

❌ **Not Yet Implemented**:
- Bitbucket API integration (all functions throw "Not implemented")
- AI service integration (all functions throw "Not implemented")
- Slack integration (all functions throw "Not implemented")
- PR review processing logic
- PR description generation logic
- Cron job implementation
- UI/Dashboard components

## Next Steps

**Priority Order**:
1. Implement Bitbucket API integration (`/lib/bitbucket/index.ts`)
2. Implement AI service integration (`/lib/ai/index.ts`)
3. Implement Slack integration (`/lib/slack/index.ts`)
4. Implement PR review processing (`/app/api/prreview/route.ts`)
5. Implement PR description generation (`/app/api/prdescription/route.ts`)
6. Implement cron job logic (`/app/api/cron/route.ts`)
7. Build UI components and dashboard

## Questions?

When unsure about implementation details:
1. Check the original N8n workflow description (in project requirements)
2. Review Bitbucket API documentation
3. Check Groq/OpenAI SDK documentation
4. Look at existing utility functions in `/lib/utils/`

Remember: This project is a direct translation of N8n workflows. Each API route should follow the same logical flow as the original N8n workflow nodes.
