import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const USERS_FILE = path.join(process.cwd(), 'users.json')

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  username: string
  passwordHash: string
  role?: UserRole
  email?: string
  oauthProvider?: 'github' | 'google'
  oauthId?: string
  createdAt?: string
  updatedAt?: string
}

// Initialize default admin user
export function initDefaultUser() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123'
      const passwordHash = bcrypt.hashSync(defaultPassword, 10)
      const now = new Date().toISOString()
      const users: User[] = [
        {
          username: 'admin',
          passwordHash,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        }
      ]
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
      console.log('Default admin user created. Username: admin, Password: admin123')
      console.log('⚠️  Change the default password in production!')
    } else {
      // Migrate existing users to include role if missing
      const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
      let updated = false
      const now = new Date().toISOString()
      
      users.forEach(user => {
        if (!user.role) {
          user.role = 'admin' // Default existing users to admin
          updated = true
        }
        if (!user.createdAt) {
          user.createdAt = now
        }
        if (!user.updatedAt) {
          user.updatedAt = now
        }
      })
      
      if (updated) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
        console.log('Migrated users to include roles')
      }
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
export function createToken(username: string, role?: UserRole): string {
  return jwt.sign({ username, role }, SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export function verifyToken(token: string): { username: string; role?: UserRole } | null {
  try {
    return jwt.verify(token, SECRET) as { username: string; role?: UserRole }
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

// Get user role
export function getUserRole(username: string): UserRole {
  const user = getUser(username)
  return user?.role || 'viewer'
}

// Check if user has permission
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3
  }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Get all users (admin only)
export function getAllUsers(): Omit<User, 'passwordHash'>[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      initDefaultUser()
      if (!fs.existsSync(USERS_FILE)) {
        return []
      }
    }
    const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    // Remove password hashes for security
    return users.map(({ passwordHash, ...user }) => user)
  } catch (error) {
    console.error('Error reading users:', error)
    return []
  }
}

// Create or update user
export function saveUser(user: Omit<User, 'passwordHash'> & { password?: string }): boolean {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      initDefaultUser()
    }
    
    const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    const existingIndex = users.findIndex(u => u.username === user.username)
    
    const userData: User = {
      ...user,
      passwordHash: user.password 
        ? bcrypt.hashSync(user.password, 10)
        : existingIndex >= 0 
          ? users[existingIndex].passwordHash 
          : '',
      updatedAt: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData }
    } else {
      userData.createdAt = new Date().toISOString()
      users.push(userData)
    }
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error('Error saving user:', error)
    return false
  }
}

// Delete user
export function deleteUser(username: string): boolean {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return false
    }
    
    const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    const filtered = users.filter(u => u.username !== username)
    
    if (filtered.length === users.length) {
      return false // User not found
    }
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2))
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}

