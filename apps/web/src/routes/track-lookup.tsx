import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchIcon } from "lucide-react";

import { AuthPageShell } from "@/components/molecules/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyInfo } from "@/lib/notify";

export default function TrackLookupRoute() {
  const navigate = useNavigate();
  const [reference, setReference] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const ref = reference.trim().replace(/^#/, "").toUpperCase();
    if (ref.length >= 8) {
      navigate(`/track/${ref}`, { replace: true });
      return;
    }
    notifyInfo("Enter at least 8 characters from your reference ID.");
  };

  return (
    <AuthPageShell
      title="Track your issue"
      subtitle="Enter the reference from your WhatsApp confirmation."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue reference / Nomero y&apos;ikibazo</CardTitle>
          <CardDescription>
            Use the 8-character ID from your confirmation message (e.g. 9024F134).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference ID</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
                placeholder="9024F134"
                maxLength={36}
                className="h-11 font-mono uppercase"
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={reference.trim().length < 8}>
              <SearchIcon className="size-4" aria-hidden />
              Track issue
            </Button>
          </form>
          <Button asChild variant="outline" className="mt-3 h-11 w-full">
            <Link to="/submit">Report a new issue</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
