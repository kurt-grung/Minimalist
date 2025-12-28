import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// Check if we should use Vercel Blob Storage (production on Vercel)
const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN
const isDevelopment = process.env.NODE_ENV === 'development'
const USE_BLOB = isVercel && !isDevelopment

// Helper to get Blob client
async function getBlobClient() {
  if (!USE_BLOB) return null
  try {
    const { put, list, del } = await import('@vercel/blob')
    return { put, list, del }
  } catch (error) {
    console.warn('Vercel Blob not available, falling back to file system:', error)
    return null
  }
}

// GET /api/images - List all images
export async function GET() {
  try {
    // Try Blob Storage first if available
    if (USE_BLOB) {
      const blob = await getBlobClient()
      if (blob) {
        try {
          const { list } = blob
          const { blobs } = await list({ prefix: 'images/' })
          
          const images = blobs
            .filter(blob => {
              const ext = path.extname(blob.pathname).toLowerCase()
              return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)
            })
            .map(blob => ({
              filename: path.basename(blob.pathname),
              url: blob.url,
              size: blob.size,
              uploadedAt: blob.uploadedAt.toISOString()
            }))
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          
          return NextResponse.json(images)
        } catch (error) {
          console.error('Blob list error:', error)
          // Fall through to file system
        }
      }
    }
    
    // Fallback to file system (development)
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    const absoluteImagesDir = path.resolve(imagesDir)
    
    if (!fs.existsSync(absoluteImagesDir)) {
      fs.mkdirSync(absoluteImagesDir, { recursive: true })
      return NextResponse.json([])
    }

    const files = fs.readdirSync(absoluteImagesDir)
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)
      })
      .map(file => {
        const filePath = path.join(absoluteImagesDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          url: `/images/${file}`,
          size: stats.size,
          uploadedAt: stats.birthtime.toISOString()
        }
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error listing images:', error)
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    )
  }
}

// POST /api/images - Upload image
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const ext = path.extname(originalName) || '.jpg'
    const filename = `${timestamp}-${originalName.replace(ext, '')}${ext}`

    // Try Blob Storage first if available (production on Vercel)
    if (USE_BLOB) {
      const blob = await getBlobClient()
      if (blob) {
        try {
          const { put } = blob
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          const blobResult = await put(`images/${filename}`, buffer, {
            access: 'public',
            contentType: file.type,
          })
          
          console.log(`Image saved to Vercel Blob Storage: ${blobResult.url}`)
          
          return NextResponse.json({
            filename,
            url: blobResult.url, // Use Blob URL directly
            size: file.size
          }, { status: 201 })
        } catch (error) {
          console.error('Blob upload error:', error)
          // Fall through to file system
        }
      }
    }

    // Fallback to file system (development)
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    const absoluteImagesDir = path.resolve(imagesDir)
    
    if (!fs.existsSync(absoluteImagesDir)) {
      fs.mkdirSync(absoluteImagesDir, { recursive: true })
      console.log(`Created images directory: ${absoluteImagesDir}`)
    }

    const filePath = path.join(absoluteImagesDir, filename)
    const absoluteFilePath = path.resolve(filePath)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    fs.writeFileSync(absoluteFilePath, buffer)
    
    if (!fs.existsSync(absoluteFilePath)) {
      throw new Error('File was not saved to local file system')
    }
    
    const stats = fs.statSync(absoluteFilePath)
    console.log(`Image saved to local file system: ${absoluteFilePath} (${stats.size} bytes)`)

    return NextResponse.json({
      filename,
      url: `/images/${filename}`,
      size: file.size
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
