import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import {
  attendanceRecords,
  cells,
  issues,
  sectorReports,
  sessionAssignments,
  umugandaSessions,
  villages,
  workCompletions,
} from "./schema";
import { buildSeedIssues } from "./demo-issues";

/**
 * Resets Kimironko Cell demo data for a clean E2E run:
 * - Removes umuganda sessions (and related attendance, plans, reports)
 * - Restores exactly 5 seeded issues in `open` status
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  const [cell] = await db.select().from(cells).where(eq(cells.name, "Kimironko Cell")).limit(1);
  if (!cell) {
    console.error("Kimironko Cell not found. Run: pnpm --filter api db:seed");
    process.exit(1);
  }

  const cellVillages = await db.select().from(villages).where(eq(villages.cellId, cell.id));
  const villageByName = new Map(cellVillages.map((v) => [v.name, v]));

  const sessions = await db
    .select({ id: umugandaSessions.id })
    .from(umugandaSessions)
    .where(eq(umugandaSessions.cellId, cell.id));

  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    await db.delete(sectorReports).where(inArray(sectorReports.sessionId, sessionIds));
    await db.delete(workCompletions).where(inArray(workCompletions.sessionId, sessionIds));
    await db.delete(attendanceRecords).where(inArray(attendanceRecords.sessionId, sessionIds));
    await db.delete(sessionAssignments).where(inArray(sessionAssignments.sessionId, sessionIds));
    await db.delete(umugandaSessions).where(eq(umugandaSessions.cellId, cell.id));
  }

  await db.delete(issues).where(eq(issues.cellId, cell.id));
  await db.insert(issues).values(buildSeedIssues(cell.id, villageByName));

  console.log("Demo reset complete for Kimironko Cell:");
  console.log(`  - Removed ${sessionIds.length} umuganda session(s) and related data`);
  console.log("  - Restored 5 seeded issues (all open)");
  console.log(`  - Cell ID: ${cell.id}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
