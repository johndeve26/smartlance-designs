import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/crm/integration/**/*.test.ts",
      "tests/agency/integration/**/*.test.ts",
      "tests/onboarding/integration/**/*.test.ts",
      "tests/change-requests/integration/**/*.test.ts",
      "tests/portal/integration/**/*.test.ts",
      "tests/prospect/integration/**/*.test.ts",
      "tests/client-success/integration/**/*.test.ts",
      "tests/proposals/integration/**/*.test.ts",
      "tests/contracts/integration/**/*.test.ts",
      "tests/billing/integration/**/*.test.ts",
    ],
    setupFiles: ["tests/setup-env.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
