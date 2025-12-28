# Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) to manage git hooks.

## Pre-commit Hook

The pre-commit hook automatically runs the following checks before allowing a commit:

1. **CMS Package Tests** - Runs unit tests for the CMS package (`npm run test:cms`)
2. **Demo App Tests** - Runs unit tests for the demo app (`npm run test:demo`)
3. **Demo App Type Check** - Type checks the demo app with `tsc --noEmit` to catch TypeScript errors
4. **CMS Package Build** - Builds the CMS package to ensure it compiles correctly
5. **Demo App Build** - Builds the demo Next.js app to catch TypeScript errors and ensure it builds successfully

**Summary:** The pre-commit hook tests both CMS package and demo app, then builds both to ensure everything works.

If any check fails, the commit will be blocked and you'll need to fix the issues before committing.

### Why Both Type Check and Build?

- **Type Check (`tsc --noEmit`)**: Fast TypeScript validation without generating files
- **Build (`next build`)**: Full Next.js build that catches additional errors and validates the entire app

This ensures that:
- ✅ Unit tests pass for both CMS package and demo app
- ✅ TypeScript errors in the demo app are caught before commit
- ✅ Both CMS package and demo app are validated
- ✅ No broken code gets committed to the repository

## Setup

After cloning the repository, run:
```bash
npm install
```

The `prepare` script in `package.json` will automatically set up Husky.

## Bypassing Hooks (Not Recommended)

If you need to bypass the hooks in an emergency (not recommended):
```bash
git commit --no-verify
```

