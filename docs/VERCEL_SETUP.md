# Vercel Setup Guide

This CMS uses a hybrid storage approach that works on both local development and Vercel:

- **Development**: Uses file system (reads/writes to `/content` directory and `/public/images`)
- **Production (Vercel)**: Uses Vercel KV (key-value store) for content and Vercel Blob Storage for images

## Setup Steps

### 1. Install Vercel KV (for content storage)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **KV** (Key-Value Store)
4. Create the database

Vercel will automatically add these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### 2. Install Vercel Blob Storage (for image uploads)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **Blob** (Object Storage)
4. Create the database

Vercel will automatically add this environment variable:
- `BLOB_READ_WRITE_TOKEN`

### 3. Install Dependencies

Make sure you have the required packages installed:

```bash
npm install @vercel/blob @vercel/kv
```

### 4. Deploy

Once both KV and Blob Storage are set up, deploy your project. The CMS will automatically:
- Use file system in development (`npm run dev`)
- Use Vercel KV for content and Vercel Blob for images in production (Vercel deployments)

## How It Works

### Content Storage
The storage adapter (`lib/storage.ts`) automatically detects:
- If `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set → Uses Vercel KV
- Otherwise → Uses file system (development)

### Image Storage
The image API (`app/api/images/route.ts`) automatically detects:
- If `BLOB_READ_WRITE_TOKEN` is set → Uses Vercel Blob Storage
- Otherwise → Uses file system (`public/images/` directory in development)

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

### Images not uploading or displaying
- **In development**: Images are saved to `public/images/` directory
- **In production**: Make sure Vercel Blob Storage is set up
- Check that `BLOB_READ_WRITE_TOKEN` environment variable is set in Vercel dashboard
- Images uploaded on Vercel are stored in Blob Storage and served via CDN URLs
- Images uploaded locally won't appear on Vercel - you need to upload them via the admin panel on the deployed site

### Auth not working
- Make sure `users.json` is committed to Git (it's read-only on Vercel)
- Or set up environment variables for auth (see `lib/auth.ts`)

## Alternative: Use Vercel Postgres

If you prefer a relational database, you can modify `lib/storage.ts` to use Vercel Postgres instead of KV. The storage adapter pattern makes this easy to swap.

