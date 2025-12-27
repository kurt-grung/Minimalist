import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    target: 'node18',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
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

