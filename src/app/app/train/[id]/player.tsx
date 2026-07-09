"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Disc3, Flag, Minus, Plus, Timer } from "lucide-react";
import { finishWorkout, updateSetLog, cancelWorkout } from "@/lib/workouts/actions";
import type { ProgressionChange } from "@/lib/engine/types";
import { repTarget } from "@/lib/format";
import { Button, ButtonLink, Card, Textarea } from "@/components/ui";
import { ConfirmDialog, Modal } from "@/components/modal";
import { PlateBreakdown } from "@/components/plate-calc";

export type PlayerSet = {
  id: string;
  targetReps: number;
  targetMaxReps: number;
  isAmrap: boolean;
  isWarmup: boolean;
  targetWeight: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
};

export type PlayerEntry = {
  exerciseId: string;
  name: string;
  sets: PlayerSet[];
};

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function fmtDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkoutPlayer({
  workoutId,
  dayName,
  programName,
  startedAt,
  unit,
  initialEntries,
}: {
  workoutId: string;
  dayName: string;
  programName: string;
  startedAt: string;
  unit: string;
  initialEntries: PlayerEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [notes, setNotes] = useState("");
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);
  const [result, setResult] = useState<ProgressionChange[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platesFor, setPlatesFor] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishing, startFinishing] = useTransition();
  const now = useNow(1000);
  const saveQueue = useRef(Promise.resolve());

  const allSets = useMemo(() => entries.flatMap((e) => e.sets), [entries]);
  const doneCount = allSets.filter((s) => s.completed).length;
  const plateUnit: "lb" | "kg" = unit === "kg" ? "kg" : "lb";

  function patchSet(setId: string, patch: Partial<PlayerSet>) {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      }))
    );
  }

  function persist(set: PlayerSet, patch: Partial<PlayerSet>) {
    const next = { ...set, ...patch };
    patchSet(set.id, patch);
    // Serialize writes so rapid taps don't race each other.
    saveQueue.current = saveQueue.current.then(() =>
      updateSetLog({
        setId: set.id,
        reps: next.reps,
        weight: next.weight,
        completed: next.completed,
      }).then(
        (r) => {
          if (!r.ok) setError("A set failed to save. Check your connection.");
        },
        () => setError("A set failed to save. Check your connection.")
      )
    );
  }

  function toggleComplete(set: PlayerSet) {
    if (set.completed) {
      persist(set, { completed: false });
    } else {
      persist(set, {
        completed: true,
        reps: set.reps ?? set.targetReps,
        weight: set.weight ?? set.targetWeight,
      });
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      setLastCompletedAt(Date.now());
    }
  }

  const unloggedWorking = allSets.filter(
    (s) => !s.isWarmup && !s.completed
  ).length;

  function doFinish() {
    startFinishing(async () => {
      const res = await finishWorkout({ workoutId, notes });
      if (res.ok) setResult(res.changes);
      else setError(res.error);
    });
  }

  function finish() {
    if (unloggedWorking > 0) setConfirmFinish(true);
    else doFinish();
  }

  if (result) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-soft">
          <Check className="h-6 w-6 text-success" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Workout complete</h2>
        <p className="mt-1 text-sm text-muted">
          {dayName} · {doneCount} sets logged
        </p>
        {result.length > 0 && (
          <div className="mt-5 space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Progression
            </p>
            {result.map((c) => (
              <div
                key={c.exerciseId}
                className="rounded-lg bg-surface-2 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span
                    className={`text-xs ${c.success ? "text-success" : "text-danger"}`}
                  >
                    {c.success ? "Passed" : "Missed"}
                  </span>
                </div>
                {c.changes.length > 0 ? (
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {c.changes
                      .map((ch) => `${ch.variable}: ${ch.from} → ${ch.to}`)
                      .join(" · ")}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted">No change</p>
                )}
                {c.error && (
                  <p className="mt-0.5 text-xs text-danger">{c.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/app">Back to dashboard</ButtonLink>
          <ButtonLink href="/app/history" variant="secondary">
            View history
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">{dayName}</h1>
            <p className="text-xs text-muted">{programName}</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="flex items-center gap-1.5 text-muted">
              <Timer className="h-4 w-4" />
              {fmtDuration(now - new Date(startedAt).getTime())}
            </span>
            {lastCompletedAt && (
              <span className="flex items-center gap-1.5 text-accent-strong">
                Rest {fmtDuration(now - lastCompletedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${allSets.length ? (doneCount / allSets.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}{" "}
          <button className="underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {entries.map((entry) => (
        <Card key={entry.exerciseId} className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{entry.name}</h2>
            {entry.sets.some((s) => !s.isWarmup && s.targetWeight > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPlatesFor(entry.exerciseId)}
              >
                <Disc3 className="h-4 w-4" /> Plates
              </Button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {entry.sets.map((set, i) => {
              const workingIndex =
                entry.sets.slice(0, i + 1).filter((s) => !s.isWarmup).length;
              return (
                <div
                  key={set.id}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors sm:gap-3 sm:px-3 ${
                    set.completed
                      ? "border-success/30 bg-success-soft"
                      : set.isWarmup
                        ? "border-border/60 bg-surface"
                        : "border-border bg-surface-2"
                  }`}
                >
                  <span
                    className={`w-8 shrink-0 text-center font-mono text-xs ${set.isWarmup ? "text-muted/70" : "text-muted"}`}
                  >
                    {set.isWarmup ? "W" : workingIndex}
                  </span>
                  <span
                    className={`w-24 shrink-0 font-mono text-xs ${set.isWarmup ? "text-muted/70" : "text-muted"}`}
                  >
                    {repTarget(set.targetReps, set.targetMaxReps, set.isAmrap)} ×{" "}
                    {set.targetWeight > 0 ? set.targetWeight : "BW"}
                    {set.isWarmup && (
                      <span className="ml-1.5 rounded bg-surface-3 px-1 py-0.5 text-[10px] uppercase tracking-wide">
                        warmup
                      </span>
                    )}
                  </span>

                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="One rep less"
                        className="grid h-7 w-7 place-items-center rounded-md bg-surface-3 text-muted hover:text-text"
                        onClick={() =>
                          persist(set, {
                            reps: Math.max(0, (set.reps ?? set.targetReps) - 1),
                          })
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        inputMode="numeric"
                        value={set.reps ?? ""}
                        placeholder={String(set.targetReps)}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          persist(set, { reps: v === "" ? null : Number(v) });
                        }}
                        className="h-8 w-12 rounded-md border border-border bg-surface px-1 text-center font-mono text-sm outline-none focus:border-accent/70"
                        aria-label="Reps"
                      />
                      <button
                        type="button"
                        aria-label="One rep more"
                        className="grid h-7 w-7 place-items-center rounded-md bg-surface-3 text-muted hover:text-text"
                        onClick={() =>
                          persist(set, { reps: (set.reps ?? set.targetReps) + 1 })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        inputMode="decimal"
                        value={set.weight ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9.]/g, "");
                          persist(set, { weight: v === "" ? null : Number(v) });
                        }}
                        className="h-8 w-16 rounded-md border border-border bg-surface px-1 text-center font-mono text-sm outline-none focus:border-accent/70"
                        aria-label="Weight"
                      />
                      <span className="text-xs text-muted">{unit}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={set.completed ? "Mark incomplete" : "Mark complete"}
                      onClick={() => toggleComplete(set)}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border transition-colors ${
                        set.completed
                          ? "border-success bg-success text-black"
                          : "border-border-strong text-muted hover:border-success hover:text-success"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {entry.sets.some((s) => s.isAmrap) && (
            <p className="mt-2 text-xs text-muted">
              Sets marked with + are AMRAP: log every rep you get. Extra reps
              can drive your progression.
            </p>
          )}
        </Card>
      ))}

      <Card className="p-4">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Session notes (optional)"
        />
        <div className="mt-4 flex gap-3">
          <Button
            size="lg"
            className="flex-1"
            onClick={finish}
            disabled={finishing}
          >
            <Flag className="h-4 w-4" />
            {finishing ? "Finishing…" : "Finish workout"}
          </Button>
          <ConfirmDialog
            trigger="Cancel"
            triggerVariant="secondary"
            triggerSize="lg"
            title="Cancel this workout?"
            body="Logged sets from this session are deleted and your program schedule stays where it is."
            confirmLabel="Cancel workout"
            cancelLabel="Keep going"
            action={cancelWorkout}
            fields={{ id: workoutId }}
          />
        </div>
      </Card>

      <Modal
        open={platesFor !== null}
        onClose={() => setPlatesFor(null)}
        title="Plate math"
      >
        {platesFor && (
          <PlateBreakdown
            unit={plateUnit}
            weights={
              entries
                .find((e) => e.exerciseId === platesFor)
                ?.sets.map((s) => s.weight ?? s.targetWeight)
                .filter((w): w is number => w !== null && w > 0) ?? []
            }
          />
        )}
      </Modal>

      <Modal
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish with unlogged sets?"
      >
        <p className="text-sm text-muted">
          {unloggedWorking} working {unloggedWorking === 1 ? "set is" : "sets are"}{" "}
          not logged. Unlogged sets count as missed when progression runs.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmFinish(false)}
          >
            Keep lifting
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setConfirmFinish(false);
              doFinish();
            }}
          >
            Finish anyway
          </Button>
        </div>
      </Modal>
    </div>
  );
}
