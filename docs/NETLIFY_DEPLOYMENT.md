# Netlify Deployment Guide

This guide explains how to deploy the Upstox PR Automation Platform to Netlify.

## Prerequisites

- Netlify account
- GitHub repository connected to Netlify
- Environment variables ready (see `.env.example`)

## Quick Start

### Option 1: Deploy with Environment Variables

1. **Go to Netlify Dashboard** → Your Site → Site settings → Environment variables

2. **Add all required environment variables:**

   ```
   BITBUCKET_BASE_URL=https://your-bitbucket-server.com
   BITBUCKET_USERNAME=your-username
   BITBUCKET_APP_PASSWORD=your-app-password
   AI_PROVIDER=groq
   AI_API_KEY=your-groq-api-key
   AI_MODEL=openai/gpt-oss-120b
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Add optional environment variables:**

   ```
   CRON_SECRET=your-random-secret-token
   CRON_REPO_WHITELIST=[{"project":"PROJ","repo":"repo-name"}]
   CRON_AUTHOR_FILTER=Your Name
   ```

4. **Trigger a new deploy** → Netlify will automatically build and deploy

### Option 2: Skip Validation (Build Only)

If you only want to build the app without runtime environment variables (not recommended for production):

1. **Add this environment variable in Netlify:**
   ```
   SKIP_ENV_VALIDATION=true
   ```

2. **Trigger deploy** - validation will be skipped, build will succeed

⚠️ **Warning:** Skipping validation means the app will build but won't work at runtime without proper env vars!

## Environment Variables Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BITBUCKET_BASE_URL` | Your Bitbucket server URL | `https://bitbucket.company.com` |
| `BITBUCKET_USERNAME` | Bitbucket API username | `automation-bot` |
| `BITBUCKET_APP_PASSWORD` | Bitbucket app password/token | `ATBBxxx...` |
| `AI_PROVIDER` | AI service provider | `groq` or `openai` |
| `AI_API_KEY` | API key for AI service | `gsk_xxx...` |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | `https://hooks.slack.com/...` |

### Optional but Recommended

| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SECRET` | Secret for cron endpoint auth | (none) |
| `CRON_REPO_WHITELIST` | JSON array of repos for cron | `[]` |
| `CRON_AUTHOR_FILTER` | Filter PRs by author | (none) |
| `AI_MODEL` | AI model to use | `openai/gpt-oss-120b` |
| `AI_TEMPERATURE` | AI temperature setting | `1` |
| `AI_MAX_TOKENS` | Max tokens for AI | `8192` |

### Configuration-Specific Variables

See `.env.example` for the complete list of available configuration options.

## Build Settings

Netlify should auto-detect these settings, but you can verify:

- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** `22.x`

## Cron Jobs

The platform includes a cron job endpoint at `/api/cron` for automated PR description generation.

### Setting up Netlify Scheduled Functions

1. The app already includes `vercel.json` with cron configuration
2. For Netlify, you have two options:

#### Option A: Netlify Scheduled Functions (Recommended)

Convert the cron endpoint to a Netlify scheduled function:

1. Create `netlify/functions/scheduled-cron.ts`:
   ```typescript
   import { schedule } from '@netlify/functions';

   export const handler = schedule('*/30 * * * *', async () => {
     const response = await fetch(`${process.env.URL}/api/cron`, {
       headers: {
         Authorization: `Bearer ${process.env.CRON_SECRET}`,
       },
     });
     return {
       statusCode: response.status,
     };
   });
   ```

2. Deploy - Netlify will run this every 30 minutes

#### Option B: External Cron Service

Use a service like:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions**

Configure it to hit: `https://your-app.netlify.app/api/cron`

## Post-Deployment

### 1. Verify Health Check

Visit: `https://your-app.netlify.app/api/health`

You should see:
```json
{
  "status": "healthy",
  "services": {
    "bitbucket": "ready",
    "ai": "ready",
    "slack": "ready"
  }
}
```

### 2. Test PR Review Endpoint

Send a POST request to `/api/prreview` with a PR URL:
```bash
curl -X POST https://your-app.netlify.app/api/prreview \
  -H "Content-Type: application/json" \
  -d '{"text": "https://bitbucket.company.com/projects/PROJ/repos/repo/pull-requests/123"}'
```

### 3. Configure Slack Webhook

Set up a Slack outgoing webhook or workflow to POST to:
```
https://your-app.netlify.app/api/prreview
```

## Troubleshooting

### Build Fails: "Validation Errors"

**Cause:** Required environment variables are not set in Netlify

**Solution:**
1. Go to Site settings → Environment variables
2. Add all required variables listed above
3. Redeploy

### Build Succeeds but App Doesn't Work

**Cause:** `SKIP_ENV_VALIDATION=true` was set, but runtime env vars are missing

**Solution:**
1. Remove `SKIP_ENV_VALIDATION`
2. Add proper environment variables
3. Redeploy

### "Cron endpoint unprotected" Warning

**Cause:** `CRON_SECRET` is not set

**Solution:**
```
CRON_SECRET=your-random-secret-token
```

Generate with: `openssl rand -hex 32`

### API Calls Fail

**Cause:** Invalid credentials or URLs

**Solution:**
1. Check `/api/health` endpoint
2. Verify credentials in Netlify env vars
3. Test Bitbucket API access manually
4. Check Slack webhook URL

## Best Practices

1. ✅ **Always set `CRON_SECRET`** for production
2. ✅ **Use separate Bitbucket accounts** for automation
3. ✅ **Rotate credentials regularly**
4. ✅ **Monitor via `/api/health`** endpoint
5. ✅ **Check Netlify function logs** for errors
6. ✅ **Set up alerts** for failed deployments

## Support

- Check the main [README.md](../README.md) for general documentation
- See [.env.example](../.env.example) for all environment variables
- Review [N8N_WORKFLOW_ANALYSIS.md](../N8N_WORKFLOW_ANALYSIS.md) for workflow details

## Security Notes

- Never commit `.env` or `.env.local` files
- Use Netlify's encrypted environment variables
- Rotate credentials if exposed
- Review access logs regularly
