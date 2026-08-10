"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/admin/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form
      action={action}
      className="mx-auto w-full max-w-sm space-y-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
    >
      <div>
        <h1 className="text-page-title">Sign in</h1>
        <p className="mt-1 text-body-sm">Smartlance Designs admin</p>
      </div>

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Input
        type="email"
        name="email"
        label="Email"
        required
        autoComplete="username"
      />

      <Input
        type="password"
        name="password"
        label="Password"
        required
        autoComplete="current-password"
      />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
