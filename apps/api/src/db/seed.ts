import "dotenv/config";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { cells, issues, sectors, villages } from "./schema";
import { buildSeedIssues } from "./demo-issues";
import { DEMO_CELL_ID, DEMO_SECTOR_NAME, DEMO_VILLAGES } from "./demo-config";
import { clearLocationHierarchy, seedLocations } from "./seed-locations";

const COORDINATOR_CREDENTIALS: Record<
  (typeof DEMO_VILLAGES)[number],
  { name: string; phone: string; pin: string }
> = {
  Abatuje: { name: "Murekatete Alice", phone: "+250788000002", pin: "2345" },
  Amariza: { name: "Habimana Eric", phone: "+250788000003", pin: "2345" },
  Imanzi: { name: "Ingabire Diane", phone: "+250788000004", pin: "2345" },
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  console.log("Clearing existing location hierarchy…");
  await clearLocationHierarchy(client);

  console.log("Seeding Rwanda administrative locations (official dataset)…");
  const { counts, demoCellId } = await seedLocations(db);
  console.log(
    `  ${counts.provinces} provinces, ${counts.districts} districts, ${counts.sectors} sectors, ${counts.cells} cells, ${counts.villages} villages`,
  );

  const [cell] = await db.select().from(cells).where(eq(cells.id, demoCellId)).limit(1);
  if (!cell) throw new Error("Demo cell missing after seed");

  await db
    .update(cells)
    .set({
      executiveName: "Uwimana Jean Pierre",
      executivePhone: "+250788000001",
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

  const cellVillages = await db.select().from(villages).where(eq(villages.cellId, cell.id));
  for (const village of cellVillages) {
    const creds = COORDINATOR_CREDENTIALS[village.name as (typeof DEMO_VILLAGES)[number]];
    if (!creds) continue;

    await db
      .update(villages)
      .set({
        coordinatorName: creds.name,
        coordinatorPhone: creds.phone,
        pin: creds.pin,
        isFirstLogin: false,
      })
      .where(eq(villages.id, village.id));
  }

  const demoVillages = await db.select().from(villages).where(eq(villages.cellId, cell.id));
  const villageByName = new Map(demoVillages.map((v) => [v.name, v]));

  await db.insert(issues).values(buildSeedIssues(cell.id, villageByName));

  console.log("\nDemo credentials (Bibare cell, Kimironko sector):");
  console.log("  Cell Executive  → +250788000001 / 1234");
  console.log("  Coordinator     → +250788000002 / 2345  (Abatuje)");
  console.log("  Coordinator     → +250788000003 / 2345  (Amariza)");
  console.log("  Coordinator     → +250788000004 / 2345  (Imanzi)");
  console.log("  Sector Official → +250788000010 / 5678");
  console.log(`  Demo cell ID (DEMO_CELL_ID): ${DEMO_CELL_ID}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
