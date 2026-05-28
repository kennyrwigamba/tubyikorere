import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -----------------------------
// Enums
// -----------------------------

export const issueCategoryEnum = pgEnum("issue_category", [
  "infrastructure",
  "water",
  "health",
  "education",
  "environment",
  "safety",
  "other",
]);

export const issueStatusEnum = pgEnum("issue_status", [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "escalated",
  "closed",
]);

export const submissionChannelEnum = pgEnum("submission_channel", [
  "web",
  "whatsapp",
]);

export const umugandaSessionStatusEnum = pgEnum("umuganda_session_status", [
  "planned",
  "active",
  "completed",
]);

export const workCompletionStatusEnum = pgEnum("work_completion_status", [
  "resolved",
  "partial",
  "escalated",
]);

export const sectorReportStatusEnum = pgEnum("sector_report_status", [
  "draft",
  "approved",
  "submitted",
]);

// -----------------------------
// Hierarchy tables
// -----------------------------

export const provinces = pgTable("provinces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameKinyarwanda: text("name_kinyarwanda").notNull(),
  code: text("code").notNull().unique(),
});

export const districts = pgTable("districts", {
  id: uuid("id").defaultRandom().primaryKey(),
  provinceId: uuid("province_id")
    .notNull()
    .references(() => provinces.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameKinyarwanda: text("name_kinyarwanda").notNull(),
  code: text("code").notNull().unique(),
});

export const sectors = pgTable("sectors", {
  id: uuid("id").defaultRandom().primaryKey(),
  districtId: uuid("district_id")
    .notNull()
    .references(() => districts.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameKinyarwanda: text("name_kinyarwanda").notNull(),
  code: text("code").notNull().unique(),
  officialName: text("official_name"),
  officialPhone: text("official_phone"),
  // Demo-only: plain text PIN (production would hash).
  pin: text("pin"),
  isFirstLogin: boolean("is_first_login").notNull().default(true),
});

export const cells = pgTable("cells", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectorId: uuid("sector_id")
    .notNull()
    .references(() => sectors.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameKinyarwanda: text("name_kinyarwanda").notNull(),
  executiveName: text("executive_name").notNull(),
  executivePhone: text("executive_phone").notNull(),
  // Demo-only: plain text PIN (production would hash).
  pin: text("pin").notNull(),
  isFirstLogin: boolean("is_first_login").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const villages = pgTable("villages", {
  id: uuid("id").defaultRandom().primaryKey(),
  cellId: uuid("cell_id")
    .notNull()
    .references(() => cells.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameKinyarwanda: text("name_kinyarwanda").notNull(),
  coordinatorName: text("coordinator_name"),
  coordinatorPhone: text("coordinator_phone"),
  // Demo-only: plain text PIN (production would hash).
  pin: text("pin"),
  isFirstLogin: boolean("is_first_login").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// -----------------------------
// Application tables
// -----------------------------

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cellId: uuid("cell_id")
      .notNull()
      .references(() => cells.id, { onDelete: "restrict" }),
    villageId: uuid("village_id").references(() => villages.id, {
      onDelete: "set null",
    }),
    rawText: text("raw_text").notNull(),
    submissionChannel: submissionChannelEnum("submission_channel").notNull(),
    submitterPhone: text("submitter_phone"),
    languageDetected: text("language_detected"),
    category: issueCategoryEnum("category").notNull(),
    severity: integer("severity").notNull(),
    severityReason: text("severity_reason").notNull(),
    summary: text("summary").notNull(),
    recommendedAction: text("recommended_action").notNull(),
    estimatedParticipants: integer("estimated_participants").notNull(),
    requiresEscalation: boolean("requires_escalation").notNull().default(false),
    escalationReason: text("escalation_reason"),
    status: issueStatusEnum("status").notNull().default("open"),
    umugandaSessionId: uuid("umuganda_session_id").references(
      () => umugandaSessions.id,
      { onDelete: "set null" }
    ),
    resolutionNotes: text("resolution_notes"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    issuesCellIdIdx: index("issues_cell_id_idx").on(t.cellId),
    issuesStatusIdx: index("issues_status_idx").on(t.status),
    issuesSeverityIdx: index("issues_severity_idx").on(t.severity),
  })
);

export const umugandaSessions = pgTable(
  "umuganda_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cellId: uuid("cell_id")
      .notNull()
      .references(() => cells.id, { onDelete: "restrict" }),
    sessionDate: date("session_date").notNull(),
    expectedParticipants: integer("expected_participants").notNull(),
    actualParticipants: integer("actual_participants"),
    status: umugandaSessionStatusEnum("status").notNull().default("planned"),
    planningNotes: text("planning_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sessionsCellIdIdx: index("umuganda_sessions_cell_id_idx").on(t.cellId),
  })
);

export const sessionAssignments = pgTable("session_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => umugandaSessions.id, { onDelete: "cascade" }),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  groupName: text("group_name").notNull(),
  assignedParticipants: integer("assigned_participants").notNull(),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }).notNull(),
  taskDescription: text("task_description").notNull(),
  materialsNeeded: text("materials_needed"),
  displayOrder: integer("display_order").notNull(),
});

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => umugandaSessions.id, { onDelete: "cascade" }),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "restrict" }),
    attended: integer("attended").notNull(),
    absent: integer("absent").notNull(),
    recordedBy: text("recorded_by").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    attendanceSessionIdIdx: index("attendance_records_session_id_idx").on(
      t.sessionId
    ),
  })
);

