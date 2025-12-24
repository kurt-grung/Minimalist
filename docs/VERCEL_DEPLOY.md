# Vercel Deployment Guide

This guide explains how to deploy the `headless-cms-demo` from the monorepo.

## Option 1: Using Vercel Dashboard (Recommended)

1. **Connect your repository** to Vercel
2. **Set Root Directory**:
   - Go to Project Settings → General
   - Set "Root Directory" to `headless-cms-demo`
   - Save

3. **Configure Build Settings** (should auto-detect):
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Environment Variables** (if needed):
   - `JWT_SECRET` - Secret for JWT tokens
   - `ADMIN_PASSWORD` - Admin password (optional)
   - `KV_REST_API_URL` - Vercel KV URL (if using KV)
   - `KV_REST_API_TOKEN` - Vercel KV token

5. **Deploy**: Click "Deploy"

## Option 2: Using vercel.json

The root `vercel.json` is already configured to deploy `headless-cms-demo`.

Just run:
```bash
vercel
```

## Option 3: Using Vercel CLI with Root Directory

```bash
cd headless-cms-demo
vercel
```

## Monorepo Considerations

Since this is a monorepo, the `headless-cms` package is referenced as:
```json
"headless-cms": "file:../headless-cms"
```

**Important**: Make sure the `headless-cms` package is built before deploying:

```bash
cd headless-cms
npm install
npm run build
```

Or add a pre-build step in Vercel:
- Build Command: `cd ../headless-cms && npm install && npm run build && cd ../headless-cms-demo && npm run build`

## Vercel KV Setup

1. Go to your Vercel project → Storage
2. Create a **KV** database
3. Vercel will automatically add environment variables
4. The CMS will automatically use KV in production

## Troubleshooting

### Build Fails: Cannot find module 'headless-cms'

Make sure the package is built:
```bash
cd headless-cms
npm run build
```

### API Routes Not Working

- Ensure `output: 'export'` is NOT set in `next.config.js` (API routes need a server)
- Check that Vercel KV is set up if using production storage

## Notes

- The demo uses Vercel KV for storage in production
- File system storage works in development
- `users.json` should be committed for authentication

