import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AlertCircleIcon, ArrowLeftIcon, LogInIcon } from "lucide-react";

import { ROLE_DEFAULT_ROUTE } from "@/lib/role-routes";
import type { Role } from "@/lib/constants";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthPageShell } from "@/components/molecules/AuthPageShell";

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number"),
  pin: z
    .string()
    .trim()
    .min(1, "PIN/password is required")
    .max(64, "PIN/password is too long"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, role, isFirstLogin, setAuth } = useAppStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      phone: "",
      pin: "",
    },
  });

  if (isAuthenticated && role) {
    if (isFirstLogin && role !== "admin") {
      return <Navigate to="/change-pin" replace />;
    }
    return <Navigate to={ROLE_DEFAULT_ROUTE[role]} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.phone?.[0]) {
        setError("phone", { message: fieldErrors.phone[0] });
      }
      if (fieldErrors.pin?.[0]) {
        setError("pin", { message: fieldErrors.pin[0] });
      }
      return;
    }

    try {
      const response = await api.post("/api/auth/login", {
        phone: parsed.data.phone,
        pin: parsed.data.pin,
      });
      const payload = response.data as {
        user_id?: string;
        role?: Role;
        user_name?: string;
        executive_name?: string;
        entity_name?: string;
        entity_id?: string;
        cell_id?: string;
        is_first_login?: boolean;
      };

      if (!payload.role || !(payload.role in ROLE_DEFAULT_ROUTE)) {
        throw new Error("Login response did not include a valid role.");
      }

      const resolvedEntityName = payload.entity_name ?? parsed.data.phone;
      const resolvedUserName =
        payload.user_name ?? payload.executive_name ?? resolvedEntityName;
      const resolvedEntityId = payload.entity_id ?? payload.cell_id ?? "";
      const resolvedUserId = payload.user_id ?? "";
      const resolvedFirstLogin = Boolean(payload.is_first_login);

      setAuth({
        isAuthenticated: true,
        role: payload.role,
        userId: resolvedUserId,
        userName: resolvedUserName,
        entityName: resolvedEntityName,
        entityId: resolvedEntityId,
        isFirstLogin: resolvedFirstLogin,
      });

      if (resolvedFirstLogin && payload.role !== "admin") {
        navigate("/change-pin", { replace: true });
        return;
      }
      navigate(ROLE_DEFAULT_ROUTE[payload.role], { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to sign in. Please check your credentials and try again."));
    }
  };

  return (
    <AuthPageShell title="Sign in" subtitle="Official and coordinator access.">
      <Card>
        <CardHeader className="mb-4">
            <CardTitle className="text-2xl">Credentials</CardTitle>
            <CardDescription>Use your assigned credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +250788000001"
                {...register("phone")}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN / password</Label>
              <Input
                id="pin"
                type="password"
                autoComplete="current-password"
                inputMode="numeric"
                maxLength={64}
                placeholder="Enter PIN or password"
                {...register("pin")}
                aria-invalid={Boolean(errors.pin)}
              />
              {errors.pin ? <p className="text-xs text-destructive">{errors.pin.message}</p> : null}
            </div>

            {serverError ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertTitle>Login failed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogInIcon className="size-4" />
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Demo — Cell executive: <span className="font-mono">+250788000001</span> / PIN{" "}
              <span className="font-mono">1234</span>
            </p>

            <Button asChild variant="ghost" className="h-10 w-full">
              <Link to="/">
                <ArrowLeftIcon className="size-4" aria-hidden />
                Back to home
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}

