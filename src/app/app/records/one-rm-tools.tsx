"use client";

import { useActionState, useState } from "react";
import { Calculator, Pencil, Plus } from "lucide-react";
import {
  deleteUserMax,
  saveUserMax,
  type MaxFormState,
} from "@/lib/maxes/actions";
import { epley1RM } from "@/lib/engine/program";
import {
  Button,
  FormError,
  FormSuccess,
  Input,
  Label,
} from "@/components/ui";
import { ConfirmDialog, Modal } from "@/components/modal";

/** Add a manual 1RM entry. */
export function AddMaxForm({ unit }: { unit: string }) {
  const [state, action, pending] = useActionState<MaxFormState, FormData>(
    saveUserMax,
    {}
  );
  return (
    <form action={action} className="space-y-3">
      <FormError>{state.error}</FormError>
      <FormSuccess>{state.message}</FormSuccess>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="max-name">Exercise</Label>
          <Input
            id="max-name"
            name="name"
            placeholder="Barbell Squat"
            maxLength={80}
            required
          />
        </div>
        <div className="w-28">
          <Label htmlFor="max-value">1RM ({unit})</Label>
          <Input
            id="max-value"
            name="value"
            inputMode="decimal"
            placeholder="315"
            className="font-mono"
            required
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        <Plus className="h-3.5 w-3.5" />
        {pending ? "Saving…" : "Add 1RM"}
      </Button>
    </form>
  );
}

/** Edit an existing manual entry in a modal. */
export function EditMaxButton({
  name,
  value,
  unit,
}: {
  name: string;
  value: number;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<MaxFormState, FormData>(
    saveUserMax,
    {}
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${name} 1RM`}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-text"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${name}`}>
        <form action={action} className="space-y-4">
          <FormError>{state.error}</FormError>
          <FormSuccess>{state.message}</FormSuccess>
          <input type="hidden" name="name" value={name} />
          <div>
            <Label htmlFor={`edit-${name}`}>1RM ({unit})</Label>
            <Input
              id={`edit-${name}`}
              name="value"
              inputMode="decimal"
              defaultValue={value}
              className="font-mono"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteMaxButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDialog
      trigger="Delete"
      triggerVariant="ghost"
      triggerSize="sm"
      triggerClassName="text-xs text-muted hover:text-danger px-1.5 py-0.5"
      title={`Delete ${name} 1RM?`}
      body="The entry is removed from your list. Programs and history are not affected."
      confirmLabel="Delete"
      cancelLabel="Keep it"
      action={deleteUserMax}
      fields={{ id }}
    />
  );
}

const PERCENTS = [95, 90, 85, 80, 75, 70, 65, 60];

/** Weight x reps → estimated 1RM, with a save-to-list shortcut. */
export function OneRmCalculator({ unit }: { unit: string }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saveState, saveAction, saving] = useActionState<MaxFormState, FormData>(
    saveUserMax,
    {}
  );

  const w = Number(weight);
  const r = Math.floor(Number(reps));
  const valid = Number.isFinite(w) && w > 0 && Number.isFinite(r) && r >= 1 && r <= 20;
  const e1rm = valid ? Math.round(epley1RM(w, r) * 10) / 10 : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="calc-weight">Weight ({unit})</Label>
          <Input
            id="calc-weight"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="225"
            className="font-mono"
          />
        </div>
        <div className="w-24">
          <Label htmlFor="calc-reps">Reps</Label>
          <Input
            id="calc-reps"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value.replace(/\D/g, ""))}
            placeholder="5"
            className="font-mono"
          />
        </div>
      </div>

      {e1rm !== null && (
        <>
          <div className="rounded-lg bg-surface-2 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted">
              Estimated 1RM (Epley)
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">
              {e1rm} {unit}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {PERCENTS.map((p) => (
              <div
                key={p}
                className="rounded-md bg-surface-2 px-2 py-1.5 text-center"
              >
                <p className="text-[10px] text-muted">{p}%</p>
                <p className="font-mono text-xs font-medium">
                  {Math.round(((e1rm * p) / 100) * 10) / 10}
                </p>
              </div>
            ))}
          </div>

          <form action={saveAction} className="space-y-2">
            <FormError>{saveState.error}</FormError>
            <FormSuccess>{saveState.message}</FormSuccess>
            <input type="hidden" name="value" value={e1rm} />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="calc-save-name">Save as</Label>
                <Input
                  id="calc-save-name"
                  name="name"
                  placeholder="Exercise name"
                  maxLength={80}
                  required
                />
              </div>
              <Button type="submit" size="md" variant="secondary" disabled={saving}>
                <Calculator className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save 1RM"}
              </Button>
            </div>
          </form>
        </>
      )}
      {e1rm === null && (
        <p className="text-sm text-muted">
          Enter the weight and reps of a hard set (up to 20 reps) to estimate
          your single.
        </p>
      )}
    </div>
  );
}
