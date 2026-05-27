import { AlertTriangle, ClipboardList, FileCheck2, Users } from "lucide-react";

import { CategoryChip } from "@/components/atoms/CategoryChip";
import { ChannelIcon } from "@/components/atoms/ChannelIcon";
import { EmptyState } from "@/components/atoms/EmptyState";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { SeverityBadge } from "@/components/atoms/SeverityBadge";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { AssignmentGroup } from "@/components/molecules/AssignmentGroup";
import { AttendanceRow } from "@/components/molecules/AttendanceRow";
import { IssueCard } from "@/components/molecules/IssueCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { ReportDocument } from "@/components/molecules/ReportDocument";
import { StatCard } from "@/components/molecules/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const demoIssues = [
  {
    severity: 5,
    category: "infrastructure",
    status: "open",
    summary: "Umuhanda ujya ku ishuri ribanza urengerwa n'amazi igihe cy'imvura.",
    villageName: "Rugarama",
    channel: "whatsapp" as const,
    createdAt: "2026-05-27T08:30:00.000Z",
    requiresEscalation: false,
  },
  {
    severity: 4,
    category: "water",
    status: "assigned",
    summary: "Ingo 12 muri Rugarama ntizifite amazi meza kubera umuyoboro wangiritse.",
    villageName: "Rugarama",
    channel: "web" as const,
    createdAt: "2026-05-26T10:45:00.000Z",
    requiresEscalation: true,
  },
];

export default function DesignRoute() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Tubikorere Design Foundation"
        subtitle="Atom, molecule, and layout components preview with realistic Rwanda demo data."
        action={<Button>Primary Action</Button>}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} value="26" label="Open Issues" emphasis="warning" />
        <StatCard icon={AlertTriangle} value="8" label="Critical Issues" />
        <StatCard icon={Users} value="118" label="Expected Participants" trend="+12 vs last month" />
        <StatCard icon={FileCheck2} value="Draft" label="Latest Sector Report" emphasis="positive" />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Atoms</h2>
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={5} />
              <SeverityBadge severity={4} />
              <SeverityBadge severity={3} />
              <SeverityBadge severity={2} />
              <SeverityBadge severity={1} />
              <SeverityBadge severity={5} size="lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="open" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="resolved" />
              <StatusBadge status="planned" />
              <StatusBadge status="approved" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryChip category="infrastructure" />
              <CategoryChip category="environment" />
              <ChannelIcon channel="whatsapp" />
              <ChannelIcon channel="web" />
            </div>
            <LoadingSpinner label="Claude is planning your session..." />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Issue Cards</h2>
        <div className="grid gap-3">
          {demoIssues.map((issue) => (
            <IssueCard key={issue.summary} {...issue} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Assignment Groups</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <AssignmentGroup
            group="A"
            participants={60}
            issueSummary="Road to school floods during rain in Rugarama"
            severity={5}
            taskDescription="Clear blocked drainage, build temporary channel, and place warning markers near school crossing."
            estimatedHours={3}
            materials="Shovels, hoes, gloves"
          />
          <AssignmentGroup
            group="B"
            participants={40}
            issueSummary="Damaged water pipe affecting 12 households"
            severity={4}
            taskDescription="Inspect damaged pipe section, coordinate replacement segment, and verify restored flow to affected households."
            estimatedHours={3}
            materials="Pipe clamps, wrench set"
            partial
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Attendance Table</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Village</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Attended</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AttendanceRow villageName="Rugarama" coordinatorName="Murekatete Alice" attended={34} absent={6} />
                <AttendanceRow villageName="Kibagabaga" coordinatorName="Habimana Eric" attended={27} absent={9} />
                <AttendanceRow villageName="Nyarutarama" coordinatorName="Ingabire Diane" attended={31} absent={5} />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Report Document</h2>
        <ReportDocument
          title="Raporo y'Umuganda — Akagari ka Kimironko"
          reportText={`Ku wa Gatandatu wa nyuma w'ukwezi, abaturage b'Akagari ka Kimironko bitabiriye umuganda ku kigero gishimishije.\n\nHakozwe ibikorwa byo gusana umuhanda ujya ku ishuri no gukuraho imyanda hafi y'isoko. Abaturage bagaragaje ubufatanye bwiza, kandi ibikorwa byashyizwe mu matsinda byafashije kwihutisha akazi.`}
          keyAchievements={[
            "Umuhanda ujya ku ishuri watunganyijwe ku kigero kinini",
            "Imyanda yo ku isoko yakuwemo kandi yashyizwe ahabugenewe",
            "Abaturage 92 bitabiriye umuganda",
          ]}
          escalations={[
            "Umuyoboro w'amazi wa Rugarama ukeneye inkunga y'urwego rw'umurenge",
            "Urukuta rw'ishuri rwa Kibagabaga rukeneye gusanwa byihuse",
          ]}
        />
      </section>

      <EmptyState
        title="Nta bibazo bishya bihari"
        description="Muri iki gihe nta kibazo gishya cyatanzwe muri Kimironko Cell. Kanda hasi kugira ngo wongere urebe."
        action={<Button variant="outline">Refresh Issues</Button>}
      />
    </div>
  );
}
