import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prefer Next-style local overrides, then `.env`
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const datasourceUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  // Placeholder so `prisma generate` works without credentials.
  // Real Neon URLs are required for migrate/seed/runtime.
  "postgresql://postgres:postgres@127.0.0.1:5432/smartlance?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx scripts/seed-from-typed-data.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
