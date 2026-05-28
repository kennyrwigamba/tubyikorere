import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  cells,
  districts,
  provinces,
  sectors,
  villages,
} from "./schema";
import {
  DEMO_CELL_ID,
  DEMO_CELL_NAME,
  DEMO_DISTRICT_NAME,
  DEMO_SECTOR_NAME,
} from "./demo-config";

type LocationRow = {
  province_code: number;
  province_name: string;
  district_code: number;
  district_name: string;
  sector_code: string;
  sector_name: string;
  cell_code: number;
  cell_name: string;
  village_name: string;
};

type SeedLocationsResult = {
  counts: {
    provinces: number;
    districts: number;
    sectors: number;
    cells: number;
    villages: number;
  };
  demoCellId: string;
};

const PROVINCE_META: Record<
  string,
  { name: string; nameKinyarwanda: string; code: string }
> = {
  KIGALI: {
    name: "Kigali City",
    nameKinyarwanda: "Umujyi wa Kigali",
    code: "KG",
  },
  EAST: {
    name: "Eastern Province",
    nameKinyarwanda: "Intara y'Iburasirazuba",
    code: "E",
  },
  WEST: {
    name: "Western Province",
    nameKinyarwanda: "Intara y'Iburengerazuba",
    code: "W",
  },
  NORTH: {
    name: "Northern Province",
    nameKinyarwanda: "Intara y'Amajyaruguru",
    code: "N",
  },
  SOUTH: {
    name: "Southern Province",
    nameKinyarwanda: "Intara y'Amajyepfo",
    code: "S",
  },
};

const BATCH_SIZE = 500;

function loadLocationRows(): LocationRow[] {
  const dir = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(dir, "data", "locations.json"), "utf8");
  return JSON.parse(raw) as LocationRow[];
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) =>
      part.length > 0 && !/^\s+$/.test(part) && part !== "-"
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part,
    )
    .join("");
}

function isDemoCell(row: LocationRow): boolean {
  return (
    row.district_name === DEMO_DISTRICT_NAME &&
    row.sector_name === DEMO_SECTOR_NAME &&
    row.cell_name === DEMO_CELL_NAME
  );
}

function placeholderPhone(cellCode: number): string {
  return `+250700${String(cellCode).padStart(7, "0").slice(-7)}`;
}

export async function clearLocationHierarchy(client: postgres.Sql): Promise<void> {
  await client.unsafe(`
    TRUNCATE TABLE
      sector_reports,
      work_completions,
      attendance_records,
      session_assignments,
      umuganda_sessions,
      issues,
      villages,
      cells,
      sectors,
      districts,
      provinces
    CASCADE
  `);
}

export async function seedLocations(
  db: PostgresJsDatabase<Record<string, never>>,
): Promise<SeedLocationsResult> {
  const rows = loadLocationRows();

  const provinceRows = new Map<
    number,
    { id: string; name: string; nameKinyarwanda: string; code: string }
  >();
  const districtRows = new Map<
    number,
    {
      id: string;
      provinceId: string;
      name: string;
      nameKinyarwanda: string;
      code: string;
    }
  >();
  const sectorRows = new Map<
    string,
    {
      id: string;
      districtId: string;
      name: string;
      nameKinyarwanda: string;
      code: string;
    }
  >();
  const cellRows = new Map<
    number,
    {
      id: string;
      sectorId: string;
      name: string;
      nameKinyarwanda: string;
      code: string;
      executiveName: string;
      executivePhone: string;
      pin: string;
    }
  >();
  const villageRows: (typeof villages.$inferInsert)[] = [];

  for (const row of rows) {
    if (!provinceRows.has(row.province_code)) {
      const meta = PROVINCE_META[row.province_name];
      if (!meta) {
        throw new Error(`Unknown province: ${row.province_name}`);
      }
      provinceRows.set(row.province_code, {
        id: randomUUID(),
        name: meta.name,
        nameKinyarwanda: meta.nameKinyarwanda,
        code: meta.code,
      });
    }

    if (!districtRows.has(row.district_code)) {
      const province = provinceRows.get(row.province_code)!;
      districtRows.set(row.district_code, {
        id: randomUUID(),
        provinceId: province.id,
        name: titleCase(row.district_name),
        nameKinyarwanda: titleCase(row.district_name),
        code: `${province.code}-${row.district_code}`,
      });
    }

    if (!sectorRows.has(row.sector_code)) {
      const district = districtRows.get(row.district_code)!;
      sectorRows.set(row.sector_code, {
        id: randomUUID(),
        districtId: district.id,
        name: titleCase(row.sector_name),
        nameKinyarwanda: titleCase(row.sector_name),
        code: row.sector_code,
      });
    }

    if (!cellRows.has(row.cell_code)) {
      const sector = sectorRows.get(row.sector_code)!;
      const demo = isDemoCell(row);
      cellRows.set(row.cell_code, {
        id: demo ? DEMO_CELL_ID : randomUUID(),
        sectorId: sector.id,
        name: titleCase(row.cell_name),
        nameKinyarwanda: titleCase(row.cell_name),
        code: String(row.cell_code),
        executiveName: demo ? "Uwimana Jean Pierre" : "To Be Assigned",
        executivePhone: demo ? "+250788000001" : placeholderPhone(row.cell_code),
        pin: demo ? "1234" : "0000",
      });
    }

    const cell = cellRows.get(row.cell_code)!;
    villageRows.push({
      cellId: cell.id,
      name: titleCase(row.village_name),
      nameKinyarwanda: titleCase(row.village_name),
    });
  }

  await db.insert(provinces).values([...provinceRows.values()]);
  await db.insert(districts).values([...districtRows.values()]);
  await db.insert(sectors).values([...sectorRows.values()]);
  await db.insert(cells).values([...cellRows.values()]);

  for (let i = 0; i < villageRows.length; i += BATCH_SIZE) {
    await db.insert(villages).values(villageRows.slice(i, i + BATCH_SIZE));
  }

  const demoCell = [...cellRows.values()].find((c) => c.id === DEMO_CELL_ID);
  if (!demoCell) {
    throw new Error(
      `Demo cell "${DEMO_CELL_NAME}" not found in location dataset`,
    );
  }

  return {
    counts: {
      provinces: provinceRows.size,
      districts: districtRows.size,
      sectors: sectorRows.size,
      cells: cellRows.size,
      villages: villageRows.length,
    },
    demoCellId: demoCell.id,
  };
}
