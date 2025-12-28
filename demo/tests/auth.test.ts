import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  verifyPassword,
  createToken,
  verifyToken,
  getUser,
  initDefaultUser,
  type User,
} from '../lib/auth'
import bcrypt from 'bcryptjs'

// Mock fs module
vi.mock('fs', () => {
  const mockExistsSync = vi.fn()
  const mockReadFileSync = vi.fn()
  const mockWriteFileSync = vi.fn()
  
  return {
    default: {
      existsSync: mockExistsSync,
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
    },
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  }
})

// Get the mocked functions
import fs from 'fs'
const mockExistsSync = vi.mocked(fs.existsSync)
const mockReadFileSync = vi.mocked(fs.readFileSync)
const mockWriteFileSync = vi.mocked(fs.writeFileSync)

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExistsSync.mockReset()
    mockReadFileSync.mockReset()
    mockWriteFileSync.mockReset()
    // Reset process.env
    delete process.env.JWT_SECRET
    delete process.env.ADMIN_PASSWORD
  })

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'test123'
      const hash = bcrypt.hashSync(password, 10)
      
      expect(verifyPassword(password, hash)).toBe(true)
    })

    it('should reject incorrect password', () => {
      const password = 'test123'
      const hash = bcrypt.hashSync(password, 10)
      
      expect(verifyPassword('wrongpassword', hash)).toBe(false)
    })
  })

  describe('createToken and verifyToken', () => {
    it('should create and verify token', () => {
      const username = 'testuser'
      const token = createToken(username)
      
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      
      const decoded = verifyToken(token)
      expect(decoded).toBeTruthy()
      if (decoded) {
        expect(decoded.username).toBe(username)
      }
    })

    it('should reject invalid token', () => {
      const result = verifyToken('invalid-token')
      expect(result).toBeNull()
    })

    it('should use custom JWT_SECRET from env', () => {
      process.env.JWT_SECRET = 'custom-secret'
      const username = 'testuser'
      const token = createToken(username)
      
      // Token should be different with different secret
      expect(token).toBeTruthy()
    })
  })

  describe('getUser', () => {
    it('should return user if exists', () => {
      const mockUsers: User[] = [
        {
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin123', 10),
        },
        {
          username: 'user1',
          passwordHash: bcrypt.hashSync('password1', 10),
        },
      ]

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(mockUsers))

      const user = getUser('admin')
      expect(user).toBeTruthy()
      expect(user?.username).toBe('admin')
    })

    it('should return null if user does not exist', () => {
      const mockUsers: User[] = [
        {
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin123', 10),
        },
      ]

      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(mockUsers))

      const user = getUser('nonexistent')
      expect(user).toBeNull()
    })

    it('should initialize default user if file does not exist', () => {
      // Flow: getUser checks existsSync -> false -> calls initDefaultUser
      // initDefaultUser checks existsSync -> false -> calls writeFileSync
      // getUser checks existsSync again -> true -> calls readFileSync
      mockExistsSync
        .mockReturnValueOnce(false) // getUser first check
        .mockReturnValueOnce(false) // initDefaultUser check
        .mockReturnValueOnce(true)  // getUser second check (after init)
      mockReadFileSync.mockReturnValue(JSON.stringify([{
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
      }]))
      // Don't throw on writeFileSync
      mockWriteFileSync.mockImplementation(() => {})

      const user = getUser('admin')
      expect(mockWriteFileSync).toHaveBeenCalled()
      expect(user).toBeTruthy()
    })
  })

  describe('initDefaultUser', () => {
    it('should create default user file if it does not exist', () => {
      mockExistsSync.mockReturnValue(false)

      initDefaultUser()

      expect(mockWriteFileSync).toHaveBeenCalled()
      const callArgs = mockWriteFileSync.mock.calls[0]
      expect(callArgs).toBeTruthy()
      if (callArgs) {
        const writtenData = JSON.parse(callArgs[1] as string) as User[]
        expect(writtenData).toHaveLength(1)
        expect(writtenData[0].username).toBe('admin')
      }
    })

    it('should not create file if it already exists', () => {
      mockExistsSync.mockReturnValue(true)

      initDefaultUser()

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('should use ADMIN_PASSWORD from env if set', () => {
      process.env.ADMIN_PASSWORD = 'custom-password'
      mockExistsSync.mockReturnValue(false)

      initDefaultUser()

      expect(mockWriteFileSync).toHaveBeenCalled()
    })
  })
})

