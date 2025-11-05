# AI-Assisted Development Guide

This guide is for AI coding assistants (Claude, ChatGPT, Copilot, Cursor, etc.) working on this project.

## Quick Start for AI Assistants

### First Time in This Codebase?

1. **Read these files in order**:
   - `README.md` - Project overview and architecture
   - `CLAUDE.md` - Detailed implementation guide
   - `AGENTS.md` - Agentic coding patterns
   - `.cursorrules` - Code style and conventions

2. **Understand the structure**:
   ```
   /app/api/       → API endpoints (HTTP handlers)
   /lib/           → Business logic (API clients, utilities)
   /types/         → TypeScript type definitions
   /config/        → Configuration (env var handling)
   /components/    → React components (UI)
   ```

3. **Check the current state**:
   - Run `git log --oneline` to see recent commits
   - Check `README.md` Development Roadmap section
   - Look for "Not implemented" errors in `/lib` files

## Context for AI Code Generation

### Project Purpose
Convert N8n automation workflows into a Next.js web application for:
1. **PR Reviews**: AI-powered code reviews triggered by webhooks
2. **PR Descriptions**: Auto-generate PR descriptions for empty PRs

### Key External Dependencies
- **Bitbucket Server/Data Center API** (REST API v1.0)
- **Groq API** or **OpenAI API** (for AI generation)
- **Slack Incoming Webhooks** (for notifications)

### Data Flow

#### PR Review Flow
```
Slack Webhook → Extract PR URLs → For each PR:
  ├─ Fetch PR details (Bitbucket)
  ├─ Fetch commits (Bitbucket)
  ├─ Fetch diff (Bitbucket)
  ├─ Split diff into batches
  ├─ For each batch:
  │   ├─ Build review prompt
  │   ├─ Generate AI review (Groq/OpenAI)
  │   └─ Collect response
  ├─ Aggregate all reviews
  ├─ Format message (chunk if needed)
  └─ Post to Slack
```

#### PR Description Flow
```
Cron Job → Fetch open PRs (Bitbucket) → Filter PRs:
  ├─ Author matches config
  ├─ Description empty or < 10 chars
  └─ For each filtered PR:
      ├─ Fetch commits (Bitbucket)
      ├─ Fetch diff (Bitbucket)
      ├─ Build description prompt
      ├─ Generate AI description (Groq/OpenAI)
      ├─ Update PR (Bitbucket)
      └─ Notify via Slack (optional)
```

## Implementation Cheat Sheet

### Bitbucket API Endpoints

```typescript
// Base URL: config.bitbucket.baseUrl
// Auth: Basic Auth (username:appPassword in base64)

// Get PR Details
GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}

// Get PR Commits
GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/commits?limit=100

// Get PR Diff
GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff

// Update PR
PUT /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
Body: { id, version, description, ... }

// Get Open PRs
GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests?state=OPEN
```

### Groq API Usage

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: config.ai.apiKey });

const completion = await groq.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a code reviewer...' },
    { role: 'user', content: promptText }
  ],
  model: config.ai.model, // e.g., 'mixtral-8x7b-32768'
  temperature: 0.7,
  max_tokens: 2000,
});

const review = completion.choices[0]?.message?.content || '';
```

### OpenAI API Usage

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: config.ai.apiKey });

const completion = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a code reviewer...' },
    { role: 'user', content: promptText }
  ],
  model: config.ai.model, // e.g., 'gpt-4-turbo-preview'
  temperature: 0.7,
  max_tokens: 2000,
});

const review = completion.choices[0]?.message?.content || '';
```

### Slack Webhook Posting

```typescript
// POST to config.slack.webhookUrl
// Body: JSON with text and/or blocks

await fetch(config.slack.webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Fallback text',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*PR Review Results*\n\n...',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View PR' },
            url: prUrl,
          },
        ],
      },
    ],
  }),
});
```

## Common Implementation Tasks

### Task: Implement fetchPRDetails in /lib/bitbucket/

