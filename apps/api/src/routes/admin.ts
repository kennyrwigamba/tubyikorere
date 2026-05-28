import { Hono } from "hono";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import {
  attendanceRecords,
  cells,
  districts,
  issues,
  provinces,
  sectorReports,
  sectors,
  umugandaSessions,
  villages,
} from "../db/schema";

export const adminRoutes = new Hono();

const patchProvinceSchema = z.object({
  name: z.string().min(1).optional(),
  name_kinyarwanda: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

const patchDistrictSchema = patchProvinceSchema.extend({
  province_id: z.string().uuid().optional(),
});

const patchSectorSchema = z.object({
  name: z.string().min(1).optional(),
  name_kinyarwanda: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  official_name: z.string().min(1).optional(),
  official_phone: z.string().min(1).optional(),
  pin: z.string().regex(/^\d{4}$/).optional(),
});

const patchCellSchema = z.object({
  name: z.string().min(1).optional(),
  name_kinyarwanda: z.string().min(1).optional(),
  executive_name: z.string().min(1).optional(),
  executive_phone: z.string().min(1).optional(),
  pin: z.string().regex(/^\d{4}$/).optional(),
});

const patchVillageSchema = z.object({
  name: z.string().min(1).optional(),
  name_kinyarwanda: z.string().min(1).optional(),
  coordinator_name: z.string().min(1).optional(),
  coordinator_phone: z.string().min(1).optional(),
  pin: z.string().regex(/^\d{4}$/).optional(),
});

adminRoutes.get("/dashboard", async (c) => {
  const [
    provinceCount,
    districtCount,
    sectorCount,
    cellCount,
    villageCount,
    coordinatorCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(provinces),
    db.select({ count: sql<number>`count(*)::int` }).from(districts),
    db.select({ count: sql<number>`count(*)::int` }).from(sectors),
    db.select({ count: sql<number>`count(*)::int` }).from(cells),
    db.select({ count: sql<number>`count(*)::int` }).from(villages),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(villages)
      .where(sql`${villages.coordinatorPhone} is not null`),
  ]);

  const userCount =
    (cellCount[0]?.count ?? 0) +
    (coordinatorCount[0]?.count ?? 0) +
    (sectorCount[0]?.count ?? 0) +
    1;

  const recentActivity = await buildActivityFeed(20);

  return c.json({
    counts: {
      provinces: provinceCount[0]?.count ?? 0,
      districts: districtCount[0]?.count ?? 0,
      sectors: sectorCount[0]?.count ?? 0,
      cells: cellCount[0]?.count ?? 0,
      villages: villageCount[0]?.count ?? 0,
      users: userCount,
    },
    recent_activity: recentActivity,
  });
});

adminRoutes.get("/hierarchy", async (c) => {
  const allProvinces = await db.select().from(provinces);
  const allDistricts = await db.select().from(districts);
  const allSectors = await db.select().from(sectors);
  const allCells = await db.select().from(cells);
  const allVillages = await db.select().from(villages);

  const tree = allProvinces.map((province) => ({
    ...province,
    districts: allDistricts
      .filter((district) => district.provinceId === province.id)
      .map((district) => ({
        ...district,
        sectors: allSectors
          .filter((sector) => sector.districtId === district.id)
          .map((sector) => ({
            ...sector,
            pin_masked: sector.pin ? "****" : null,
            cells: allCells
              .filter((cell) => cell.sectorId === sector.id)
              .map((cell) => ({
                ...cell,
                pin_masked: "****",
                villages: allVillages.filter((village) => village.cellId === cell.id).map((village) => ({
                  ...village,
                  pin_masked: village.pin ? "****" : null,
                })),
              })),
          })),
      })),
  }));

  return c.json(tree);
});

adminRoutes.get("/users", async (c) => {
  const roleFilter = c.req.query("role");

  const cellUsers = await db
    .select({
      id: cells.id,
      name: cells.executiveName,
      phone: cells.executivePhone,
      entity_name: cells.name,
    })
    .from(cells);

  const coordinatorUsers = await db
    .select({
      id: villages.id,
      name: villages.coordinatorName,
      phone: villages.coordinatorPhone,
      entity_name: villages.name,
      cell_name: cells.name,
    })
    .from(villages)
    .innerJoin(cells, eq(villages.cellId, cells.id))
    .where(sql`${villages.coordinatorPhone} is not null`);

  const sectorUsers = await db
    .select({
      id: sectors.id,
      name: sectors.officialName,
      phone: sectors.officialPhone,
      entity_name: sectors.name,
    })
    .from(sectors)
    .where(sql`${sectors.officialPhone} is not null`);

  const users = [
    ...cellUsers.map((row) => ({
      id: row.id,
      name: row.name,
      role: "cell_executive" as const,
      entity_name: row.entity_name,
      phone: row.phone,
      status: "active" as const,
    })),
    ...coordinatorUsers.map((row) => ({
      id: row.id,
      name: row.name ?? "Village Coordinator",
      role: "village_coordinator" as const,
      entity_name: `${row.entity_name} · ${row.cell_name}`,
      phone: row.phone ?? "",
      status: "active" as const,
    })),
    ...sectorUsers.map((row) => ({
      id: row.id,
      name: row.name ?? "Sector Official",
      role: "sector_official" as const,
      entity_name: row.entity_name,
      phone: row.phone ?? "",
      status: "active" as const,
    })),
    {
      id: "admin",
      name: "System Admin",
      role: "admin" as const,
      entity_name: "Tubyikorere Admin",
      phone: process.env.ADMIN_PHONE ?? "+250788000099",
      status: "active" as const,
    },
  ];

  const filtered =
    roleFilter && roleFilter !== "all"
      ? users.filter((user) => user.role === roleFilter)
      : users;

  return c.json(filtered);
});

adminRoutes.get("/activity", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const roleFilter = c.req.query("role");
  const entries = await buildActivityFeed(limit, roleFilter ?? undefined);
  return c.json(entries);
});

