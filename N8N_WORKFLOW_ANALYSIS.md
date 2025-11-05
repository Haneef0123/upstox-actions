# N8n Workflow Analysis

This document contains a comprehensive analysis of the two N8n workflows that this Next.js application is replacing.

## Table of Contents
1. [Workflow 1: PR Review - Batch Processing](#workflow-1-pr-review---batch-processing)
2. [Workflow 2: PR Description Agent](#workflow-2-pr-description-agent)
3. [Constants and Configuration](#constants-and-configuration)
4. [API Endpoints and Authentication](#api-endpoints-and-authentication)
5. [AI Model Configuration](#ai-model-configuration)
6. [Implementation Notes](#implementation-notes)

---

## Workflow 1: PR Review - Batch Processing

### Purpose
Automated AI-powered code review triggered by Slack message actions containing PR URLs.

### Flow Diagram
```
Slack Webhook (POST)
  ↓
Extract PR URLs from message
  ↓
Parse Bitbucket URL components
  ↓
Fetch PR Details → Fetch Commits → Fetch Diff
  ↓
Merge all data
  ↓
Split diff into batches (2 files per batch)
  ↓
For each batch:
  ├─ Prepare review prompt
  ├─ Call Groq AI API
  └─ Extract review
  ↓
Aggregate all reviews
  ↓
Split for Slack (2800 char chunks)
  ↓
Post to Slack (with 2s delay between chunks)
```

### Key Implementation Details

#### 1. Webhook Trigger
- **Path**: `/pr_review`
- **Method**: POST
- **Expected Payload**: Slack message action payload
```json
{
  "payload": {
    "message": {
      "text": "Message with PR URLs"
    },
    "user": {
      "username": "user.name",
      "name": "Display Name",
      "id": "U1234567"
    },
    "channel": {
      "id": "C1234567"
    },
    "response_url": "https://hooks.slack.com/..."
  }
}
```

#### 2. PR URL Extraction
**Regex Pattern**:
```javascript
/<?(https?:\/\/[^\s>]*?(?:pull-requests|pull)\/\d+[^\s>]*)>?/gi
```

**Supports**:
- Bitbucket: `https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123`
- GitHub: `https://github.com/owner/repo/pull/123`
- Slack-wrapped URLs: `<https://...>`

#### 3. Bitbucket URL Parsing
**Pattern**:
```javascript
/https?:\/\/([^\/]+)\/projects\/([^\/]+)\/repos\/([^\/]+)\/pull-requests\/(\d+)/
```

**Extracts**:
- Domain: `bitbucket.example.com`
- Project: `PROJECT_KEY`
- Repository: `repo-slug`
- PR ID: `123`

#### 4. Bitbucket API Calls

**PR Details**:
```
GET {baseUrl}/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
```

**PR Commits**:
```
GET {baseUrl}/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/commits?limit=100
```

**PR Diff**:
```
GET {baseUrl}/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff?contextLines=5&whitespace=show
```

#### 5. Batch Processing
**Files Per Batch**: `2` (configurable constant)

Why batching:
- Large PRs exceed AI token limits
- Better focused reviews per batch
- Prevents API timeouts

#### 6. AI Review Prompt Structure
```markdown
You are an expert code reviewer. Review this batch of files from a Pull Request.

## PR INFO (Batch X/Y)
**{Title}** by {Author}
{Project}/{Repo}: {fromBranch} → {toBranch}

## FILES IN THIS BATCH
{file changes with code diff}

## OUTPUT FORMAT
Start with: "### Batch X/Y Review"

**🔴 Critical Issues**
- [file]: [issue description]

**🟠 High Priority**
- [file]: [issue description]

**🟡 Medium Priority**
- [file]: [issue description]

**🟢 Low Priority**
- [file]: [issue description]

**✅ Positive Points**
- [observation]

Keep each line under 120 characters. If no issues in a category, write "• None found"
```

#### 7. Slack Message Format
**Max Characters**: `2800` per message (Slack limit ~3000, buffer for safety)

**Structure**:
```json
{
  "text": "🤖 AI Code Review (Part X/Y)",
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "🤖 AI Code Review (X/Y)"}
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*PR:*\n{title}"},
        {"type": "mrkdwn", "text": "*Author:*\n{author}"}
      ]
    },
    {"type": "divider"},
    {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "{review chunk}"}
    },
    // Only on last chunk:
    {
      "type": "actions",
      "elements": [{
        "type": "button",
        "text": {"type": "plain_text", "text": "View PR"},
        "url": "{prUrl}"
      }]
    }
  ]
}
```

**Wait Between Posts**: `2 seconds` (prevents Slack rate limiting)

---

## Workflow 2: PR Description Agent

### Purpose
Automated PR description generation for open PRs with missing or inadequate descriptions.

### Flow Diagram
```
Schedule Trigger (every 10 minutes)
  ↓
List configured repositories
  ↓
For each repo: Fetch open PRs
  ↓
Filter PRs:
  ├─ Author matches configured user
  ├─ Description empty or < 10 chars
  └─ Not already processed
  ↓
For each filtered PR:
  ├─ Fetch commits (limit 100)
  ├─ Fetch diff (contextLines 3)
  ├─ Prepare smart prompt
  ├─ Generate description with AI
  ├─ Update PR via Bitbucket API
  └─ Notify via Slack
```

### Key Implementation Details

#### 1. Schedule Trigger
**Interval**: Every `10 minutes`

**Cron Expression**: `*/10 * * * *`

#### 2. Repository Configuration
**Hardcoded List** (should be made configurable):
```javascript
const repos = [
  { project: "GROWTH", repo: "ui-upstox-ipo" },
  { project: "GROWTH", repo: "ui-stock-details" },
  { project: "GROWTH", repo: "ui-trade-price-verification-tool" },
  { project: "GROWTH", repo: "ui-span-calculator" },
  { project: "GROWTH", repo: "ui-landing-pages" },
  { project: "GROWTH", repo: "ui-calculators" },
  { project: "GROWTH", repo: "ui-pro-website-pages" }
];
```

#### 3. Author Filtering
**Configured Author**: `haneef.shaik@rksv.in`

**Matching Logic**:
```javascript
const isMyPR = (
  authorEmail === MY_USERNAME ||
  authorUsername === MY_USERNAME ||
  authorEmail.toLowerCase().includes(MY_USERNAME.toLowerCase())
);
```

#### 4. Description Criteria
**Needs Description If**:
```javascript
const needsDescription = (
  !pr.description ||
  pr.description === '' ||
  pr.description.trim() === '' ||
  pr.description === 'No description' ||
  pr.description.length < 10
);
```

**Minimum Length**: `10 characters`

#### 5. Diff Analysis
**Context Lines**: `3` (vs 5 for reviews - less context needed for descriptions)

**Key Changes Extraction**:
- Maximum `5 added lines` per file
- Maximum `5 removed lines` per file
- Line length limit: `150 characters`
- Commit message limit: `80 characters`
- Skip:
  - Empty lines
  - Brace-only lines: `^[{}()\[\];,\s]$`
  - Comment lines starting with `//`, `/*`, `*`, `<!--`

#### 6. AI Description Prompt Structure
```markdown
You are an expert code reviewer generating a clear and professional PR description.

**Pull Request Information:**
Title: {title}
Branch: {fromBranch} → {toBranch}
Author: {author}

**Commit History (Developer Intent):**
📝 Commits ({count}):
1. {commit message 1}
2. {commit message 2}
...

**Code Changes (Technical Details):**
📊 File Changes: {count} files
+{added} lines added, -{removed} lines removed

🆕 New Files ({count}):
• {file} (+{lines})

🗑️ Deleted Files ({count}):
• {file} (-{lines})

📝 Modified Files (top 10 of {total}):

📄 {file}
Changes: +{added} -{removed}
Key changes:
 + {added line}
 - {removed line}

**Task:**
Generate a comprehensive PR description (5-7 sentences) that:
1. **Summarizes the changes** - What was done? (use commit messages for context)
2. **Explains the purpose** - Why was this needed? (business value)
3. **Highlights key technical changes** - Which files/features were modified?
4. **Notes important details** - New dependencies, breaking changes, etc.

**Format Guidelines:**
- Start with a brief overview paragraph
- Use bullet points for listing multiple features/changes
- Keep it professional and actionable for reviewers
- Focus on the "what" and "why", not just the "how"

**Example Structure:**
This PR implements [feature/fix] to [business purpose]. The changes include [key modifications].

**Key Changes:**
- Feature 1: [description]
- Feature 2: [description]

**Technical Details:**
- [Important technical note]
```

#### 7. Bitbucket PR Update
**Endpoint**:
```
PUT {baseUrl}/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
```

**Body**:
```json
{
  "id": 123,
  "version": 42,
  "description": "AI-generated description"
}
```

**Important**: Must include current `version` number to prevent conflicts.

#### 8. Success Notification to Slack
```json
{
  "text": "✅ Your PR Description Auto-Generated",
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "✅ PR Description Auto-Generated"}
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "PR #{prId}\n{title}\n\nRepository: {repo}\nAuthor: {author}\n\nGenerated Description:\n{description}"
      }
    },
    {
      "type": "actions",
      "elements": [{
        "type": "button",
        "text": {"type": "plain_text", "text": "View Pull Request"},
        "url": "{prUrl}",
        "style": "primary"
      }]
    }
  ]
}
```

---

## Constants and Configuration

### Processing Constants
```typescript
export const CONSTANTS = {
  // PR Review Processing
  REVIEW_FILES_PER_BATCH: 2,                  // Files per AI review batch
  REVIEW_CONTEXT_LINES: 5,                    // Diff context lines for reviews
  REVIEW_MAX_COMMITS: 10,                     // Max commits to include in review
  REVIEW_LINE_LENGTH_LIMIT: 120,             // Max chars per review line

  // PR Description Generation
  DESCRIPTION_CONTEXT_LINES: 3,               // Diff context lines for descriptions
  DESCRIPTION_MIN_LENGTH: 10,                 // Min chars to consider "has description"
  DESCRIPTION_MAX_COMMITS: 10,                // Max commits to include
  DESCRIPTION_MAX_KEY_CHANGES_PER_FILE: 5,    // Max added/removed lines per file
  DESCRIPTION_LINE_LENGTH_LIMIT: 150,         // Max chars for key changes
  DESCRIPTION_COMMIT_LENGTH_LIMIT: 80,        // Max chars for commit messages
  DESCRIPTION_TOP_MODIFIED_FILES: 10,         // Show top N modified files

  // Slack Configuration
  SLACK_MESSAGE_MAX_LENGTH: 2800,             // Max chars per Slack message
  SLACK_WAIT_BETWEEN_POSTS: 2000,             // Milliseconds between posts

  // Bitbucket API
  BITBUCKET_COMMIT_LIMIT: 100,                // Max commits to fetch

  // Schedule
  DESCRIPTION_CRON_INTERVAL: "*/10 * * * *"   // Every 10 minutes
};
```

### Environment Variables (Required)
```bash
# Bitbucket Configuration
BITBUCKET_BASE_URL=https://bitbucket.upstox.com
BITBUCKET_USERNAME=your-username
BITBUCKET_APP_PASSWORD=your-app-password

# AI Configuration (Groq)
AI_PROVIDER=groq
AI_API_KEY=your-groq-api-key
AI_MODEL=openai/gpt-oss-120b
AI_TEMPERATURE=1
AI_MAX_TOKENS=8192
AI_REASONING_EFFORT=medium

# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PR Description Agent
PR_DESCRIPTION_AUTHOR_EMAIL=haneef.shaik@rksv.in
PR_DESCRIPTION_REPOS=GROWTH/ui-upstox-ipo,GROWTH/ui-stock-details,GROWTH/ui-trade-price-verification-tool,GROWTH/ui-span-calculator,GROWTH/ui-landing-pages,GROWTH/ui-calculators,GROWTH/ui-pro-website-pages

# Processing
FILES_PER_BATCH=2
MAX_COMMITS_PER_REVIEW=10
SLACK_MESSAGE_MAX_LENGTH=2800
BATCH_CONCURRENCY=3
```

---

## API Endpoints and Authentication

### Bitbucket API

**Base URL**: `https://bitbucket.upstox.com`

**Authentication**: HTTP Header (Basic Auth)
```
Authorization: Basic {base64(username:appPassword)}
```

**Endpoints**:

1. **Get PR Details**
   ```
   GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
   ```

2. **Get PR Commits**
   ```
   GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/commits
   Query: limit=100
   ```

3. **Get PR Diff**
   ```
   GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff
   Query: contextLines=5&whitespace=show
   ```

4. **Update PR**
   ```
   PUT /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}
   Body: { id, version, description, ... }
   ```

5. **Get Open PRs**
   ```
   GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests
   Query: state=OPEN
   ```

### Groq AI API

**Base URL**: `https://api.groq.com`

**Authentication**: HTTP Header
```
Authorization: Bearer {apiKey}
```

**Endpoint**:
```
POST /openai/v1/chat/completions
Content-Type: application/json

Body:
{
  "messages": [
    {"role": "user", "content": "{prompt}"}
  ],
  "model": "openai/gpt-oss-120b",
  "temperature": 1,
  "max_completion_tokens": 8192,
  "top_p": 1,
  "stream": false,
  "reasoning_effort": "medium",
  "stop": null
}
```

### Slack Webhook API

**URL**: `https://hooks.slack.com/services/{your-webhook-path}`

**Method**: POST

**Authentication**: None (webhook URL contains auth token)

**Content-Type**: `application/json`

---

## AI Model Configuration

### Model Details
**Provider**: Groq
**Model**: `openai/gpt-oss-120b`
**Type**: Large language model (120B parameters)

### Request Parameters
```json
{
  "model": "openai/gpt-oss-120b",
  "temperature": 1,
  "max_completion_tokens": 8192,
  "top_p": 1,
  "stream": false,
  "reasoning_effort": "medium",
  "stop": null
}
```

**Parameter Explanations**:
- **temperature: 1** - Balanced creativity vs consistency
- **max_completion_tokens: 8192** - Allow long reviews/descriptions
- **top_p: 1** - Consider full probability distribution
- **stream: false** - Get complete response (required for N8n)
- **reasoning_effort: "medium"** - Balanced thinking depth

---

## Implementation Notes

### 1. Regex Patterns to Implement

#### PR URL Extraction
```typescript
export function extractPRUrls(message: string): string[] {
  const prUrlRegex = /<?(https?:\/\/[^\s>]*?(?:pull-requests|pull)\/\d+[^\s>]*)>?/gi;
  const matches = message.match(prUrlRegex);
  return matches ? matches.map(m => m.replace(/[<>]/g, '').trim()) : [];
}
```

#### Bitbucket URL Parsing
```typescript
export function parseBitbucketPRUrl(url: string): PRUrlComponents | null {
  const regex = /https?:\/\/([^\/]+)\/projects\/([^\/]+)\/repos\/([^\/]+)\/pull-requests\/(\d+)/;
  const match = url.match(regex);

  if (!match) return null;

  return {
    domain: match[1],
    project: match[2],
    repo: match[3],
    prId: match[4],
    fullUrl: url
  };
}
```

### 2. Diff Processing

#### Skip Lines Pattern
```typescript
const shouldSkipLine = (line: string): boolean => {
  const trimmed = line.trim();

  // Empty lines
  if (!trimmed) return true;

  // Brace-only lines
  if (/^[{}()\[\];,\s]$/.test(trimmed)) return true;

  // Comment lines
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('/*')) return true;
  if (trimmed.startsWith('*')) return true;
  if (trimmed.startsWith('<!--')) return true;

  return false;
};
```

### 3. Batch Processing Logic

```typescript
export function splitDiffIntoBatches(
  diffs: DiffEntry[],
  filesPerBatch: number = 2
): DiffEntry[][] {
  const batches: DiffEntry[][] = [];

  for (let i = 0; i < diffs.length; i += filesPerBatch) {
    batches.push(diffs.slice(i, i + filesPerBatch));
  }

  return batches;
}
```

### 4. Slack Message Chunking

```typescript
export function chunkMessage(
  message: string,
  maxChars: number = 2800
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  const lines = message.split('\n');

  for (const line of lines) {
    if ((currentChunk + line + '\n').length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      // If single line exceeds limit, truncate it
      if (line.length > maxChars) {
        chunks.push(line.substring(0, maxChars - 3) + '...');
        continue;
      }
    }

    currentChunk += line + '\n';
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
```

### 5. Author Matching

```typescript
export function isAuthorMatch(
  prAuthor: { name: string; email: string },
  configuredUser: string
): boolean {
  return (
    prAuthor.email === configuredUser ||
    prAuthor.name === configuredUser ||
    prAuthor.email.toLowerCase().includes(configuredUser.toLowerCase())
  );
}
```

### 6. Wait/Delay Implementation

```typescript
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage:
await delay(2000); // Wait 2 seconds before next Slack post
```

---

## Migration Checklist

### Phase 2: API Integrations
- [ ] Implement Bitbucket API client with all 5 endpoints
- [ ] Implement Groq API client
- [ ] Implement Slack webhook poster
- [ ] Add retry logic with exponential backoff
- [ ] Add proper error handling

### Phase 3: Core Features
- [ ] Implement PR URL extraction and parsing
- [ ] Implement diff processing and batching
- [ ] Implement AI review prompt builder
- [ ] Implement AI description prompt builder
- [ ] Implement Slack message formatter
- [ ] Implement message chunking logic
- [ ] Wire up PR review API route
- [ ] Wire up PR description API route
- [ ] Implement cron job logic

### Phase 4: Configuration
- [ ] Move all constants to `/config/index.ts`
- [ ] Add all environment variables to `.env.example`
- [ ] Implement repository whitelist configuration
- [ ] Implement author filtering configuration
- [ ] Add validation for all config values

### Phase 5: Testing
- [ ] Unit tests for URL parsing
- [ ] Unit tests for diff processing
- [ ] Unit tests for message chunking
- [ ] Integration tests for API routes
- [ ] Mock Bitbucket API responses
- [ ] Mock Groq API responses

---

## Security Considerations

### 1. Webhook Validation
The N8n workflow does not validate Slack webhooks. Consider adding:
- Slack signing secret verification
- Request timestamp validation
- Signature verification

### 2. Rate Limiting
Implement rate limiting for:
- Incoming webhooks (prevent abuse)
- Bitbucket API calls (respect their limits)
- Groq API calls (token limits)
- Slack webhook posts (rate limit protection)

### 3. Secrets Management
- Never log API keys or tokens
- Store all credentials in environment variables
- Use encryption for sensitive data at rest
- Rotate credentials regularly

### 4. Input Validation
- Validate PR URLs before processing
- Sanitize Slack message content
- Validate Bitbucket responses
- Escape special characters in AI prompts

---

## Performance Optimizations

### 1. Parallel Processing
Fetch PR details, commits, and diff in parallel:
```typescript
const [prDetails, commits, diff] = await Promise.all([
  fetchPRDetails(...),
  fetchPRCommits(...),
  fetchPRDiff(...)
]);
```

### 2. Caching
Consider caching:
- PR details (short TTL: 5 minutes)
- Open PRs list (TTL: 10 minutes)
- Already processed PRs (persistent)

### 3. Batch Concurrency
Process AI requests with controlled concurrency:
```typescript
await processBatch(batches, async (batch) => {
  return generateReview(batch);
}, { concurrency: 3 });
```

### 4. Database (Future)
For tracking processed PRs and review history:
- Store processed PR IDs with timestamps
- Store review history
- Store error logs
- Query for analytics

---

## Monitoring and Logging

### Key Metrics to Track
1. **Webhook Events**:
   - Total received
   - Successful vs failed
   - Processing time

2. **PR Reviews**:
   - PRs reviewed per day
   - Average review time
   - AI tokens used
   - Batches processed

3. **PR Descriptions**:
   - PRs processed per run
   - Success rate
   - Update failures

4. **API Performance**:
   - Bitbucket API response times
   - Groq API response times
   - Slack posting success rate
   - Retry counts

### Logging Strategy
```typescript
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📨 Slack Message Action Received');
console.log('  User:', userName);
console.log('  Found PRs:', matches.length);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
```

---

## Conclusion

This analysis provides a complete blueprint for implementing both N8n workflows in Next.js. All constants, patterns, and logic have been extracted and documented for implementation in Phases 2-4.

**Next Steps**:
1. Update `/config/index.ts` with all constants
2. Update `.env.example` with new variables
3. Implement API clients in `/lib`
4. Wire up logic in `/app/api` routes
5. Test with real data
