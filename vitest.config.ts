import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    exclude: ['node_modules', 'dist', 'test-results'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test-results/',
        '**/*.test.ts',
        '**/__tests__/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});