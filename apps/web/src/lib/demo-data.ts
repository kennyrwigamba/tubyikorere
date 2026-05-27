import type { IssuePreview } from "@/lib/types/issue";

export const DEMO_ISSUES: IssuePreview[] = [
  {
    id: "1",
    summary: "Road to primary school floods during rain, children at safety risk",
    category: "infrastructure",
    severity: 5,
    status: "open",
    submissionChannel: "whatsapp",
    villageName: "Rugarama",
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    requiresEscalation: false,
  },
  {
    id: "2",
    summary: "12 households in Rugarama lost clean water — pipe infrastructure damaged",
    category: "water",
    severity: 4,
    status: "open",
    submissionChannel: "whatsapp",
    villageName: "Rugarama",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    requiresEscalation: true,
  },
  {
    id: "3",
    summary: "Crumbling school perimeter wall poses daily danger to children",
    category: "infrastructure",
    severity: 4,
    status: "assigned",
    submissionChannel: "web",
    villageName: "Kibagabaga",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    requiresEscalation: false,
  },
  {
    id: "4",
    summary: "Market waste dump overflowing, creating health hazard for surrounding households",
    category: "environment",
    severity: 3,
    status: "in_progress",
    submissionChannel: "web",
    villageName: "Nyarutarama",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    requiresEscalation: false,
  },
];

export const DEMO_STATS = {
  openIssues: 5,
  attendanceRate: 87,
  nextUmuganda: "Sat 31 May",
  resolvedThisMonth: 12,
} as const;
