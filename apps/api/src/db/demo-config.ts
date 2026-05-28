/** Stable demo cell ID — Bibare (Kimironko sector, Gasabo). */
export const DEMO_CELL_ID = "573fe872-c863-4e51-9cd7-cc129fc6fa2f";

export const DEMO_CELL_NAME = "Bibare";
export const DEMO_SECTOR_NAME = "Kimironko";
export const DEMO_DISTRICT_NAME = "Gasabo";

/** Villages in Bibare cell used for coordinator demo logins. */
export const DEMO_VILLAGES = ["Abatuje", "Amariza", "Imanzi"] as const;

export type DemoVillageName = (typeof DEMO_VILLAGES)[number];