export const workCompletions = pgTable("work_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => umugandaSessions.id, { onDelete: "cascade" }),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "restrict" }),
  completionStatus: workCompletionStatusEnum("completion_status").notNull(),
  completionNotes: text("completion_notes").notNull(),
  photoUrl: text("photo_url"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sectorReports = pgTable("sector_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => umugandaSessions.id, { onDelete: "cascade" })
    .unique(),
  cellId: uuid("cell_id")
    .notNull()
    .references(() => cells.id, { onDelete: "restrict" }),
  reportText: text("report_text").notNull(),
  keyAchievements: text("key_achievements").array().notNull().default([]),
  escalations: text("escalations").array().notNull().default([]),
  attendanceRate: decimal("attendance_rate", { precision: 5, scale: 2 }).notNull(),
  status: sectorReportStatusEnum("status").notNull().default("draft"),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

// -----------------------------
// Relations
// -----------------------------

export const provincesRelations = relations(provinces, ({ many }) => ({
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  province: one(provinces, {
    fields: [districts.provinceId],
    references: [provinces.id],
  }),
  sectors: many(sectors),
}));

export const sectorsRelations = relations(sectors, ({ one, many }) => ({
  district: one(districts, {
    fields: [sectors.districtId],
    references: [districts.id],
  }),
  cells: many(cells),
}));

export const cellsRelations = relations(cells, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [cells.sectorId],
    references: [sectors.id],
  }),
  villages: many(villages),
  issues: many(issues),
  sessions: many(umugandaSessions),
  sectorReports: many(sectorReports),
}));

export const villagesRelations = relations(villages, ({ one, many }) => ({
  cell: one(cells, {
    fields: [villages.cellId],
    references: [cells.id],
  }),
  issues: many(issues),
  attendanceRecords: many(attendanceRecords),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  cell: one(cells, {
    fields: [issues.cellId],
    references: [cells.id],
  }),
  village: one(villages, {
    fields: [issues.villageId],
    references: [villages.id],
  }),
  session: one(umugandaSessions, {
    fields: [issues.umugandaSessionId],
    references: [umugandaSessions.id],
  }),
  assignments: many(sessionAssignments),
  workCompletions: many(workCompletions),
}));

export const umugandaSessionsRelations = relations(
  umugandaSessions,
  ({ one, many }) => ({
    cell: one(cells, {
      fields: [umugandaSessions.cellId],
      references: [cells.id],
    }),
    issues: many(issues),
    assignments: many(sessionAssignments),
    attendanceRecords: many(attendanceRecords),
    workCompletions: many(workCompletions),
    sectorReport: many(sectorReports),
  })
);

export const sessionAssignmentsRelations = relations(
  sessionAssignments,
  ({ one }) => ({
    session: one(umugandaSessions, {
      fields: [sessionAssignments.sessionId],
      references: [umugandaSessions.id],
    }),
    issue: one(issues, {
      fields: [sessionAssignments.issueId],
      references: [issues.id],
    }),
  })
);

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    session: one(umugandaSessions, {
      fields: [attendanceRecords.sessionId],
      references: [umugandaSessions.id],
    }),
    village: one(villages, {
      fields: [attendanceRecords.villageId],
      references: [villages.id],
    }),
  })
);

export const workCompletionsRelations = relations(workCompletions, ({ one }) => ({
  session: one(umugandaSessions, {
    fields: [workCompletions.sessionId],
    references: [umugandaSessions.id],
  }),
  issue: one(issues, {
    fields: [workCompletions.issueId],
    references: [issues.id],
  }),
}));

export const sectorReportsRelations = relations(sectorReports, ({ one }) => ({
  session: one(umugandaSessions, {
    fields: [sectorReports.sessionId],
    references: [umugandaSessions.id],
  }),
  cell: one(cells, {
    fields: [sectorReports.cellId],
    references: [cells.id],
  }),
}));
