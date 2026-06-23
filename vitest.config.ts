import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load .env so the Prisma client can read DATABASE_URL during tests.
config();

export default defineConfig({
  resolve: {
    // Mirror the `@/` → ./src alias so tests import the same way the app does.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
