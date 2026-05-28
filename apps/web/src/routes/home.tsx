import { Link, Navigate } from "react-router-dom";
import {
  ClipboardListIcon,
  LogInIcon,
  MapPinIcon,
  MessageSquarePlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_DEFAULT_ROUTE } from "@/lib/role-routes";
import { useAppStore } from "@/store";

const highlights = [
  {
    icon: MessageSquarePlusIcon,
    title: "Report issues",
    titleRw: "Menyesha ibibazo",
    description: "Describe community problems in your own words — Kinyarwanda, English, or mixed.",
  },
  {
    icon: ClipboardListIcon,
    title: "Cell review",
    titleRw: "Isuzuma ry'akagari",
    description: "Issues are scored and prioritized for the cell executive and Umuganda planning.",
  },
  {
    icon: UsersIcon,
    title: "Community action",
    titleRw: "Imikorere y'umuryango",
    description: "Villages coordinate attendance and track resolution through local leadership.",
  },
] as const;

export default function HomeRoute() {
  const { isAuthenticated, role } = useAppStore();

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_DEFAULT_ROUTE[role]} replace />;
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPinIcon className="size-7" aria-hidden />
          </div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Tubikorere</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Let&apos;s handle it together
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">Hamwe tuzabasha</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            A community platform for Bibare cell (Kimironko sector) — report local issues, track
            progress, and support Umuganda coordination between citizens and local leaders.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Urubuga rw&apos;ubufatanye mu kagari ka Bibare (umurenge wa Kimironko) — menyesha
            ibibazo, ukurikirane
            imiterere, kandi ufashe gutegura Umuganda.
          </p>
        </header>

        <section aria-label="How it works" className="mb-8 space-y-3">
          {highlights.map(({ icon: Icon, title, titleRw, description }) => (
            <Card key={title} className="border-border/80 shadow-sm">
              <CardContent className="flex gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{titleRw}</p>
                  <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section aria-label="Actions" className="mt-auto space-y-3">
          <Button asChild size="lg" className="h-12 w-full text-base">
            <Link to="/submit">
              <MessageSquarePlusIcon className="size-5" aria-hidden />
              Report an issue / Menyesha ikibazo
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" size="lg" className="h-12">
              <Link to="/track">
                <SearchIcon className="size-4" aria-hidden />
                Track / Kurikirana
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12">
              <Link to="/login">
                <LogInIcon className="size-4" aria-hidden />
                Sign in / Injira
              </Link>
            </Button>
          </div>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Officials and coordinators — use Sign in to access your portal.
          </p>
        </section>
      </div>
    </main>
  );
}
