import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
      // Constitution Principle III: Testing & Validation
      // Target: ≥80% coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['tests/**/*.{test,spec}.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@module': path.resolve(__dirname, './src/module'),
      '@endpoint': path.resolve(__dirname, './src/endpoint'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
