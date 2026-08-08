import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../lib/admin/crypto";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Super Admin";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (!email || !password) {
    throw new Error(
      "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required",
    );
  }
  if (password.length < 12) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const existing = await prisma.adminUser.count();
    if (existing > 0) {
      console.log(
        `Bootstrap skipped: ${existing} admin user(s) already exist.`,
      );
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.bootstrap",
        entityType: "AdminUser",
        entityId: user.id,
        metadata: { email },
      },
    });

    console.log(`Created Super Admin: ${user.email}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
