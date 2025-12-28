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
    const { del, list } = await import('@vercel/blob')
    return { del, list }
  } catch (error) {
    console.warn('Vercel Blob not available, falling back to file system:', error)
    return null
  }
}

// DELETE /api/images/[filename] - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
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

    const { filename } = await params
    const decodedFilename = decodeURIComponent(filename)
    
    // Security: prevent directory traversal
    if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Try Blob Storage first if available (production on Vercel)
    if (USE_BLOB) {
      const blob = await getBlobClient()
      if (blob) {
        try {
          const { del, list } = blob
          // Find the blob by filename
          const { blobs } = await list({ prefix: `images/${decodedFilename}` })
          const matchingBlob = blobs.find(b => path.basename(b.pathname) === decodedFilename)
          
          if (matchingBlob) {
            await del(matchingBlob.url)
            console.log(`Image deleted from Vercel Blob Storage: ${matchingBlob.url}`)
            return NextResponse.json({ success: true })
          }
          // If not found in Blob, fall through to file system check
        } catch (error) {
          console.error('Blob delete error:', error)
          // Fall through to file system
        }
      }
    }

    // Fallback to file system (development)
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    const absoluteImagesDir = path.resolve(imagesDir)
    const filePath = path.join(absoluteImagesDir, decodedFilename)
    const absoluteFilePath = path.resolve(filePath)

    if (!fs.existsSync(absoluteFilePath)) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    fs.unlinkSync(absoluteFilePath)
    console.log(`Image deleted from local file system: ${absoluteFilePath}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
