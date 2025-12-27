import { NextRequest, NextResponse } from 'next/server'
import { getUser, verifyPassword, createToken, initDefaultUser } from '@/lib/auth'

// Note: API routes only work in development mode
// For production static builds, you'll need a separate server or build scripts

export async function POST(request: NextRequest) {
  try {
    initDefaultUser()
    
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    const user = getUser(username)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = createToken(username)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Login error:', error)
    // Check if it's a file system error (common on serverless platforms)
    if (error instanceof Error && (error.message.includes('EACCES') || error.message.includes('read-only'))) {
      return NextResponse.json(
        { 
          error: 'File system is read-only. API routes require write access. This is expected on serverless platforms like Vercel. Please use a database or external storage for production.',
          code: 'READ_ONLY_FILESYSTEM'
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

