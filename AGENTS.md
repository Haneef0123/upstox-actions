# Agentic Coding Patterns for Upstox PR Automation

This document describes agentic AI coding patterns, workflows, and best practices for autonomous development on this project.

## Overview

This project is designed to be developed collaboratively with AI coding agents. The architecture supports:
- **Autonomous feature implementation** with minimal human guidance
- **Incremental development** with clear separation of concerns
- **Self-documenting code** with comprehensive types
- **Test-driven development** (when tests are implemented)

## Agentic Development Workflow

### Phase-Based Development

The project is organized into distinct phases that can be implemented autonomously:

```
Phase 1: Infrastructure ✅ (Completed)
  ↓
Phase 2: API Integrations (Current)
  ├── Bitbucket API
  ├── AI Services (Groq/OpenAI)
  └── Slack Webhooks
  ↓
Phase 3: Core Features
  ├── PR Review Processing
  ├── PR Description Generation
  └── Cron Jobs
  ↓
Phase 4: UI/Dashboard
  ├── Dashboard Components
  ├── Review Display
  └── Admin Settings
  ↓
Phase 5: Testing & Deployment
  ├── Unit Tests
  ├── Integration Tests
  └── CI/CD Pipeline
```

### Agent Task Pattern

When implementing a feature, follow this pattern:

1. **Analyze**: Read relevant files and understand requirements
2. **Plan**: Break down the task into sub-tasks
3. **Implement**: Write code following project patterns
4. **Verify**: Check types, test locally if possible
5. **Document**: Update README or relevant docs
6. **Commit**: Create descriptive commit with changes

## Autonomous Implementation Guidelines

### Pattern 1: API Integration Implementation

**Objective**: Implement external API integration in `/lib/{service}/`

**Steps**:
1. Read the placeholder implementation
2. Review the service's API documentation (Bitbucket, OpenAI, etc.)
3. Implement authentication
4. Implement each function one by one
5. Add error handling and retry logic
6. Test with sample data (if credentials available)

**Example: Implementing Bitbucket API**

```typescript
// 1. Set up authentication
const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');

// 2. Implement fetch function
export async function fetchPRDetails(
  config: BitbucketConfig,
  project: string,
  repo: string,
  prId: string
): Promise<PRDetails> {
  const url = `${config.baseUrl}/rest/api/1.0/projects/${project}/repos/${repo}/pull-requests/${prId}`;

  const response = await withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Bitbucket API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  });

  // 3. Map response to our type
  return {
    id: response.id,
    title: response.title,
    description: response.description || '',
    author: {
      name: response.author.user.displayName,
      email: response.author.user.emailAddress,
    },
    fromRef: {
      displayId: response.fromRef.displayId,
    },
    toRef: {
      displayId: response.toRef.displayId,
    },
    state: response.state,
    version: response.version,
  };
}
```

**Agent Autonomy**: Can implement completely autonomously if API docs are accessible.

---

### Pattern 2: API Route Implementation

**Objective**: Implement business logic in `/app/api/{route}/route.ts`

**Steps**:
1. Read the placeholder implementation
2. Understand the flow from project requirements (CLAUDE.md)
3. Import required functions from `/lib`
4. Implement step-by-step logic
5. Add proper error handling
6. Return typed responses

**Example: Implementing PR Review Endpoint**

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, user, channel } = body;

    // Step 1: Extract PR URLs
    const prUrls = extractPRUrls(text);
    if (prUrls.length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: { message: 'No PR URLs found in message' },
      }, { status: 400 });
    }

    // Step 2: Process each PR
    const results = await processBatch(prUrls, async (url) => {
      const components = parsePRUrl(url);
      if (!components) {
        throw new Error(`Invalid PR URL: ${url}`);
      }

      // Fetch PR data
      const prDetails = await fetchPRDetails(
        config.bitbucket,
        components.project,
        components.repo,
        components.prId
      );

      // ... continue with review logic

      return { url, success: true };
    });

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

