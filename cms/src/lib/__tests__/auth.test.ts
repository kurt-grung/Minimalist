import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  initDefaultUser,
  verifyPassword,
  getUser,
  createToken,
  verifyToken,
  type User,
} from '../auth'

// Mock fs module
vi.mock('fs')
vi.mock('path')

const mockFs = vi.mocked(fs)
const mockPath = vi.mocked(path)

describe('auth', () => {
  const mockUsersFile = '/test/users.json'
  const originalEnv = process.env
  const originalCwd = process.cwd

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    // Note: USERS_FILE is evaluated at module load time, so we can't easily mock it
    // The tests work by mocking fs operations directly
    mockPath.join.mockImplementation((...args) => args.join('/'))
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initDefaultUser', () => {
    it('should create default user file if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)
      mockFs.writeFileSync.mockImplementation(() => {})

      initDefaultUser()

      expect(mockFs.existsSync).toHaveBeenCalled()
      expect(mockFs.writeFileSync).toHaveBeenCalled()
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      const users = JSON.parse(writeCall[1] as string) as User[]
      expect(users).toHaveLength(1)
      expect(users[0].username).toBe('admin')
      expect(users[0].passwordHash).toBeDefined()
    })

    it('should use custom password from environment variable', () => {
      process.env.ADMIN_PASSWORD = 'custom123'
      mockFs.existsSync.mockReturnValue(false)
      mockFs.writeFileSync.mockImplementation(() => {})

      initDefaultUser()

      expect(mockFs.writeFileSync).toHaveBeenCalled()
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      const users = JSON.parse(writeCall[1] as string) as User[]
      const isValid = bcrypt.compareSync('custom123', users[0].passwordHash)
      expect(isValid).toBe(true)
    })

    it('should not create file if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      initDefaultUser()

      expect(mockFs.writeFileSync).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(false)
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      initDefaultUser()

      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', () => {
      const password = 'test123'
      const hash = bcrypt.hashSync(password, 10)

      const result = verifyPassword(password, hash)

      expect(result).toBe(true)
    })

    it('should return false for incorrect password', () => {
      const password = 'test123'
      const wrongPassword = 'wrong123'
      const hash = bcrypt.hashSync(password, 10)

      const result = verifyPassword(wrongPassword, hash)

      expect(result).toBe(false)
    })
  })

  describe('getUser', () => {
    it('should return user if found', () => {
      const mockUser: User = {
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
      }
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify([mockUser]))

      const result = getUser('admin')

      expect(result).toEqual(mockUser)
      expect(mockFs.readFileSync).toHaveBeenCalled()
      const readCall = mockFs.readFileSync.mock.calls[0]
      expect(readCall[1]).toBe('utf-8')
    })

    it('should return null if user not found', () => {
      const mockUser: User = {
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
      }
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify([mockUser]))

      const result = getUser('nonexistent')

      expect(result).toBeNull()
    })

    it('should initialize default user if file does not exist', () => {
      mockFs.existsSync
        .mockReturnValueOnce(false) // First check in getUser
        .mockReturnValueOnce(false) // Check in initDefaultUser
        .mockReturnValueOnce(true) // After init, file exists
      mockFs.writeFileSync.mockImplementation(() => {})
      const mockUser: User = {
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
      }
      mockFs.readFileSync.mockReturnValue(JSON.stringify([mockUser]))

      const result = getUser('admin')

      expect(mockFs.writeFileSync).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should return null if file cannot be read', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = getUser('admin')

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('createToken', () => {
    it('should create a valid JWT token', () => {
      process.env.JWT_SECRET = 'test-secret'
      const username = 'admin'

      const token = createToken(username)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      const decoded = jwt.verify(token, 'test-secret') as { username: string }
      expect(decoded.username).toBe(username)
    })

    it('should use default secret if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET
      const username = 'admin'

      const token = createToken(username)

      expect(token).toBeDefined()
      const decoded = jwt.verify(token, 'your-secret-key-change-in-production') as {
        username: string
      }
      expect(decoded.username).toBe(username)
    })
  })

  describe('verifyToken', () => {
    it('should return decoded token for valid token', () => {
      process.env.JWT_SECRET = 'test-secret'
      const username = 'admin'
      const token = jwt.sign({ username }, 'test-secret', { expiresIn: '7d' })

      const result = verifyToken(token)

      expect(result).not.toBeNull()
      expect(result?.username).toBe(username)
    })

    it('should return null for invalid token', () => {
      process.env.JWT_SECRET = 'test-secret'
      const invalidToken = 'invalid.token.here'

      const result = verifyToken(invalidToken)

      expect(result).toBeNull()
    })

    it('should return null for expired token', () => {
      process.env.JWT_SECRET = 'test-secret'
      const expiredToken = jwt.sign({ username: 'admin' }, 'test-secret', {
        expiresIn: '-1h',
      })

      const result = verifyToken(expiredToken)

      expect(result).toBeNull()
    })

    it('should return null for token signed with different secret', () => {
      process.env.JWT_SECRET = 'test-secret'
      const token = jwt.sign({ username: 'admin' }, 'wrong-secret', { expiresIn: '7d' })

      const result = verifyToken(token)

      expect(result).toBeNull()
    })
  })
})

