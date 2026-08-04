import app from "./app";
import { logger } from "./lib/logger";
import bcrypt from "bcryptjs";
import { db, adminUsersTable, adminLoginAttemptsTable } from "@workspace/db";
import { eq, like, sql } from "drizzle-orm";

/**
 * Safe, idempotent schema migrations — runs at every startup.
 * Uses IF NOT EXISTS / IF EXISTS so re-running is always harmless.
 * This ensures production DBs stay in sync without a manual migrate step.
 */
async function runSafeMigrations() {
  try {
    // 0001: NOEST shipment tracking columns
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_provider text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS noest_shipment_id text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS sent_to_carrier_at timestamptz`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_tracking_sync_at timestamptz`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz`);

    // 0003: Shipping metadata columns
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_wilaya_code text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_wilaya_name text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_office_id integer`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_office_name text`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_min_days integer`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_max_days integer`);

    // 0004: Normalize delivery_type values
    await db.execute(sql`UPDATE orders SET delivery_type = 'home'   WHERE delivery_type = 'domicile'`);
    await db.execute(sql`UPDATE orders SET delivery_type = 'office' WHERE delivery_type = 'stop_desk'`);

    // shipping_rates columns (0002 / 0004)
    await db.execute(sql`ALTER TABLE shipping_rates ADD COLUMN IF NOT EXISTS office_delivery_enabled boolean NOT NULL DEFAULT true`);
    await db.execute(sql`ALTER TABLE shipping_rates ADD COLUMN IF NOT EXISTS office_delivery_price numeric(10,2) NOT NULL DEFAULT 0`);

    logger.info("Safe migrations applied successfully");
  } catch (err) {
    logger.error({ err }, "Safe migrations failed — server will still start");
  }
}

async function seedSuperAdmin() {
  const email = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!email || !password) return;

  const normalizedEmail = email.toLowerCase();

  try {
    // Hash the password from env var every time — this acts as a force-reset
    // so the admin can always log in with the current ADMIN_PASSWORD value.
    const passwordHash = await bcrypt.hash(password, 12);

    // Remove any stale rows that share the same username but have a different
    // email. This prevents the INSERT below from failing on the username unique
    // constraint when ADMIN_EMAIL was changed between deployments.
    await db
      .delete(adminUsersTable)
      .where(
        eq(adminUsersTable.username, "superadmin"),
      );

    // Insert fresh — now that any username collision is gone, this is safe.
    // We rely on the delete+insert pattern instead of upsert to avoid racing
    // against both the email and username unique constraints simultaneously.
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
          username: "superadmin",
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

runSafeMigrations().then(() => seedSuperAdmin()).then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