adminRoutes.patch("/provinces/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchProvinceSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const updates: Record<string, string> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.name_kinyarwanda) updates.nameKinyarwanda = parsed.data.name_kinyarwanda;
  if (parsed.data.code) updates.code = parsed.data.code;
  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(provinces).set(updates).where(eq(provinces.id, id)).returning();
  if (!updated) return c.json({ error: "Province not found" }, 404);
  return c.json(updated);
});

adminRoutes.patch("/districts/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchDistrictSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const updates: Record<string, string> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.name_kinyarwanda) updates.nameKinyarwanda = parsed.data.name_kinyarwanda;
  if (parsed.data.code) updates.code = parsed.data.code;
  if (parsed.data.province_id) updates.provinceId = parsed.data.province_id;
  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(districts).set(updates).where(eq(districts.id, id)).returning();
  if (!updated) return c.json({ error: "District not found" }, 404);
  return c.json(updated);
});

adminRoutes.patch("/sectors/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchSectorSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const updates: Record<string, string | boolean> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.name_kinyarwanda) updates.nameKinyarwanda = parsed.data.name_kinyarwanda;
  if (parsed.data.code) updates.code = parsed.data.code;
  if (parsed.data.official_name) updates.officialName = parsed.data.official_name;
  if (parsed.data.official_phone) updates.officialPhone = parsed.data.official_phone;
  if (parsed.data.pin) {
    updates.pin = parsed.data.pin;
    updates.isFirstLogin = true;
  }
  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(sectors).set(updates).where(eq(sectors.id, id)).returning();
  if (!updated) return c.json({ error: "Sector not found" }, 404);
  return c.json(updated);
});

adminRoutes.patch("/cells/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchCellSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const updates: Record<string, string | boolean> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.name_kinyarwanda) updates.nameKinyarwanda = parsed.data.name_kinyarwanda;
  if (parsed.data.executive_name) updates.executiveName = parsed.data.executive_name;
  if (parsed.data.executive_phone) updates.executivePhone = parsed.data.executive_phone;
  if (parsed.data.pin) {
    updates.pin = parsed.data.pin;
    updates.isFirstLogin = true;
  }
  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(cells).set(updates).where(eq(cells.id, id)).returning();
  if (!updated) return c.json({ error: "Cell not found" }, 404);
  return c.json(updated);
});