```typescript
export async function fetchPRDetails(
  config: BitbucketConfig,
  project: string,
  repo: string,
  prId: string
): Promise<PRDetails> {
  // 1. Build URL
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests/${prId}`;

  // 2. Create auth header
  const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');

  // 3. Fetch with retry
  const response = await withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Bitbucket API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  });

  // 4. Map to our type
  return {
    id: response.id,
    title: response.title,
    description: response.description || '',
    author: {
      name: response.author.user.displayName,
      email: response.author.user.emailAddress,
    },
    fromBranch: response.fromRef.displayId,
    toBranch: response.toRef.displayId,
    state: response.state,
    version: response.version,
  };
}
```

### Task: Implement generateCodeReview in /lib/ai/

```typescript
export async function generateCodeReview(
  config: AIConfig,
  request: CodeReviewRequest
): Promise<CodeReviewResponse> {
  // 1. Build prompt
  const prompt = `
You are an expert code reviewer. Review the following pull request changes:

**PR Title**: ${request.prTitle}
**Author**: ${request.prAuthor}
**Branches**: ${request.fromBranch} → ${request.toBranch}

**Recent Commits**:
${request.commits.slice(0, 10).join('\n')}

**File Changes (Batch ${request.batchIndex + 1} of ${request.totalBatches})**:
${request.fileChanges}

Provide a concise code review focusing on:
- Potential bugs or issues
- Code quality and best practices
- Security concerns
- Performance considerations
- Suggestions for improvement
`;

  // 2. Call AI service based on provider
  let reviewText = '';

  if (config.provider === 'groq') {
    const groq = new Groq({ apiKey: config.apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert code reviewer.' },
        { role: 'user', content: prompt }
      ],
      model: config.model || 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 2000,
    });
    reviewText = completion.choices[0]?.message?.content || '';
  } else if (config.provider === 'openai') {
    const openai = new OpenAI({ apiKey: config.apiKey });
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert code reviewer.' },
        { role: 'user', content: prompt }
      ],
      model: config.model || 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 2000,
    });
    reviewText = completion.choices[0]?.message?.content || '';
  }

  // 3. Return response
  return {
    review: reviewText,
    batchIndex: request.batchIndex,
  };
}
```

### Task: Implement PR Review API Route

```typescript
// /app/api/prreview/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, user, channel } = body;

    // 1. Extract PR URLs
    const prUrls = extractPRUrls(text);
    if (prUrls.length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: { message: 'No PR URLs found' },
      }, { status: 400 });
    }

    // 2. Process each PR
    const results = [];
    for (const url of prUrls) {
      const components = parsePRUrl(url);
      if (!components) continue;

      // Fetch PR data
      const [prDetails, commits, diff] = await Promise.all([
        fetchPRDetails(config.bitbucket, components.project, components.repo, components.prId),
        fetchPRCommits(config.bitbucket, components.project, components.repo, components.prId),
        fetchPRDiff(config.bitbucket, components.project, components.repo, components.prId),
      ]);

      // Split diff into batches
      const diffBatches = splitDiffIntoBatches(diff, config.processing.filesPerBatch);

      // Generate reviews for each batch
      const reviews = await processBatch(
        diffBatches,
        async (batch, index) => {
          return generateCodeReview(config.ai, {
            prTitle: prDetails.title,
            prAuthor: prDetails.author.name,
            fromBranch: prDetails.fromBranch,
            toBranch: prDetails.toBranch,
            commits: commits.map(c => c.message),
            fileChanges: batch,
            batchIndex: index,
            totalBatches: diffBatches.length,
          });
        },
        { concurrency: config.processing.batchConcurrency }
      );

      // Aggregate reviews
      const fullReview = reviews.map(r => r.review).join('\n\n---\n\n');

      // Chunk and post to Slack
      const chunks = chunkMessage(fullReview, config.processing.slackMessageMaxLength);
      for (let i = 0; i < chunks.length; i++) {
        const message = formatCodeReviewMessage(
          url,
          prDetails.title,
          chunks[i],
          i,
          chunks.length
        );
        await postSlackMessage(config.slack, message);
      }

      results.push({ url, success: true });
    }

    return NextResponse.json<APIResponse>({
      success: true,
      data: { processed: results.length, results },
    });
  } catch (error) {
    console.error('PR Review error:', error);
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

## Prompting Tips for Humans Working with AI

### When Asking AI to Implement a Feature

**Good Prompt**:
> "Implement the `fetchPRDetails` function in `/lib/bitbucket/index.ts`. It should call the Bitbucket API endpoint `/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}` using Basic Auth, and map the response to our `PRDetails` type. Use the `withRetry` utility for resilience."

**Why it's good**: Specific file, clear requirements, mentions patterns to follow.

**Bad Prompt**:
> "Add Bitbucket support"

**Why it's bad**: Too vague, unclear what needs to be done.

### When Asking AI to Fix a Bug

**Good Prompt**:
> "The `splitDiffIntoBatches` function in `/lib/utils/parse.ts` is not correctly splitting files when the diff contains merge commits. Fix it to handle merge commits by skipping them or treating them as single files."

**Why it's good**: Specific file, clear problem, suggested approach.

**Bad Prompt**:
> "Fix the parsing bug"

**Why it's bad**: No context about which bug or where.

### When Asking AI to Add a Test

**Good Prompt**:
> "Add a unit test for `extractPRUrls` in `/lib/utils/parse.ts`. Test cases should include: valid PR URL, multiple PR URLs in text, invalid URLs, and empty string."

**Why it's good**: Specific function, lists test cases.

## Debugging Tips for AI

### TypeScript Errors

If you see TypeScript errors:
1. Check that all imports are correct
2. Verify types match between function calls
3. Look for missing exports in `/types/index.ts`
4. Check that `@/` imports are correctly configured in `tsconfig.json`

### Runtime Errors

If you encounter runtime errors:
1. Check environment variables in `.env.local`
2. Verify API endpoints are correct
3. Add try-catch blocks around external API calls
4. Check for null/undefined values

### Configuration Errors

If configuration is invalid:
1. Run `validateConfig()` from `/config/index.ts`
2. Check `.env.local` has all required variables
3. Verify variable names match between `.env.example` and `/config/`

## AI Self-Check Before Committing

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] All functions have explicit types
- [ ] Error handling is present for async operations
- [ ] JSDoc comments are added for public functions
- [ ] No hardcoded secrets or API keys
- [ ] Code follows patterns in existing files
- [ ] Documentation is updated if needed
- [ ] Commit message follows conventional format

