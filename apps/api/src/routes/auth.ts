import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client";
import { cells, sectors, villages } from "../db/schema";

const loginSchema = z.object({
  phone: z.string().min(1),
  pin: z.string().min(1),
});

const changePinSchema = z.object({
  current_pin: z.string().regex(/^\d{4}$/),
  new_pin: z.string().regex(/^\d{4}$/),
  role: z.enum(["cell_executive", "village_coordinator", "sector_official"]),
  user_id: z.string().uuid(),
});

export type AuthRole =
  | "cell_executive"
  | "village_coordinator"
  | "sector_official"
  | "admin";

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "").replace(/[-()]/g, "");
}

function toRwandaCanonical(phone: string): string | null {
  const value = normalizePhone(phone);
  if (!value) return null;

  if (value.startsWith("+250") && /^7\d{8}$/.test(value.slice(4))) {
    return value;
  }
  if (value.startsWith("250") && /^7\d{8}$/.test(value.slice(3))) {
    return `+${value}`;
  }
  if (value.startsWith("0") && /^7\d{8}$/.test(value.slice(1))) {
    return `+250${value.slice(1)}`;
  }
  if (/^7\d{8}$/.test(value)) {
    return `+250${value}`;
  }

  return null;
}

function phonesMatch(a: string, b: string): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  if (left === right) return true;
  if (left.startsWith("+") && right === left.slice(1)) return true;
  if (right.startsWith("+") && left === right.slice(1)) return true;
  const leftRw = toRwandaCanonical(left);
  const rightRw = toRwandaCanonical(right);
  if (leftRw && rightRw && leftRw === rightRw) return true;
  return false;
}

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const phone = normalizePhone(parsed.data.phone);
  const { pin } = parsed.data;

  const adminPhone = process.env.ADMIN_PHONE ?? "+250788000099";
  const adminPin = process.env.ADMIN_PIN ?? "admin123";
  if (phonesMatch(phone, adminPhone) && pin === adminPin) {
    return c.json({
      user_id: "admin",
      role: "admin" satisfies AuthRole,
      user_name: "System Admin",
      entity_name: "Tubikorere Admin",
      entity_id: "admin",
      is_first_login: false,
    });
  }

  const cellRows = await db.select().from(cells);
  const cellMatch = cellRows.find(
    (row) => phonesMatch(row.executivePhone, phone) && row.pin === pin,
  );
  if (cellMatch) {
    return c.json({
      user_id: cellMatch.id,
      role: "cell_executive" satisfies AuthRole,
      user_name: cellMatch.executiveName,
      entity_name: cellMatch.name,
      entity_id: cellMatch.id,
      is_first_login: cellMatch.isFirstLogin,
    });
  }

  const villageRows = await db
    .select({
      village: villages,
      cell_name: cells.name,
    })
    .from(villages)
    .innerJoin(cells, eq(villages.cellId, cells.id));

  const villageMatch = villageRows.find(
    (row) =>
      row.village.coordinatorPhone &&
      row.village.pin &&
      phonesMatch(row.village.coordinatorPhone, phone) &&
      row.village.pin === pin,
  );
  if (villageMatch) {
    return c.json({
      user_id: villageMatch.village.id,
      role: "village_coordinator" satisfies AuthRole,
      user_name: villageMatch.village.coordinatorName ?? "Village Coordinator",
      entity_name: villageMatch.village.name,
      entity_id: villageMatch.village.cellId,
      is_first_login: villageMatch.village.isFirstLogin,
    });
  }

  const sectorRows = await db.select().from(sectors);
  const sectorMatch = sectorRows.find(
    (row) =>
      row.officialPhone &&
      row.pin &&
      phonesMatch(row.officialPhone, phone) &&
      row.pin === pin,
  );
  if (sectorMatch) {
    return c.json({
      user_id: sectorMatch.id,
      role: "sector_official" satisfies AuthRole,
      user_name: sectorMatch.officialName ?? "Sector Official",
      entity_name: sectorMatch.name,
      entity_id: sectorMatch.id,
      is_first_login: sectorMatch.isFirstLogin,
    });
  }

  return c.json({ error: "Invalid phone number or PIN" }, 401);
});

authRoutes.post("/change-pin", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = changePinSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request body" }, 400);

  const { current_pin, new_pin, role, user_id } = parsed.data;

  if (role === "cell_executive") {
    const [row] = await db.select().from(cells).where(eq(cells.id, user_id)).limit(1);
    if (!row || row.pin !== current_pin) {
      return c.json({ error: "Current PIN is incorrect" }, 401);
    }

    const [updated] = await db
      .update(cells)
      .set({ pin: new_pin, isFirstLogin: false })
      .where(eq(cells.id, user_id))
      .returning();

    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json({ ok: true });
  }

  if (role === "village_coordinator") {
    const [row] = await db.select().from(villages).where(eq(villages.id, user_id)).limit(1);
    if (!row?.pin || row.pin !== current_pin) {
      return c.json({ error: "Current PIN is incorrect" }, 401);
    }

    const [updated] = await db
      .update(villages)
      .set({ pin: new_pin, isFirstLogin: false })
      .where(eq(villages.id, user_id))
      .returning();

    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json({ ok: true });
  }

  const [row] = await db.select().from(sectors).where(eq(sectors.id, user_id)).limit(1);
  if (!row?.pin || row.pin !== current_pin) {
    return c.json({ error: "Current PIN is incorrect" }, 401);
  }

  const [updated] = await db
    .update(sectors)
    .set({ pin: new_pin, isFirstLogin: false })
    .where(eq(sectors.id, user_id))
    .returning();

  if (!updated) return c.json({ error: "User not found" }, 404);
  return c.json({ ok: true });
});
