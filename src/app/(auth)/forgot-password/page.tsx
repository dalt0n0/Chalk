"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  type AuthFormState,
} from "@/lib/auth/actions";
import { Button, FormError, FormSuccess, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {}
  );

  return (
    <>
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        We&apos;ll send a reset link if an account exists for your email.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <FormError>{state.error}</FormError>
        <FormSuccess>{state.message}</FormSuccess>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
