import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Use vi.hoisted() to create mocks that can be referenced in vi.mock()
const { mockExistsSync, mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
}))

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}))

// Now import after mocks are set up
import {
  initDefaultUser,
  verifyPassword,
  getUser,
  createToken,
  verifyToken,
  type User,
} from '../auth'

describe('auth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    // Reset all mocks
    mockExistsSync.mockReturnValue(false)
    mockReadFileSync.mockReturnValue('[]')
    mockWriteFileSync.mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initDefaultUser', () => {
    it('should create default user file if it does not exist', () => {
      mockExistsSync.mockReturnValue(false)
      mockWriteFileSync.mockImplementation(() => {})

      initDefaultUser()

      expect(mockExistsSync).toHaveBeenCalled()
      expect(mockWriteFileSync).toHaveBeenCalled()
      const writeCall = mockWriteFileSync.mock.calls[0]
      const users = JSON.parse(writeCall[1] as string) as User[]
      expect(users).toHaveLength(1)
      expect(users[0].username).toBe('admin')
      expect(users[0].passwordHash).toBeDefined()
    })

    it('should use custom password from environment variable', () => {
      process.env.ADMIN_PASSWORD = 'custom123'
      mockExistsSync.mockReturnValue(false)
      mockWriteFileSync.mockImplementation(() => {})

      initDefaultUser()

      expect(mockWriteFileSync).toHaveBeenCalled()
      const writeCall = mockWriteFileSync.mock.calls[0]
      const users = JSON.parse(writeCall[1] as string) as User[]
      const isValid = bcrypt.compareSync('custom123', users[0].passwordHash)
      expect(isValid).toBe(true)
    })

    it('should not create file if it already exists', () => {
      mockExistsSync.mockReturnValue(true)

      initDefaultUser()

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      mockExistsSync.mockReturnValue(false)
      mockWriteFileSync.mockImplementation(() => {
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
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify([mockUser]))

      const result = getUser('admin')

      expect(result).toEqual(mockUser)
      expect(mockReadFileSync).toHaveBeenCalled()
      const readCall = mockReadFileSync.mock.calls[0]
      expect(readCall[1]).toBe('utf-8')
    })

    it('should return null if user not found', () => {
      const mockUser: User = {
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
      }
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify([mockUser]))

      const result = getUser('nonexistent')

      expect(result).toBeNull()
    })

    it('should initialize default user if file does not exist', () => {
      mockExistsSync
        .mockReturnValueOnce(false) // First check in getUser
        .mockReturnValueOnce(false) // Check in initDefaultUser
        .mockReturnValueOnce(true) // After init, file exists
      mockWriteFileSync.mockImplementation(() => {})
      const mockUser: User = {
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
      }
      mockReadFileSync.mockReturnValue(JSON.stringify([mockUser]))

      const result = getUser('admin')

      expect(mockWriteFileSync).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should return null if file cannot be read', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockImplementation(() => {
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
      // Note: SECRET is evaluated at module load time, so we test with the actual secret
      // If JWT_SECRET was set before module load, it would use that
      const username = 'admin'
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      const token = createToken(username)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      // Use the default secret since JWT_SECRET wasn't set at module load
      const decoded = jwt.verify(token, 'your-secret-key-change-in-production') as {
        username: string
      }
      expect(decoded.username).toBe(username)
      if (originalSecret) process.env.JWT_SECRET = originalSecret
    })

    it('should use default secret if JWT_SECRET is not set', () => {
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
      // Note: SECRET is evaluated at module load time, so we use the default secret
      const username = 'admin'
      const secret = 'your-secret-key-change-in-production'
      const token = jwt.sign({ username }, secret, { expiresIn: '7d' })

      const result = verifyToken(token)

      expect(result).not.toBeNull()
      expect(result?.username).toBe(username)
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here'

      const result = verifyToken(invalidToken)

      expect(result).toBeNull()
    })

    it('should return null for expired token', () => {
      const secret = 'your-secret-key-change-in-production'
      const expiredToken = jwt.sign({ username: 'admin' }, secret, {
        expiresIn: '-1h',
      })

      const result = verifyToken(expiredToken)

      expect(result).toBeNull()
    })

    it('should return null for token signed with different secret', () => {
      const token = jwt.sign({ username: 'admin' }, 'wrong-secret', { expiresIn: '7d' })

      const result = verifyToken(token)

      expect(result).toBeNull()
    })
  })
})

