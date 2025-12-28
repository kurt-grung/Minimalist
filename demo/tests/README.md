# Demo App Tests

This directory contains unit tests for the demo application.

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

- `auth.test.ts` - Tests for authentication functions (password verification, JWT tokens, user management)
- `config.test.ts` - Tests for configuration management (site config, locales)
- `sanitize.test.ts` - Tests for HTML sanitization (XSS prevention)
- `search.test.ts` - Tests for search functionality and relevance scoring

## Test Coverage

The tests cover:
- ✅ User authentication and password verification
- ✅ JWT token creation and verification
- ✅ Configuration file management
- ✅ Locale management
- ✅ HTML sanitization and XSS prevention
- ✅ Search relevance scoring logic

## Notes

- File system operations are mocked to avoid actual file I/O during tests
- All tests use Vitest with TypeScript support
- Tests are designed to work in a CI/CD environment without requiring actual file system access

