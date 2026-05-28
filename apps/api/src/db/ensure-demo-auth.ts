import "dotenv/config";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { cells, sectors, villages } from "./schema";
import { DEMO_CELL_ID, DEMO_CELL_NAME, DEMO_SECTOR_NAME, DEMO_VILLAGES } from "./demo-config";

/**
 * Idempotent demo credentials for local testing.
 * Safe to run multiple times on an existing database.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  const migrations = [
    "ALTER TABLE cells ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT true",
    "ALTER TABLE villages ADD COLUMN IF NOT EXISTS pin text",
    "ALTER TABLE villages ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT true",
    "ALTER TABLE sectors ADD COLUMN IF NOT EXISTS official_name text",
    "ALTER TABLE sectors ADD COLUMN IF NOT EXISTS official_phone text",
    "ALTER TABLE sectors ADD COLUMN IF NOT EXISTS pin text",
    "ALTER TABLE sectors ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT true",
  ];
  for (const statement of migrations) {
    await client.unsafe(statement);
  }

  let [cell] = await db.select().from(cells).where(eq(cells.id, DEMO_CELL_ID)).limit(1);
  if (!cell) {
    [cell] = await db.select().from(cells).where(eq(cells.name, DEMO_CELL_NAME)).limit(1);
  }
  if (!cell) {
    console.error(
      `${DEMO_CELL_NAME} cell not found. Run the main seed first: pnpm --filter api db:seed`,
    );
    process.exit(1);
  }

  await db
    .update(cells)
    .set({
      executivePhone: "+250788000001",
      executiveName: "Uwimana Jean Pierre",
      pin: "1234",
      isFirstLogin: false,
    })
    .where(eq(cells.id, cell.id));

  const [sector] = await db
    .select()
    .from(sectors)
    .where(eq(sectors.name, DEMO_SECTOR_NAME))
    .limit(1);
  if (sector) {
    await db
      .update(sectors)
      .set({
        officialName: "Ndayisaba Paul",
        officialPhone: "+250788000010",
        pin: "5678",
        isFirstLogin: false,
      })
      .where(eq(sectors.id, sector.id));
  }

  const coordinatorCredentials: Record<
    (typeof DEMO_VILLAGES)[number],
    { phone: string; pin: string }
  > = {
    Abatuje: { phone: "+250788000002", pin: "2345" },
    Amariza: { phone: "+250788000003", pin: "2345" },
    Imanzi: { phone: "+250788000004", pin: "2345" },
  };

  const cellVillages = await db.select().from(villages).where(eq(villages.cellId, cell.id));
  for (const village of cellVillages) {
    const creds = coordinatorCredentials[village.name as (typeof DEMO_VILLAGES)[number]];
    if (!creds) continue;

    await db
      .update(villages)
      .set({
        coordinatorPhone: creds.phone,
        pin: creds.pin,
        isFirstLogin: false,
      })
      .where(eq(villages.id, village.id));
  }

  console.log("Demo auth credentials ready:\n");
  console.log(`Cell Executive  → +250788000001 / 1234  → /cell-executive/dashboard (${DEMO_CELL_NAME})`);
  console.log("Coordinator     → +250788000002 / 2345  → /coordinator/home (Abatuje)");
  console.log("Coordinator     → +250788000003 / 2345  → /coordinator/home (Amariza)");
  console.log("Coordinator     → +250788000004 / 2345  → /coordinator/home (Imanzi)");
  console.log("Sector Official → +250788000010 / 5678  → /sector-official/overview");
  console.log(`Admin           → ${process.env.ADMIN_PHONE ?? "+250788000099"} / ${process.env.ADMIN_PIN ?? "admin123"}  → /admin/dashboard`);
  console.log(`\nCell ID (DEMO_CELL_ID / VITE_DEMO_CELL_ID): ${cell.id}`);
  console.log("\nReset demo data before E2E: pnpm --filter api db:reset-demo");

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
