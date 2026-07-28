import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: { NODE_ENV: "test" },
    setupFiles: ["./tests/setup.ts"],
    // Tests share one MongoDB database, so run files sequentially.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    include: ["tests/**/*.test.ts"],
  },
});
