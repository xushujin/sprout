import { readFileSync } from 'node:fs';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          APP_ORIGIN: 'https://words.example.com',
          PASSWORD_PEPPER: 'test-only-pepper-never-use-in-production-1234567890',
          TEST_SCHEMA: readFileSync('schema.sql', 'utf8'),
        },
      },
    }),
  ],
  test: { include: ['tests/worker/**/*.test.ts'], testTimeout: 15_000 },
});
