import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Set test env vars before tests run
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test?sslmode=require";
process.env.DATABASE_URL_UNPOOLED = "postgresql://test:test@localhost:5432/test?sslmode=require";
process.env.AUTH_SECRET = "test-secret-key-at-least-32-chars-long";
process.env.AUTH_URL = "http://localhost:3000";
process.env.SYNC_USER_AGENT = "DevTrack/1.0 (+https://github.com/devtrack)";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
