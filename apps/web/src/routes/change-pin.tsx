import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AlertCircleIcon, KeyRoundIcon } from "lucide-react";

import { AuthPageShell } from "@/components/molecules/AuthPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import { ROLE_DEFAULT_ROUTE } from "@/lib/role-routes";
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

export default function ChangePinRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, role, isFirstLogin, userId, setAuth } = useAppStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePinValues>({
    defaultValues: {
      current_pin: "",
      new_pin: "",
      confirm_new_pin: "",
    },
  });

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin" || !isFirstLogin) {
    return <Navigate to={ROLE_DEFAULT_ROUTE[role]} replace />;
  }

  const onSubmit = async (values: ChangePinValues) => {
    setServerError(null);
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
        role,
        user_id: userId,
      });

      setAuth({ isFirstLogin: false });
      notifySuccess("PIN updated successfully");
      navigate(ROLE_DEFAULT_ROUTE[role], { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to change PIN. Please try again.");
      setServerError(message);
      notifyError(message);
    }
  };

  return (
    <AuthPageShell title="Change PIN" subtitle="Set your personal PIN before continuing">
      <Card>
        <CardHeader>
          <CardTitle>First login security step</CardTitle>
          <CardDescription>Your temporary PIN must be changed now.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="current_pin">Current PIN</Label>
              <Input
                id="current_pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="current-password"
                placeholder="Enter current 4-digit PIN"
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
                placeholder="Enter new 4-digit PIN"
                {...register("new_pin")}
                aria-invalid={Boolean(errors.new_pin)}
              />
              {errors.new_pin ? <p className="text-xs text-destructive">{errors.new_pin.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_new_pin">Confirm new PIN</Label>
              <Input
                id="confirm_new_pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="new-password"
                placeholder="Re-enter new PIN"
                {...register("confirm_new_pin")}
                aria-invalid={Boolean(errors.confirm_new_pin)}
              />
              {errors.confirm_new_pin ? (
                <p className="text-xs text-destructive">{errors.confirm_new_pin.message}</p>
              ) : null}
            </div>

            {serverError ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertTitle>PIN change failed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              <KeyRoundIcon className="size-4" />
              {isSubmitting ? "Updating PIN..." : "Update PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}

