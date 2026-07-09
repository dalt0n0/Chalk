"use client";

import { useActionState, useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import {
  adminCreateUser,
  adminResetPassword,
  type AdminFormState,
} from "@/lib/admin/actions";
import { Button, FormError, FormSuccess, Input, Label } from "@/components/ui";
import { Modal } from "@/components/modal";

function TempPassword({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft p-3">
      <p className="text-xs text-muted">
        Temporary password, shown once. Share it securely; the user should
        change it in Settings after signing in.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded bg-bg px-2 py-1.5 font-mono text-sm">
          {value}
        </code>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(
              () => setCopied(true),
              () => {}
            );
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    adminCreateUser,
    {}
  );
  return (
    <form action={action} className="space-y-3">
      <FormError>{state.error}</FormError>
      <FormSuccess>{state.message}</FormSuccess>
      {state.tempPassword && <TempPassword value={state.tempPassword} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-user-name">Name</Label>
          <Input id="new-user-name" name="name" required maxLength={100} />
        </div>
        <div>
          <Label htmlFor="new-user-email">Email</Label>
          <Input id="new-user-email" name="email" type="email" required />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        <UserPlus className="h-3.5 w-3.5" />
        {pending ? "Creating…" : "Create account"}
      </Button>
      <p className="text-xs text-muted">
        A temporary password is generated and shown to you once.
      </p>
    </form>
  );
}

export function ResetPasswordButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    adminResetPassword,
    {}
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-text"
      >
        <KeyRound className="h-3 w-3" /> Reset password
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Reset password for ${email}?`}
      >
        {state.tempPassword ? (
          <div className="space-y-3">
            <FormSuccess>{state.message}</FormSuccess>
            <TempPassword value={state.tempPassword} />
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <FormError>{state.error}</FormError>
            <p className="text-sm text-muted">
              A new temporary password is generated and every session for this
              user is signed out.
            </p>
            <input type="hidden" name="userId" value={userId} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Resetting…" : "Reset password"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
