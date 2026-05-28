import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  AlertCircleIcon,
  KeyRoundIcon,
  LogOutIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { fetchCoordinatorProfile } from "@/lib/api/coordinator";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAppStore } from "@/store";

const changePinSchema = z
  .object({
    current_pin: z.string().trim().regex(/^\d{4}$/, "Current PIN must be 4 digits"),
    new_pin: z.string().trim().regex(/^\d{4}$/, "New PIN must be 4 digits"),
    confirm_new_pin: z.string().trim().regex(/^\d{4}$/, "Confirmation PIN must be 4 digits"),
  })
  .refine((data) => data.new_pin === data.confirm_new_pin, {
    message: "New PIN and confirmation do not match",
    path: ["confirm_new_pin"],
  })
  .refine((data) => data.current_pin !== data.new_pin, {
    message: "New PIN must be different from current PIN",
    path: ["new_pin"],
  });

type ChangePinValues = z.infer<typeof changePinSchema>;

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function CoordinatorSettingsRoute() {
  const navigate = useNavigate();
  const { userId, userName, entityName, logout } = useAppStore();
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["coordinator-profile", userId],
    queryFn: () => fetchCoordinatorProfile(userId),
    enabled: Boolean(userId),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePinValues>({
    defaultValues: { current_pin: "", new_pin: "", confirm_new_pin: "" },
  });

  const onChangePin = async (values: ChangePinValues) => {
    setPinError(null);
    setPinSuccess(false);
    const parsed = changePinSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.current_pin?.[0]) {
        setError("current_pin", { message: fieldErrors.current_pin[0] });
      }
      if (fieldErrors.new_pin?.[0]) {
        setError("new_pin", { message: fieldErrors.new_pin[0] });
      }
      if (fieldErrors.confirm_new_pin?.[0]) {
        setError("confirm_new_pin", { message: fieldErrors.confirm_new_pin[0] });
      }
      return;
    }

    try {
      await api.post("/api/auth/change-pin", {
        current_pin: parsed.data.current_pin,
        new_pin: parsed.data.new_pin,
        role: "village_coordinator",
        user_id: userId,
      });
      reset();
      setPinSuccess(true);
      toast.success("PIN updated");
    } catch (err) {
      setPinError(getApiErrorMessage(err, "Unable to change PIN."));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading settings..." fullPage />;
  }

  return (
    <>
      <PageHeader title="Settings" description="Village profile and security" />

      <div className="flex flex-col gap-6 px-4 pt-5 pb-8 lg:px-6 lg:pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Failed to load profile</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        {profile ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPinIcon className="size-4 text-muted-foreground" aria-hidden />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Village" value={profile.village.name} />
                <ProfileField label="Cell" value={profile.cell.name} />
                <ProfileField label="Sector" value={profile.sector.name} />
                <ProfileField label="District" value={profile.district.name} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon className="size-4 text-muted-foreground" aria-hidden />
                  Coordinator
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <ProfileField
                  label="Name"
                  value={profile.village.coordinator_name || userName || entityName}
                />
                <div className="space-y-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Phone
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <PhoneIcon className="size-3.5 text-muted-foreground" aria-hidden />
                    {profile.village.coordinator_phone ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRoundIcon className="size-4 text-muted-foreground" aria-hidden />
                  Change PIN
                </CardTitle>
                <CardDescription>Update your 4-digit login PIN</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onChangePin)} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="current_pin">Current PIN</Label>
                      <Input
                        id="current_pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoComplete="current-password"
                        {...register("current_pin")}
                        aria-invalid={Boolean(errors.current_pin)}
                      />
                      {errors.current_pin ? (
                        <p className="text-xs text-destructive">{errors.current_pin.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_pin">New PIN</Label>
                      <Input
                        id="new_pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoComplete="new-password"
                        {...register("new_pin")}
                        aria-invalid={Boolean(errors.new_pin)}
                      />
                      {errors.new_pin ? (
                        <p className="text-xs text-destructive">{errors.new_pin.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_new_pin">Confirm PIN</Label>
                      <Input
                        id="confirm_new_pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoComplete="new-password"
                        {...register("confirm_new_pin")}
                        aria-invalid={Boolean(errors.confirm_new_pin)}
                      />
                      {errors.confirm_new_pin ? (
                        <p className="text-xs text-destructive">{errors.confirm_new_pin.message}</p>
                      ) : null}
                    </div>
                  </div>

                  {pinError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{pinError}</AlertDescription>
                    </Alert>
                  ) : null}
                  {pinSuccess ? (
                    <Alert>
                      <AlertDescription>Your PIN has been updated.</AlertDescription>
                    </Alert>
                  ) : null}

                  <Button type="submit" disabled={isSubmitting} className="h-11 w-full sm:w-auto">
                    <KeyRoundIcon className="size-4" aria-hidden />
                    {isSubmitting ? "Updating…" : "Update PIN"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : null}

        <Separator />

        <Button
          variant="outline"
          className="h-11 w-full text-destructive hover:text-destructive sm:w-auto"
          onClick={handleLogout}
        >
          <LogOutIcon className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </>
  );
}
