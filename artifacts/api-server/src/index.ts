import app from "./app";
import { logger } from "./lib/logger";
import bcrypt from "bcryptjs";
import { db, adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedSuperAdmin() {
  const email = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!email || !password) return;

  try {
    const existing = await db
      .select({ id: adminUsersTable.id })
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) return; // already exists

    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(adminUsersTable).values({
      fullName: "Super Admin",
      username: "superadmin",
      email: email.toLowerCase(),
      passwordHash,
      role: "super_admin",
      permissions: [],
      isActive: true,
      mustChangePassword: false,
    });
    logger.info({ email }, "Super Admin seeded from env vars");
  } catch (err) {
    logger.error({ err }, "Failed to seed Super Admin");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

seedSuperAdmin().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
