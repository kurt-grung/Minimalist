#!/usr/bin/env tsx
/**
 * Script to upload local images to Vercel Blob Storage
 * 
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your_token tsx scripts/upload-images-to-blob.ts
 * 
 * Or set the token in .env.local:
 *   BLOB_READ_WRITE_TOKEN=your_token
 */

import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

if (!BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required')
  console.error('   Get it from: https://vercel.com/dashboard -> Your Project -> Settings -> Environment Variables')
  process.exit(1)
}

const imagesDir = path.join(process.cwd(), 'public', 'images')

if (!fs.existsSync(imagesDir)) {
  console.error(`❌ Images directory not found: ${imagesDir}`)
  process.exit(1)
}

const imageFiles = fs.readdirSync(imagesDir).filter(file => {
  const ext = path.extname(file).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)
})

if (imageFiles.length === 0) {
  console.log('ℹ️  No image files found in public/images/')
  process.exit(0)
}

console.log(`📤 Found ${imageFiles.length} image(s) to upload...\n`)

async function uploadImage(filename: string) {
  const filePath = path.join(imagesDir, filename)
  const fileBuffer = fs.readFileSync(filePath)
  
  // Determine content type
  const ext = path.extname(filename).toLowerCase()
  const contentType = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  }[ext] || 'image/png'
  
  try {
    const blob = await put(`images/${filename}`, fileBuffer, {
      access: 'public',
      contentType,
    })
    
    console.log(`✅ Uploaded: ${filename}`)
    console.log(`   URL: ${blob.url}\n`)
    return blob.url
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error)
    throw error
  }
}

async function main() {
  const results = []
  
  for (const filename of imageFiles) {
    try {
      const url = await uploadImage(filename)
      results.push({ filename, url, success: true })
    } catch (error) {
      results.push({ filename, url: null, success: false })
    }
  }
  
  console.log('\n📊 Summary:')
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`   ✅ Successful: ${successful}`)
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`)
  }
  
  if (successful > 0) {
    console.log('\n💡 Next steps:')
    console.log('   1. Images are now in Blob Storage')
    console.log('   2. Your content should reference them as: /images/filename.png')
    console.log('   3. The rewrite rule will serve them from Blob Storage automatically')
  }
}

main().catch(console.error)