**Agent Autonomy**: Can implement with high autonomy once API integrations are complete.

---

### Pattern 3: Utility Function Implementation

**Objective**: Create reusable utility functions in `/lib/utils/`

**Steps**:
1. Identify common patterns in code
2. Extract to a typed function
3. Add comprehensive JSDoc comments
4. Export from the utility file
5. Replace duplicate code with utility function calls

**Example: Creating a Retry Utility**

```typescript
/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  // Implementation
}
```

**Agent Autonomy**: High - utility functions are self-contained.

---

## Autonomous Decision-Making Framework

### When to Create New Files

**Create a new file when**:
- Implementing a new API integration (e.g., `/lib/github/index.ts` for GitHub API)
- Adding a new API route (e.g., `/app/api/webhooks/route.ts`)
- Creating a new set of utilities (e.g., `/lib/utils/formatting.ts`)
- Building a new component (e.g., `/components/dashboard/PRList.tsx`)

**Don't create a new file when**:
- Adding a function to an existing integration
- Extending an existing utility module
- Adding a new type to `/types/index.ts`

### When to Update Documentation

**Always update** (part of the implementation task):
- README.md when adding a new feature or changing architecture
- CLAUDE.md when adding new patterns or workflows
- CONTRIBUTING.md when changing development processes

### When to Ask for Clarification

**Ask the user when**:
- Requirements are ambiguous (e.g., "which repositories should we process?")
- Multiple valid approaches exist (e.g., "should we use polling or webhooks?")
- Credentials or environment-specific information is needed
- Breaking changes would affect existing functionality

**Don't ask when**:
- Following established patterns in the codebase
- Implementing placeholder functions
- Adding standard error handling
- Writing self-contained utilities

---

## Complex Feature Implementation Strategy

### Feature: PR Review Batch Processing

**Complexity**: High (involves multiple APIs, batching, AI, formatting)

**Autonomous Implementation Approach**:

1. **Break Down into Sub-Tasks**:
   ```
   Task 1: Implement Bitbucket PR fetching
   Task 2: Implement diff parsing and batching
   Task 3: Implement AI review generation
   Task 4: Implement Slack message formatting
   Task 5: Wire everything together in API route
   Task 6: Test end-to-end flow
   ```

2. **Implement Bottom-Up**:
   - Start with leaf dependencies (Bitbucket API)
   - Move to processing logic (diff parsing, batching)
   - Implement AI integration
   - Implement output formatting (Slack)
   - Finally, wire together in API route

3. **Verify at Each Step**:
   - Check TypeScript compilation
   - Verify types match
   - Test individual functions (if possible)
   - Check error handling

4. **Document Decisions**:
   - Add code comments for non-obvious logic
   - Update CLAUDE.md with new patterns
   - Update README.md with feature status

---

## Code Quality Standards for Agents

### Type Safety Checklist

- ✅ All function parameters have explicit types
- ✅ All function returns have explicit types
- ✅ No use of `any` type
- ✅ Enums or union types for known values
- ✅ Optional parameters use `?` or defaults

### Error Handling Checklist

- ✅ All async functions wrapped in try-catch
- ✅ Errors logged with context
- ✅ External API calls have retry logic
- ✅ User-facing errors are descriptive
- ✅ Errors return proper HTTP status codes

### Documentation Checklist

- ✅ JSDoc comments on public functions
- ✅ Complex logic has inline comments
- ✅ README.md updated with new features
- ✅ Type definitions are self-documenting

### Git Commit Checklist

- ✅ Commit message follows conventional format
- ✅ Single logical change per commit
- ✅ All files formatted with Prettier
- ✅ No commented-out code
- ✅ No debug logs or test code

---

## Multi-Agent Collaboration Patterns

### Parallel Feature Development

Multiple agents (or sessions) can work in parallel on different phases:

