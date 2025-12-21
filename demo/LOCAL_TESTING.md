# Local Testing Guide

Since the package isn't published to npm yet, here's how to test it locally:

## Option 1: Run CLI Directly

```bash
# From the root directory
node packages/headless-cms/dist/cli.js init
```

## Option 2: Install Locally

```bash
# From the root directory
npm install ./packages/headless-cms

# Then run
npx headless-cms init
```

## Option 3: Use npm link (requires permissions)

```bash
# From packages/headless-cms
npm link

# From root directory  
npm link headless-cms

# Then run
npx headless-cms init
```

## Building the Package

Before testing, make sure the package is built:

```bash
cd packages/headless-cms
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Copy the CLI wrapper to `dist/cli.js`
- Make it executable

## Testing in a Fresh Next.js Project

1. Create a new Next.js project:
```bash
npx create-next-app@latest test-cms
cd test-cms
```

2. Install the package locally:
```bash
npm install ../headless/packages/headless-cms
```

3. Run the init command:
```bash
npx headless-cms init
```

4. Start the dev server:
```bash
npm run dev
```

5. Visit `http://localhost:3000/admin`

## Publishing to npm (when ready)

1. Update version in `packages/headless-cms/package.json`
2. Build: `cd packages/headless-cms && npm run build`
3. Publish: `npm publish`

After publishing, users can install with:
```bash
npm install headless-cms
npx headless-cms init
```

