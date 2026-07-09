"use client";

import { useActionState, useRef, useState } from "react";
import {
  changePassword,
  type AuthFormState,
} from "@/lib/auth/actions";
import {
  deleteAccount,
  updateProfile,
  type SettingsFormState,
} from "@/lib/settings/actions";
import {
  Button,
  FormError,
  FormSuccess,
  Input,
  Label,
  Select,
} from "@/components/ui";
import { Modal } from "@/components/modal";

export function ProfileForm({
  name,
  unit,
}: {
  name: string;
  unit: string;
}) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(
    updateProfile,
    {}
  );
  return (
    <form action={action} className="space-y-4">
      <FormError>{state.error}</FormError>
      <FormSuccess>{state.message}</FormSuccess>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={name} required maxLength={100} />
      </div>
      <div>
        <Label htmlFor="unit">Weight unit</Label>
        <Select id="unit" name="unit" defaultValue={unit}>
          <option value="lb">Pounds (lb)</option>
          <option value="kg">Kilograms (kg)</option>
        </Select>
        <p className="mt-1.5 text-xs text-muted">
          Display preference. Programs keep their own units.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    changePassword,
    {}
  );
  return (
    <form action={action} className="space-y-4">
      <FormError>{state.error}</FormError>
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" required minLength={10} />
        <p className="mt-1.5 text-xs text-muted">
          Changing your password signs you out everywhere.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(
    deleteAccount,
    {}
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormError>{state.error}</FormError>
      <div>
        <Label htmlFor="confirm-password">Confirm with your password</Label>
        <Input
          id="confirm-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (formRef.current?.reportValidity()) setOpen(true);
        }}
      >
        {pending ? "Deleting…" : "Delete account"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <p className="text-sm text-muted">
          Your programs, workout history, and metrics are permanently deleted.
          There is no undo.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Keep my account
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              setOpen(false);
              formRef.current?.requestSubmit();
            }}
          >
            Delete everything
          </Button>
        </div>
      </Modal>
    </form>
  );
}
