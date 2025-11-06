# Serverless Function Timeout Troubleshooting

## The Problem

You may encounter **504 Gateway Timeout** errors when using the PR Review endpoint (`/api/prreview`) on serverless platforms like Netlify or Vercel.

### Platform Timeout Limits

- **Netlify Free**: 10 seconds
- **Netlify Pro**: 26 seconds
- **Vercel Hobby**: 10 seconds
- **Vercel Pro**: 60 seconds

### Why Timeouts Occur

The PR review process involves multiple time-consuming operations:

1. **Fetching PR data** from Bitbucket (1-3 seconds)
2. **AI code reviews** for each batch (3-10 seconds per batch)
3. **Slack message posting** with delays between posts (2 seconds per chunk)

**Example Calculation:**
- PR with 10 files = 5 batches (2 files/batch)
- 5 AI calls × 5 seconds each = 25 seconds
- 3 Slack chunks × 2 seconds delay = 6 seconds
- **Total: 31+ seconds** → **Exceeds most serverless limits**

---

## Solutions Implemented

### 1. Parallel Batch Processing ✅

**What changed:** AI review batches now process in parallel instead of sequentially.

**Configuration:**
```bash
# .env
BATCH_CONCURRENCY=3  # Process up to 3 batches simultaneously
```

**Impact:**
- Before: 5 batches × 5 seconds = 25 seconds
- After: 5 batches ÷ 3 concurrent = ~10 seconds

### 2. Optimized Slack Delays ✅

**What changed:** Slack posting delay is automatically capped at 500ms (instead of 2000ms) to prevent timeouts.

**Configuration:**
```bash
# .env
SLACK_WAIT_BETWEEN_POSTS=500  # Reduced from 2000ms
# Or set to 0 to disable delays entirely (may hit rate limits)
```

**Impact:**
- Before: 5 chunks × 2 seconds = 10 seconds
- After: 5 chunks × 0.5 seconds = 2.5 seconds

### 3. Reduced Files Per Batch

**What to do:** Decrease the number of files processed per batch to reduce AI call complexity.

**Configuration:**
```bash
# .env
REVIEW_FILES_PER_BATCH=1  # Default is 2
```

**Trade-off:**
- Fewer files per batch = faster individual AI calls
- More batches = more API calls (but processed in parallel)

---

## Recommended Environment Configuration for Serverless

### For Netlify Free (10 second limit)

```bash
# Aggressive optimization for 10-second timeout
BATCH_CONCURRENCY=5           # Process more batches in parallel
REVIEW_FILES_PER_BATCH=1      # Smaller batches = faster AI calls
SLACK_WAIT_BETWEEN_POSTS=0    # No delay between Slack posts
REVIEW_CONTEXT_LINES=3        # Less context = smaller prompts = faster AI
```

**Expected max processing time:** ~8 seconds for PRs with up to 10 files

### For Netlify Pro (26 second limit)

```bash
# Balanced configuration
BATCH_CONCURRENCY=3           # Default parallel processing
REVIEW_FILES_PER_BATCH=2      # Standard batch size
SLACK_WAIT_BETWEEN_POSTS=500  # Minimal delay
REVIEW_CONTEXT_LINES=5        # Standard context
```

**Expected max processing time:** ~20 seconds for PRs with up to 20 files

---

## Monitoring and Debugging

### 1. Check Function Logs

**Netlify:**
```bash
# In Netlify dashboard
Deploys → [Your deploy] → Function logs
```

**Vercel:**
```bash
# In Vercel dashboard
Deployments → [Your deployment] → Functions → [function name]
```

### 2. Look for Timing Information

The PR review endpoint logs detailed timing:

```
🔍 Processing PR: https://...
📥 Fetching PR data: PROJECT/repo#123
✅ PR Data fetched: 1234ms
🚀 Processing batches with concurrency limit: 3
🤖 Processing batch 1/5 (2 files)...
🤖 Processing batch 2/5 (2 files)...
🤖 Processing batch 3/5 (2 files)...
✅ Generated 5 review(s) in parallel: 8976ms
📤 Posting chunk 1/3 to Slack...
✅ PR Review Complete
⏱️ Duration: 12450ms
```

### 3. Test Locally First

Run the dev server locally to measure actual processing time:

```bash
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/prreview \
  -H "Content-Type: application/json" \
  -d '{"text": "Review: https://bitbucket.example.com/projects/PROJ/repos/repo/pull-requests/123"}'
```

Watch the console for timing information.

---

## Alternative Solutions

### Option 1: Skip Slack Posting for Large PRs

Modify the code to skip Slack posting if the PR is too large:

```typescript
// In app/api/prreview/route.ts
const MAX_FILES_FOR_SLACK = 15;

if (diffs.length <= MAX_FILES_FOR_SLACK) {
  // Post to Slack
} else {
  // Skip Slack, just return review in response
  console.log(`⏭️ Skipping Slack (${diffs.length} files exceeds limit)`);
}
```

### Option 2: Upgrade to Pro Tier

- **Netlify Pro**: $19/month → 26 second timeout
- **Vercel Pro**: $20/month → 60 second timeout

### Option 3: Use Background Functions (Netlify Pro only)

Netlify Pro supports background functions that can run for up to 15 minutes:

```typescript
// app/api/prreview/route.ts
export const config = {
  type: 'background', // Requires Netlify Pro
};
```

### Option 4: Use External Job Queue

For very large PRs, consider using a job queue service:
- **AWS SQS + Lambda**
- **Google Cloud Tasks**
- **Bull/BullMQ with Redis**

---

## Health Check Endpoint

Use the health check endpoint to verify your configuration:

```bash
curl https://your-app.netlify.app/api/health
```

Response includes service status:
```json
{
  "status": "healthy",
  "services": {
    "bitbucket": { "configured": true },
    "ai": { "configured": true, "provider": "groq" },
    "slack": { "configured": true }
  },
  "uptime": 123.456,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Quick Reference

### Timeout Symptoms

- ❌ 504 Gateway Timeout
- ❌ Function execution timed out
- ❌ Failed to fetch (in browser console)

### Quick Fixes (in order of effectiveness)

1. ✅ Set `BATCH_CONCURRENCY=5`
2. ✅ Set `REVIEW_FILES_PER_BATCH=1`
3. ✅ Set `SLACK_WAIT_BETWEEN_POSTS=0`
4. ✅ Set `REVIEW_CONTEXT_LINES=3`
5. ✅ Upgrade to Pro tier (if above don't work)

### Verify Changes

After updating environment variables in Netlify:

1. Trigger a new deployment (or redeploy)
2. Check `/api/health` endpoint
3. Test with a small PR (1-5 files)
4. Test with a medium PR (6-15 files)
5. Monitor function logs

---

## Need More Help?

1. Check [TROUBLESHOOTING_JSON_ERRORS.md](./TROUBLESHOOTING_JSON_ERRORS.md) for JSON parse errors
2. Check [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for deployment issues
3. Review Netlify function logs for detailed error messages
4. Test locally with `npm run dev` to isolate timing issues
