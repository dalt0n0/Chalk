"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import { resetPassword, type AuthFormState } from "@/lib/auth/actions";
import { Button, FormError, FormSuccess, Input, Label } from "@/components/ui";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    resetPassword,
    {}
  );

  return (
    <>
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <form action={action} className="mt-6 space-y-4">
        <FormError>{state.error}</FormError>
        <FormSuccess>
          {state.message && (
            <>
              {state.message}{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </>
          )}
        </FormSuccess>
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </>
  );
}
