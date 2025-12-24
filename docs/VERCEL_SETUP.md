# Vercel Setup Guide

This CMS uses a hybrid storage approach that works on both local development and Vercel:

- **Development**: Uses file system (reads/writes to `/content` directory)
- **Production (Vercel)**: Uses Vercel KV (key-value store) for read/write operations

## Setup Steps

### 1. Install Vercel KV

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **KV** (Key-Value Store)
4. Create the database

### 2. Link KV to Your Project

Vercel will automatically add these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

These are automatically detected by the storage adapter.

### 3. Deploy

Once KV is set up, deploy your project. The CMS will automatically:
- Use file system in development (`npm run dev`)
- Use Vercel KV in production (Vercel deployments)

## How It Works

The storage adapter (`lib/storage.ts`) automatically detects:
- If `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set → Uses Vercel KV
- Otherwise → Uses file system (development)

## Migrating Existing Content

If you have existing content in `/content` directory:

1. **Option A**: Commit content files to Git (they'll be read-only on Vercel)
   - Content will be available for static generation
   - But you can't edit via admin panel on Vercel

2. **Option B**: Use the admin panel to recreate content
   - Once KV is set up, create posts via the admin panel
   - They'll be stored in Vercel KV

## Troubleshooting

### Error: "Failed to save post"
- Make sure Vercel KV is set up and linked to your project
- Check that environment variables are set in Vercel dashboard

### Content not showing
- In development: Make sure `/content` directory exists
- In production: Check Vercel KV dashboard to see if data is stored

### Auth not working
- Make sure `users.json` is committed to Git (it's read-only on Vercel)
- Or set up environment variables for auth (see `lib/auth.ts`)

## Alternative: Use Vercel Postgres

If you prefer a relational database, you can modify `lib/storage.ts` to use Vercel Postgres instead of KV. The storage adapter pattern makes this easy to swap.

