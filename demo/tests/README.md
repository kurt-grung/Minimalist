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
- `markdown.test.ts` - Tests for markdown/HTML conversion utilities (HTML to Markdown, Markdown to HTML, entity encoding/decoding)

## Test Coverage

The tests cover:
- ✅ User authentication and password verification
- ✅ JWT token creation and verification
- ✅ Configuration file management
- ✅ Locale management
- ✅ HTML sanitization and XSS prevention
- ✅ Search relevance scoring logic
- ✅ Markdown to HTML conversion (headings, bold, italic, lists, code blocks, links, images, blockquotes)
- ✅ HTML to Markdown conversion (all HTML elements)
- ✅ Round-trip conversions (HTML → Markdown → HTML)
- ✅ HTML entity encoding/decoding
- ✅ Double-encoded entity fixing

## Notes

- File system operations are mocked to avoid actual file I/O during tests
- All tests use Vitest with TypeScript support
- Tests are designed to work in a CI/CD environment without requiring actual file system access