adminRoutes.patch("/villages/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchVillageSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const updates: Record<string, string | boolean> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.name_kinyarwanda) updates.nameKinyarwanda = parsed.data.name_kinyarwanda;
  if (parsed.data.coordinator_name) updates.coordinatorName = parsed.data.coordinator_name;
  if (parsed.data.coordinator_phone) updates.coordinatorPhone = parsed.data.coordinator_phone;
  if (parsed.data.pin) {
    updates.pin = parsed.data.pin;
    updates.isFirstLogin = true;
  }
  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(villages).set(updates).where(eq(villages.id, id)).returning();
  if (!updated) return c.json({ error: "Village not found" }, 404);
  return c.json(updated);
});

type ActivityEntry = {
  id: string;
  timestamp: string;
  action: string;
  actor_role: string;
  actor_name: string;
  entity: string;
  detail: string;
};

async function buildActivityFeed(limit: number, roleFilter?: string): Promise<ActivityEntry[]> {
  const [issueRows, reportRows, attendanceRows, sessionRows] = await Promise.all([
    db
      .select({
        id: issues.id,
        timestamp: issues.createdAt,
        summary: issues.summary,
        channel: issues.submissionChannel,
        cell_name: cells.name,
        village_name: villages.name,
      })
      .from(issues)
      .innerJoin(cells, eq(issues.cellId, cells.id))
      .leftJoin(villages, eq(issues.villageId, villages.id))
      .orderBy(desc(issues.createdAt))
      .limit(limit),
    db
      .select({
        id: sectorReports.id,
        timestamp: sectorReports.submittedAt,
        cell_name: cells.name,
      })
      .from(sectorReports)
      .innerJoin(cells, eq(sectorReports.cellId, cells.id))
      .where(sql`${sectorReports.submittedAt} is not null`)
      .orderBy(desc(sectorReports.submittedAt))
      .limit(limit),
    db
      .select({
        id: attendanceRecords.id,
        timestamp: attendanceRecords.recordedAt,
        village_name: villages.name,
        cell_name: cells.name,
        attended: attendanceRecords.attended,
      })
      .from(attendanceRecords)
      .innerJoin(villages, eq(attendanceRecords.villageId, villages.id))
      .innerJoin(cells, eq(villages.cellId, cells.id))
      .orderBy(desc(attendanceRecords.recordedAt))
      .limit(limit),
    db
      .select({
        id: umugandaSessions.id,
        timestamp: umugandaSessions.updatedAt,
        status: umugandaSessions.status,
        cell_name: cells.name,
      })
      .from(umugandaSessions)
      .innerJoin(cells, eq(umugandaSessions.cellId, cells.id))
      .orderBy(desc(umugandaSessions.updatedAt))
      .limit(limit),
  ]);

  const entries: ActivityEntry[] = [
    ...issueRows.map((row) => ({
      id: `issue-${row.id}`,
      timestamp: row.timestamp.toISOString(),
      action: "issue_submitted",
      actor_role: "citizen",
      actor_name: row.channel === "whatsapp" ? "WhatsApp submitter" : "Web submitter",
      entity: row.cell_name,
      detail: `${row.village_name ?? "Unknown village"}: ${row.summary}`,
    })),
    ...reportRows
      .filter((row) => row.timestamp)
      .map((row) => ({
        id: `report-${row.id}`,
        timestamp: row.timestamp!.toISOString(),
        action: "report_submitted",
        actor_role: "cell_executive",
        actor_name: "Cell executive",
        entity: row.cell_name,
        detail: "Sector report submitted",
      })),
    ...attendanceRows.map((row) => ({
      id: `attendance-${row.id}`,
      timestamp: row.timestamp.toISOString(),
      action: "attendance_recorded",
      actor_role: "village_coordinator",
      actor_name: "Village coordinator",
      entity: row.cell_name,
      detail: `${row.village_name}: ${row.attended} attended`,
    })),
    ...sessionRows.map((row) => ({
      id: `session-${row.id}`,
      timestamp: row.timestamp.toISOString(),
      action: "session_updated",
      actor_role: "cell_executive",
      actor_name: "Cell executive",
      entity: row.cell_name,
      detail: `Umuganda session ${row.status}`,
    })),
  ];

  const sorted = entries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  if (!roleFilter || roleFilter === "all") return sorted;
  return sorted.filter((entry) => entry.actor_role === roleFilter);
}
