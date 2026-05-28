import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, ClipboardListIcon, SearchIcon } from "lucide-react";

import { EmptyState } from "@/components/atoms/EmptyState";
import { IssueCardList } from "@/components/molecules/IssueCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  countIssuesByTab,
  fetchCellIssues,
  ISSUE_LIST_TABS,
  issueMatchesTab,
  type IssueListTab,
} from "@/lib/api/issues";
import { useAppStore } from "@/store";

const EMPTY_MESSAGES: Record<IssueListTab, { title: string; description: string }> = {
  all: {
    title: "No issues yet",
    description: "When citizens submit problems, they appear here for review.",
  },
  open: {
    title: "No open issues",
    description: "All reported issues have been assigned or resolved.",
  },
  assigned: {
    title: "Nothing assigned",
    description: "No issues are currently assigned to umuganda work.",
  },
  resolved: {
    title: "No resolved issues",
    description: "Resolved issues will show here once work is completed.",
  },
  escalated: {
    title: "No escalated issues",
    description: "Issues sent to sector level will appear in this tab.",
  },
};

export default function CellExecutiveIssuesRoute() {
  const navigate = useNavigate();
  const { entityId, entityName } = useAppStore();
  const [tab, setTab] = useState<IssueListTab>("all");
  const [search, setSearch] = useState("");

  const {
    data: issues = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cell-exec-issues", entityId],
    queryFn: () => fetchCellIssues(entityId),
    enabled: Boolean(entityId),
  });

  const counts = useMemo(() => countIssuesByTab(issues), [issues]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issues
      .filter((issue) => issueMatchesTab(issue, tab))
      .filter(
        (issue) =>
          !query ||
          issue.summary.toLowerCase().includes(query) ||
          issue.villageName.toLowerCase().includes(query),
      )
      .sort((a, b) => b.severity - a.severity || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [issues, tab, search]);

  const emptyMessage = EMPTY_MESSAGES[tab];

  return (
    <>
      <PageHeader
        title="Issues"
        description={
          entityName
            ? `${issues.length} reported in ${entityName} · sorted by severity`
            : "Full issue backlog for your cell"
        }
      />

      <div className="flex flex-col gap-5 px-4 pt-5 pb-6 lg:px-6 lg:pt-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by summary or village..."
            className="h-10 bg-card pl-9"
            aria-label="Search issues"
          />
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as IssueListTab)}>
          <TabsList className="h-10 w-full justify-start overflow-x-auto overflow-y-hidden rounded-md border border-input bg-muted p-1">
            {ISSUE_LIST_TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="h-8 shrink-0 flex-none px-3">
                {item.label}
                <span className="text-muted-foreground">({counts[item.value]})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="pt-1">
        {isLoading ? (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Loading issues...</div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load issues</AlertTitle>
            <AlertDescription>{(error as Error).message || "Please try again."}</AlertDescription>
          </Alert>
        ) : filteredIssues.length > 0 ? (
          <IssueCardList
            issues={filteredIssues}
            onIssueClick={(issue) => navigate(`/cell-executive/issues/${issue.id}`)}
          />
        ) : (
          <EmptyState
            icon={ClipboardListIcon}
            title={search ? "No matching issues" : emptyMessage.title}
            description={
              search
                ? `Nothing matches "${search}" in ${ISSUE_LIST_TABS.find((t) => t.value === tab)?.label ?? tab}.`
                : emptyMessage.description
            }
          />
        )}
        </div>
      </div>
    </>
  );
}
