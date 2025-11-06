# Troubleshooting JSON Parse Errors

This guide helps debug "Unexpected end of JSON input" errors and similar JSON parsing issues.

## The Error

```
❌ Error: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

## Root Causes

This error occurs when the frontend tries to parse a non-JSON response as JSON. Common causes:

### 1. Missing Environment Variables

**Symptom:** API returns HTML error page instead of JSON

**Check:**
1. Visit: `https://your-app.netlify.app/api/health`
2. Look for `"status": "degraded"` or services showing "not configured"

**Fix:**
- Configure all required environment variables in Netlify
- See `docs/NETLIFY_DEPLOYMENT.md` for complete list

### 2. API Runtime Errors

**Symptom:** Server returns 500 error with HTML page

**Debug Steps:**
1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard → Functions → Select function → Logs
   - Look for stack traces or error messages

2. **Test endpoint directly:**
   ```bash
   curl -X POST https://your-app.netlify.app/api/prreview \
     -H "Content-Type: application/json" \
     -d '{"text": "https://bitbucket.upstox.com/projects/GROWTH/repos/ui-wp-pages/pull-requests/32"}' \
     -v
   ```

3. **Check response headers:**
   - If `content-type` is `text/html`, the API crashed
   - If `content-type` is `application/json`, check the JSON body

### 3. Network/CORS Issues

**Symptom:** No response or CORS error in browser console

**Check:**
- Open browser DevTools → Network tab
- Look for failed requests or CORS errors

**Fix:**
- Ensure API routes are on same domain as frontend
- Check for ad blockers or network restrictions

### 4. Invalid Bitbucket URL

**Symptom:** API processes but returns unexpected response

**Valid URL format:**
```
https://bitbucket.upstox.com/projects/GROWTH/repos/ui-wp-pages/pull-requests/32
```

**Invalid formats:**
- URLs with `/overview` at the end (remove it)
- URLs with query parameters (remove them)
- GitHub URLs (only Bitbucket supported)

## Fixes Applied

### Frontend (TriggerForms.tsx)

✅ **Now checks content-type before parsing:**
```typescript
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  const text = await response.text();
  throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
}
```

This prevents trying to parse HTML as JSON and shows the actual error.

### Backend (API Routes)

✅ **JSON parsing is wrapped in try-catch:**
```typescript
try {
  body = await request.json();
} catch (parseError) {
  return NextResponse.json({
    success: false,
    error: { message: 'Invalid JSON in request body', code: 'INVALID_JSON' }
  }, { status: 400 });
}
```

This ensures proper JSON error responses even for invalid input.

## Debugging Checklist

When you encounter this error:

- [ ] Check browser console for full error message
- [ ] Check browser Network tab for response details
- [ ] Verify environment variables in Netlify
- [ ] Check `/api/health` endpoint status
- [ ] Review Netlify function logs
- [ ] Test API endpoint with curl
- [ ] Verify Bitbucket URL format
- [ ] Check Bitbucket credentials are valid
- [ ] Verify Bitbucket server is accessible from Netlify

## Common Solutions

### Solution 1: Configure Environment Variables

```bash
# In Netlify Dashboard → Site settings → Environment variables

BITBUCKET_BASE_URL=https://bitbucket.upstox.com
BITBUCKET_USERNAME=your-username
BITBUCKET_APP_PASSWORD=your-token
AI_PROVIDER=groq
AI_API_KEY=your-groq-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

### Solution 2: Remove URL Suffixes

❌ **Wrong:**
```
https://bitbucket.upstox.com/projects/GROWTH/repos/ui-wp-pages/pull-requests/32/overview
```

✅ **Correct:**
```
https://bitbucket.upstox.com/projects/GROWTH/repos/ui-wp-pages/pull-requests/32
```

### Solution 3: Check Bitbucket Access

Test if Bitbucket is accessible:
```bash
curl -u username:app-password \
  https://bitbucket.upstox.com/rest/api/1.0/projects/GROWTH/repos/ui-wp-pages/pull-requests/32
```

If this fails, check:
- Credentials are correct
- API access is enabled
- Network allows access to Bitbucket

## Error Message Improvements

The improved error messages now show:

### Before:
```
❌ Error: Unexpected end of JSON input
```

### After:
```
❌ Error: Server error (500): <!DOCTYPE html>...
```

Or:
```
❌ Error: Invalid JSON in request body
```

This makes it much easier to debug the actual issue!

## Still Having Issues?

1. **Enable debug logging:**
   - Check Netlify function logs in real-time
   - Add console.log statements if needed

2. **Test locally:**
   ```bash
   npm run dev
   # Then test the API at http://localhost:3000
   ```

3. **Check Netlify status:**
   - https://www.netlifystatus.com/

4. **Review related files:**
   - `docs/NETLIFY_DEPLOYMENT.md` - Deployment guide
   - `.env.example` - Environment variable reference
   - `app/api/health/route.ts` - Health check endpoint

## Prevention

To prevent these errors:

✅ Always configure environment variables before deploying
✅ Test `/api/health` endpoint after deployment
✅ Validate Bitbucket URLs before submitting
✅ Monitor Netlify function logs regularly
✅ Set up error alerting in Netlify
