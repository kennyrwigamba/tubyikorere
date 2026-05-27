import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(databaseUrl, { prepare: false });

const tables = [
  "provinces",
  "districts",
  "sectors",
  "cells",
  "villages",
  "issues",
  "umuganda_sessions",
  "session_assignments",
  "attendance_records",
  "work_completions",
  "sector_reports",
] as const;

for (const table of tables) {
  const rows = await sql.unsafe<{ c: number }[]>(
    `select count(*)::int as c from ${table}`
  );
  console.log(`${table}: ${rows[0].c}`);
}

await sql.end();
