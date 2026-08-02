import app from "./app";
import { logger } from "./lib/logger";
import bcrypt from "bcryptjs";
import { db, adminUsersTable, adminLoginAttemptsTable } from "@workspace/db";
import { eq, like } from "drizzle-orm";

async function seedSuperAdmin() {
  const email = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!email || !password) return;

  const normalizedEmail = email.toLowerCase();

  try {
    // Hash the password from env var every time — this acts as a force-reset
    // so the admin can always log in with the current ADMIN_PASSWORD value.
    const passwordHash = await bcrypt.hash(password, 12);

    // Upsert: create if not exists, or update password + ensure active if exists.
    // This handles three cases safely:
    //   1. Fresh DB — creates the super admin row.
    //   2. Admin exists with wrong password — resets it to current env var value.
    //   3. Admin exists with correct password — no visible change (hash differs but login works).
    await db
      .insert(adminUsersTable)
      .values({
        fullName: "Super Admin",
        username: "superadmin",
        email: normalizedEmail,
        passwordHash,
        role: "super_admin",
        permissions: [],
        isActive: true,
        mustChangePassword: false,
      })
      .onConflictDoUpdate({
        target: adminUsersTable.email,
        set: {
          passwordHash,
          isActive: true,
          role: "super_admin",
        },
      });

    // Clear any accumulated rate-limit records for this email
    await db
      .delete(adminLoginAttemptsTable)
      .where(like(adminLoginAttemptsTable.identifier, `${normalizedEmail}:%`));

    logger.info({ email }, "Super Admin synced from env vars");
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
