"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import {
  updateExerciseState,
  type ProgramFormState,
} from "@/lib/programs/actions";
import { Button, FormError, Input, Label } from "@/components/ui";
import { Modal } from "@/components/modal";

const VAR_LABELS: Record<string, string> = {
  weight: "Working weight",
  tm: "Training max",
  rm1: "1RM",
  failures: "Failure count",
};

/**
 * Edit an exercise's state variables (1RM, training max, working weight)
 * without touching the program definition.
 */
export function StateEditor({
  programId,
  exerciseId,
  exerciseName,
  values,
  unit,
  returnTo,
  triggerLabel,
}: {
  programId: string;
  exerciseId: string;
  exerciseName: string;
  values: Record<string, number>;
  unit: string;
  returnTo: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ProgramFormState, FormData>(
    updateExerciseState,
    {}
  );

  const entries = Object.entries(values);
  if (entries.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-text"
        aria-label={`Edit ${exerciseName} values`}
      >
        <Pencil className="h-3 w-3" />
        {triggerLabel ?? "Edit"}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Edit ${exerciseName}`}
      >
        <form action={action} className="space-y-4">
          <FormError>{state.error}</FormError>
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          {entries.map(([key, value]) => (
            <div key={key}>
              <Label htmlFor={`state-${exerciseId}-${key}`}>
                {VAR_LABELS[key] ?? key}
                {key !== "failures" && (
                  <span className="ml-1 text-xs text-muted">({unit})</span>
                )}
              </Label>
              <Input
                id={`state-${exerciseId}-${key}`}
                name={`state.${key}`}
                inputMode="decimal"
                defaultValue={value}
                className="font-mono"
              />
            </div>
          ))}
          <p className="text-xs text-muted">
            Takes effect from your next workout. The program definition is not
            changed.
          </p>
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
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
