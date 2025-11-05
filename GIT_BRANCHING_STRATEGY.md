# Git Branching Strategy

## Default Branch

**Main Branch**: `main`

All new feature branches must be created from `main` and all pull requests must target `main`.

## Branch Naming Convention

### For Claude Code Agent

All branches created by Claude Code must follow this pattern:

```
claude/{feature-description}-{session-id}
```

**Examples**:
- `claude/init-nextjs-pr-automation-011CUq2SkzcnH443DKHW1S2Y`
- `claude/implement-bitbucket-api-011CUq2SkzcnH443DKHW1S2Y`
- `claude/add-n8n-workflow-architecture-011CUq2SkzcnH443DKHW1S2Y`

**Important**: The session ID must match the current Claude session. Branches without `claude/` prefix or with mismatched session IDs will result in 403 errors when pushing.

### For Human Developers

Human developers can use standard Git Flow conventions:

- `feature/{feature-name}` - New features
- `fix/{bug-name}` - Bug fixes
- `hotfix/{issue-name}` - Production hotfixes
- `refactor/{component-name}` - Code refactoring
- `docs/{documentation-update}` - Documentation updates
- `test/{test-description}` - Test additions/updates

## Workflow

### Creating a New Feature

1. **Ensure you're on main**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new feature branch**:
   ```bash
   # For Claude Code:
   git checkout -b claude/{feature-description}-{session-id}

   # For humans:
   git checkout -b feature/{feature-name}
   ```

3. **Make your changes**:
   ```bash
   # Work on your feature
   # Commit frequently with descriptive messages
   git add .
   git commit -m "feat: implement feature"
   ```

4. **Push to remote**:
   ```bash
   # For Claude Code (must use this exact syntax):
   git push -u origin claude/{feature-description}-{session-id}

   # For humans:
   git push -u origin feature/{feature-name}
   ```

5. **Create a Pull Request**:
   - Go to GitHub
   - Create PR from your branch to `main`
   - Fill in PR template
   - Request reviews

6. **After PR is merged**:
   ```bash
   # Update your local main
   git checkout main
   git pull origin main

   # Delete the feature branch (optional)
   git branch -d {branch-name}
   ```

## Pull Request Guidelines

### PR Title Format

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements
- `style:` - Code style changes

**Examples**:
- `feat: add Bitbucket API integration`
- `fix: handle empty PR descriptions correctly`
- `docs: add N8n workflow analysis`
- `refactor: simplify diff processing logic`

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Bullet point list of key changes
- Another change
- Third change

## Testing
How was this tested?
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots or GIFs showing the changes.

## Breaking Changes
List any breaking changes and migration steps.

## Related Issues
Closes #123
Relates to #456
```

## Branch Protection Rules

### Main Branch

**Protected**: Yes

**Requirements**:
- At least 1 approval required
- Status checks must pass
- Branch must be up to date before merging
- No force pushes
- No deletions

**Allowed to merge**:
- Repository admins
- Maintainers

## Git Push Retry Strategy

Due to network issues or temporary failures, use this retry strategy:

### For Git Push

```bash
# Try pushing, if fails, retry up to 4 times with exponential backoff
retry_count=0
max_retries=4
delay=2

while [ $retry_count -lt $max_retries ]; do
  git push -u origin {branch-name}

  if [ $? -eq 0 ]; then
    echo "Push successful!"
    break
  else
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      echo "Push failed. Retrying in ${delay}s... (Attempt $retry_count/$max_retries)"
      sleep $delay
      delay=$((delay * 2))
    else
      echo "Push failed after $max_retries attempts."
      exit 1
    fi
  fi
done
```

**Retry Schedule**:
1. First attempt: immediate
2. Second attempt: after 2 seconds
3. Third attempt: after 4 seconds
4. Fourth attempt: after 8 seconds
5. Fifth attempt: after 16 seconds

### For Git Fetch/Pull

```bash
# Prefer fetching specific branches
git fetch origin {branch-name}

# With retry
retry_count=0
max_retries=4
delay=2

while [ $retry_count -lt $max_retries ]; do
  git fetch origin {branch-name}

  if [ $? -eq 0 ]; then
    echo "Fetch successful!"
    break
  else
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      echo "Fetch failed. Retrying in ${delay}s..."
      sleep $delay
      delay=$((delay * 2))
    fi
  fi
done
```

## Common Issues

### 403 Error on Push

**Problem**: `error: RPC failed; HTTP 403 curl 22`

**Solution**:
- Ensure branch starts with `claude/` (for Claude Code)
- Ensure branch ends with correct session ID
- Only push to branches you created in the current session

### Branch Out of Date

**Problem**: PR shows conflicts or out-of-date

**Solution**:
```bash
git checkout main
git pull origin main
git checkout {your-branch}
git merge main
# Resolve conflicts if any
git push
```

### Merge Conflicts

**Problem**: Conflicts when merging main

**Solution**:
1. Update your branch:
   ```bash
   git checkout {your-branch}
   git fetch origin main
   git merge origin/main
   ```

2. Resolve conflicts:
   ```bash
   # Edit conflicting files
   # Remove conflict markers
   git add {resolved-files}
   git commit
   ```

3. Push updated branch:
   ```bash
   git push
   ```

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### Scope (Optional)

- `api`: API routes
- `lib`: Library functions
- `config`: Configuration
- `ui`: User interface
- `types`: Type definitions

### Examples

```
feat(api): implement PR review webhook endpoint

Add POST /api/prreview endpoint that receives Slack webhooks,
extracts PR URLs, and triggers batch review processing.

Closes #12
```

```
fix(lib): handle empty commit arrays in diff processing

The diff processor was crashing when commits array was empty.
Added null check and default to empty array.

Fixes #45
```

```
docs: add N8n workflow analysis documentation

Created comprehensive analysis of both N8n workflows with all
constants, API endpoints, and implementation details extracted.
```

## Release Strategy (Future)

### Versioning

Follow Semantic Versioning (SemVer):

- **Major**: Breaking changes (v1.0.0 → v2.0.0)
- **Minor**: New features (v1.0.0 → v1.1.0)
- **Patch**: Bug fixes (v1.0.0 → v1.0.1)

### Release Branches

When ready for releases:

- `release/v1.0.0` - Release candidate
- `hotfix/v1.0.1` - Hotfix for production

### Tags

Create tags for releases:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## CI/CD Integration (Future)

When CI/CD is set up:

- All pushes to branches run tests
- PRs to main require passing tests
- Merged PRs to main trigger deployment to staging
- Tagged releases trigger deployment to production

## Questions?

For questions about branching strategy:
1. Check this document
2. Review recent PRs for examples
3. Ask in team chat
4. Open a discussion on GitHub

---

**Last Updated**: 2025-11-05
**Maintained By**: Development Team
