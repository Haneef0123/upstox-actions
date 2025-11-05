# Contributing to Upstox PR Automation

Thank you for considering contributing to this project!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure
4. Run the dev server: `npm run dev`

## Project Structure Guidelines

### Adding New API Integrations

When adding a new API integration (e.g., a new service):

1. Create a new folder in `/lib` (e.g., `/lib/github/`)
2. Export typed interfaces and functions from `index.ts`
3. Add configuration to `/config/index.ts`
4. Add environment variables to `.env.example`

### Adding New API Routes

1. Create route handler in `/app/api/<route-name>/route.ts`
2. Use the `APIResponse` type from `/types`
3. Add error handling with try-catch
4. Document the endpoint in README.md

### Adding New Types

1. Add shared types to `/types/index.ts`
2. Add module-specific types to the respective `/lib` folder
3. Use consistent naming conventions

### Adding Utilities

1. Create utility functions in `/lib/utils/`
2. Export from a named file (not index.ts for clarity)
3. Add tests for complex logic

## Code Style

- Use TypeScript for all new code
- Follow the existing Prettier configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

## Testing

(To be added in Phase 5)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test locally
4. Commit with clear messages
5. Push and create a PR
6. Wait for review

## Questions?

Open an issue for any questions or clarifications!
