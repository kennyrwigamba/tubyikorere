import "dotenv/config";
import postgres from "postgres";

import {
  cells,
  districts,
  issues,
  provinces,
  sectors,
  villages,
} from "./schema";
import { buildSeedIssues } from "./demo-issues";
import { drizzle } from "drizzle-orm/postgres-js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  const [province] = await db
    .insert(provinces)
    .values({
      name: "Kigali City",
      nameKinyarwanda: "Umujyi wa Kigali",
      code: "KG",
    })
    .returning();

  const [district] = await db
    .insert(districts)
    .values({
      provinceId: province.id,
      name: "Gasabo",
      nameKinyarwanda: "Gasabo",
      code: "KG-GS",
    })
    .returning();

  const [sector] = await db
    .insert(sectors)
    .values({
      districtId: district.id,
      name: "Kimironko",
      nameKinyarwanda: "Kimironko",
      code: "KG-GS-KM",
      officialName: "Ndayisaba Paul",
      officialPhone: "+250788000010",
      pin: "5678",
      isFirstLogin: false,
    })
    .returning();

  const [cell] = await db
    .insert(cells)
    .values({
      sectorId: sector.id,
      name: "Kimironko Cell",
      nameKinyarwanda: "Akagari ka Kimironko",
      executiveName: "Uwimana Jean Pierre",
      executivePhone: "+250788000001",
      pin: "1234",
      isFirstLogin: false,
    })
    .returning();

  const insertedVillages = await db
    .insert(villages)
    .values([
      {
        cellId: cell.id,
        name: "Rugarama",
        nameKinyarwanda: "Rugarama",
        coordinatorName: "Murekatete Alice",
        coordinatorPhone: "+250788000002",
        pin: "2345",
        isFirstLogin: false,
      },
      {
        cellId: cell.id,
        name: "Kibagabaga",
        nameKinyarwanda: "Kibagabaga",
        coordinatorName: "Habimana Eric",
        coordinatorPhone: "+250788000003",
        pin: "2345",
        isFirstLogin: false,
      },
      {
        cellId: cell.id,
        name: "Nyarutarama",
        nameKinyarwanda: "Nyarutarama",
        coordinatorName: "Ingabire Diane",
        coordinatorPhone: "+250788000004",
        pin: "2345",
        isFirstLogin: false,
      },
    ])
    .returning();

  const villageByName = new Map(insertedVillages.map((v) => [v.name, v]));

  await db.insert(issues).values(buildSeedIssues(cell.id, villageByName));

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

