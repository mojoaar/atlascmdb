import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    env: {
      TEST_DB: 'true',
      JWT_SECRET: 'atlas-test-secret',
      JWT_REFRESH_SECRET: 'atlas-test-refresh-secret',
    },
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