**Agent 1**: Implementing Bitbucket API (`/lib/bitbucket/`)
**Agent 2**: Implementing AI integration (`/lib/ai/`)
**Agent 3**: Implementing Slack integration (`/lib/slack/`)

**Merge Strategy**: Each agent works in their own branch, PRs are merged sequentially.

### Sequential Feature Development

For dependent features, maintain clear interfaces:

**Agent 1**: Implements `/lib/bitbucket/` with typed interfaces
**Agent 2**: Consumes interfaces from `/lib/bitbucket/` to build API route

**Communication**: Through TypeScript types and JSDoc comments.

---

## Testing Strategy for Autonomous Development

### Manual Testing Approach (Current)

Since automated tests aren't implemented yet:

1. **Type Checking**: Run `npm run build` to verify TypeScript
2. **Local Server**: Use `npm run dev` and test with curl/Postman
3. **Mock Data**: Create sample responses for testing
4. **Error Cases**: Test with invalid inputs

### Future: Automated Testing

When implementing tests, agents should:
- Write tests alongside implementation
- Test happy paths and error cases
- Mock external APIs
- Use dependency injection for testability

---

## Common Autonomous Tasks

### Task: Add a New Environment Variable

**Agent Actions** (no user input needed):
1. Add to `.env.example` with description
2. Add to `/config/index.ts` with type
3. Update `validateConfig()` if required
4. Document in README.md
5. Commit with message: `chore: add {VAR_NAME} environment variable`

### Task: Implement a Library Function

**Agent Actions** (no user input needed):
1. Read placeholder implementation
2. Implement function with proper types
3. Add JSDoc comment
4. Add error handling
5. Update exports if needed
6. Commit with message: `feat: implement {function_name} in {module}`

### Task: Fix a Bug

**Agent Actions**:
1. Analyze the bug report
2. Locate the relevant code
3. Implement the fix
4. Add a test (future) or verify manually
5. Commit with message: `fix: {description of bug fix}`

---

## Self-Improvement Loop

As the project evolves, agents should:

1. **Identify Patterns**: Notice repeated code and extract to utilities
2. **Improve Types**: Make types more specific and accurate
3. **Enhance Docs**: Add examples and clarify ambiguities
4. **Refactor**: Simplify complex functions
5. **Optimize**: Improve performance where needed

**Example**: If multiple API routes do similar parsing, create a shared utility.

---

## Success Criteria for Autonomous Development

A feature is considered successfully implemented by an agent when:

- ✅ Code compiles without TypeScript errors
- ✅ All functions have proper types and error handling
- ✅ Code follows established patterns in the codebase
- ✅ Documentation is updated
- ✅ Git commit is descriptive and follows conventions
- ✅ No placeholder code remains (unless intentional)
- ✅ Can be integrated without breaking existing functionality

---

## Emergency Rollback Pattern

If an agent-implemented feature causes issues:

1. **Identify the commit**: Use `git log` to find the commit
2. **Revert**: `git revert {commit-hash}`
3. **Document**: Add a comment explaining why it was reverted
4. **Re-attempt**: Try a different approach with lessons learned

---

## Questions for Effective Autonomous Development

Before starting implementation, agents should consider:

1. **What is the goal?** (Clear from task description)
2. **What are the inputs?** (From API, user, config, etc.)
3. **What are the outputs?** (API response, Slack message, etc.)
4. **What can go wrong?** (Network errors, invalid data, etc.)
5. **What patterns exist?** (Check similar implementations)
6. **What types are needed?** (Check `/types/index.ts`)
7. **What should be documented?** (Update relevant docs)

---

## Conclusion

This project is designed for high-autonomy AI development. With clear types, patterns, and documentation, agents can implement complete features with minimal human intervention. The key is to:

- **Follow established patterns** from existing code
- **Use TypeScript types** for self-documenting APIs
- **Document decisions** in code and markdown files
- **Test incrementally** at each step
- **Communicate through types** rather than asking questions

Happy autonomous coding! 🤖
