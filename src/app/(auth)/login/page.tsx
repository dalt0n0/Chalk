"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { login, type AuthFormState } from "@/lib/auth/actions";
import { Button, FormError, FormSuccess, Input, Label } from "@/components/ui";

function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    login,
    {}
  );
  const params = useSearchParams();

  return (
    <>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to continue training.</p>
      <form action={action} className="mt-6 space-y-4">
        {params.get("reset") && (
          <FormSuccess>Password changed. Sign in again.</FormSuccess>
        )}
        <FormError>{state.error}</FormError>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-xs text-muted hover:text-accent"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Chalk?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
