"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthFormState } from "@/lib/auth/actions";
import { Button, FormError, Input, Label } from "@/components/ui";

export function RegisterForm({ firstUser }: { firstUser: boolean }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    register,
    {}
  );

  return (
    <>
      <h1 className="text-xl font-semibold">
        {firstUser ? "Create the first account" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {firstUser
          ? "This instance is brand new. The first account becomes the administrator."
          : "Start with a proven program or build your own."}
      </p>
      <form action={action} className="mt-6 space-y-4">
        <FormError>{state.error}</FormError>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required maxLength={100} />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
          <p className="mt-1.5 text-xs text-muted">At least 10 characters.</p>
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
