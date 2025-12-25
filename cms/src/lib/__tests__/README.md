# Unit Tests

This directory contains unit tests for the CMS library modules.

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `auth.test.ts` - Tests for authentication functions (password hashing, JWT, user management)
- `config.test.ts` - Tests for configuration management
- `content.test.ts` - Tests for content CRUD operations (posts and pages)
- `storage.test.ts` - Tests for storage abstraction layer (file system and KV)

## Test Coverage

The tests cover:
- ✅ User authentication and password verification
- ✅ JWT token creation and verification
- ✅ Configuration file management
- ✅ Post and page CRUD operations
- ✅ File system storage operations
- ✅ Error handling and edge cases

## Notes

- KV storage tests are skipped because `USE_KV` is evaluated at module load time, making it difficult to test without module reset. KV functionality should be tested in integration tests.
- File system operations are mocked to avoid actual file I/O during tests.
- All tests use Vitest with TypeScript support.

