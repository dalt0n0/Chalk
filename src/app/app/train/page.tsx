import { redirect } from "next/navigation";
import { Play, SkipForward } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorkoutPlan, parseProgram } from "@/lib/engine/program";
import type { ProgramState } from "@/lib/engine/types";
import { skipNextDay } from "@/lib/programs/actions";
import { startWorkout } from "@/lib/workouts/actions";
import { formatWeight, repTarget } from "@/lib/format";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormError,
} from "@/components/ui";

export const metadata = { title: "Train" };

export default async function TrainPage() {
  const user = (await getCurrentUser())!;

  const inProgress = await db.workout.findFirst({
    where: { userId: user.id, completedAt: null },
    select: { id: true },
  });
  if (inProgress) redirect(`/app/train/${inProgress.id}`);

  const program = await db.program.findFirst({
    where: { userId: user.id, isActive: true },
  });

  if (!program) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Train</h1>
        <EmptyState
          title="No active program"
          action={
            <div className="flex gap-3">
              <ButtonLink href="/community" size="sm">
                Import a program
              </ButtonLink>
              <ButtonLink href="/app/programs" variant="secondary" size="sm">
                My programs
              </ButtonLink>
            </div>
          }
        >
          Activate a program to get a scheduled workout here.
        </EmptyState>
      </div>
    );
  }

  const parsed = parseProgram(program.sourceYaml);
  if (!parsed.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Train</h1>
        <FormError>
          Your active program has errors. Fix it in the editor before training.
        </FormError>
        <ButtonLink href={`/app/programs/${program.id}/edit`} variant="secondary">
          Open editor
        </ButtonLink>
      </div>
    );
  }

  let state: ProgramState = {};
  try {
    state = JSON.parse(program.state) as ProgramState;
  } catch {}

  let plan;
  let planError: string | null = null;
  try {
    plan = getWorkoutPlan(parsed.program, state, program.nextDay);
  } catch (e) {
    planError = e instanceof Error ? e.message : "Could not compute the workout";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Train</h1>
          <p className="mt-1 text-muted">
            {program.name}
            {parsed.program.weeks > 1 && plan
              ? ` · Week ${plan.week} of ${parsed.program.weeks}`
              : ""}
          </p>
        </div>
        <Badge variant="accent">{program.name}</Badge>
      </div>

      {planError ? (
        <FormError>{planError}</FormError>
      ) : plan ? (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{plan.dayName}</h2>
            <span className="text-sm text-muted">
              {plan.entries.reduce(
                (n, e) => n + e.sets.filter((s) => !s.isWarmup).length,
                0
              )}{" "}
              working sets
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {plan.entries.map((entry) => {
              const warmups = entry.sets.filter((s) => s.isWarmup);
              const working = entry.sets.filter((s) => !s.isWarmup);
              return (
                <div key={entry.exerciseId} className="rounded-lg bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{entry.name}</p>
                    {entry.notes && (
                      <p className="text-xs text-muted">{entry.notes}</p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {working.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs"
                      >
                        {repTarget(s.minReps, s.maxReps, s.amrap)} ×{" "}
                        {s.weight > 0
                          ? formatWeight(s.weight, parsed.program.units)
                          : "BW"}
                      </span>
                    ))}
                  </div>
                  {warmups.length > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      Warmup:{" "}
                      {warmups
                        .map((s) => `${s.minReps}×${s.weight}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex gap-3">
            <form action={startWorkout} className="flex-1">
              <Button type="submit" size="lg" className="w-full">
                <Play className="h-5 w-5" /> Start workout
              </Button>
            </form>
            <form action={skipNextDay}>
              <input type="hidden" name="id" value={program.id} />
              <Button type="submit" variant="secondary" size="lg">
                <SkipForward className="h-4 w-4" /> Skip
              </Button>
            </form>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
