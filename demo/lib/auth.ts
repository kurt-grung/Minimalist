import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const USERS_FILE = path.join(process.cwd(), 'users.json')

export interface User {
  username: string
  passwordHash: string
}

// Initialize default admin user
export function initDefaultUser() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123'
      const passwordHash = bcrypt.hashSync(defaultPassword, 10)
      const users: User[] = [
        {
          username: 'admin',
          passwordHash
        }
      ]
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
      console.log('Default admin user created. Username: admin, Password: admin123')
      console.log('⚠️  Change the default password in production!')
    }
  } catch (error) {
    // On serverless platforms (Vercel, etc.), file system is read-only
    // Users file must be committed to the repository
    console.warn('Could not create users file. This is expected on serverless platforms.')
    console.warn('Ensure users.json exists in your repository for production.')
  }
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

// Get user by username
export function getUser(username: string): User | null {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      initDefaultUser()
      // If file still doesn't exist after init (e.g., on Vercel), return null
      if (!fs.existsSync(USERS_FILE)) {
        console.error('users.json does not exist and could not be created. Please commit users.json to your repository.')
        return null
      }
    }
    
    const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    return users.find(u => u.username === username) || null
  } catch (error) {
    console.error('Error reading users.json:', error)
    return null
  }
}

// Create JWT token
export function createToken(username: string): string {
  return jwt.sign({ username }, SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, SECRET) as { username: string }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification error:', error.message)
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired')
    } else if (error instanceof jwt.NotBeforeError) {
      console.error('JWT token not active yet')
    } else {
      console.error('JWT verification error:', error)
    }
    return null
  }
}

