import type { cells } from "./db/schema";

export type AppVariables = {
  cell?: typeof cells.$inferSelect;
  sectorId?: string;
  isAdmin?: boolean;
};

export type AppEnv = {
  Variables: AppVariables;
};
