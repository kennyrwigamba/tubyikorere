import { Link } from "react-router-dom";
import { MapPinIcon } from "lucide-react";

import { AuthPageShell } from "@/components/molecules/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFoundRoute() {
  return (
    <AuthPageShell title="Page not found" subtitle="The page you're looking for doesn't exist.">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPinIcon className="size-4 text-muted-foreground" aria-hidden />
            404
          </CardTitle>
          <CardDescription>
            Tubyikorere couldn&apos;t find that route. Check the link or return home.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="h-11 w-full">
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link to="/submit">Report an issue</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link to="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