## Resources for AI Context

### API Documentation Links
- [Bitbucket Server REST API](https://docs.atlassian.com/bitbucket-server/rest/latest/bitbucket-rest.html)
- [Groq API Documentation](https://console.groq.com/docs/quickstart)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Project Documentation
- [README.md](./README.md) - Project overview
- [CLAUDE.md](./CLAUDE.md) - Comprehensive dev guide
- [AGENTS.md](./AGENTS.md) - Agentic patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

## Frequently Asked Questions (for AI)

**Q: Which file should I edit to add a new Bitbucket API function?**
A: `/lib/bitbucket/index.ts`

**Q: Where do I add a new type definition?**
A: `/types/index.ts` for shared types, or in the specific `/lib` folder for module-specific types.

**Q: How do I test my changes locally?**
A: Run `npm run dev`, then use curl or Postman to hit the API endpoints.

**Q: Should I ask the user before implementing a placeholder function?**
A: No, if the function signature and requirements are clear, implement it autonomously.

**Q: What if I need a new environment variable?**
A: Add it to `.env.example`, `/config/index.ts`, and document in `README.md`.

**Q: How do I handle API rate limits?**
A: Use the `withRetry` utility with exponential backoff, and add delays between requests if needed.

## Final Notes for AI Assistants

This project is designed for autonomous AI development. You have:
- ✅ Clear type definitions
- ✅ Established patterns
- ✅ Comprehensive documentation
- ✅ Placeholder functions to implement
- ✅ Configuration system
- ✅ Utility functions for common tasks

You should be able to implement features with minimal human guidance. When in doubt:
1. Check existing code for patterns
2. Follow TypeScript types
3. Read documentation files
4. Ask clarifying questions only when truly ambiguous

Happy coding! 🚀
