import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    target: 'node20',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000, // 10 seconds per test
    hookTimeout: 10000, // 10 seconds for hooks
    teardownTimeout: 5000, // 5 seconds for teardown
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'templates/',
      ],
    },
  },
})

