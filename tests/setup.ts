/**
 * Vitest Setup File
 * This file runs before all tests.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(() => {
  // Global setup before all tests
  console.log('Starting test suite...');
});

afterEach(() => {
  // Cleanup after each test
  // Clear all mocks, reset module state, etc.
});

afterAll(() => {
  // Global cleanup after all tests
  console.log('Test suite completed.');
});
