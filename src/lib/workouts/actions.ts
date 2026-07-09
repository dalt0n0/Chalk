"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  applyProgression,
  getWorkoutPlan,
  parseProgram,
} from "@/lib/engine/program";
import type {
  ExerciseResult,
  ProgramState,
  ProgressionChange,
} from "@/lib/engine/types";

/** Start the next scheduled workout of the active program. */
export async function startWorkout(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Resume an in-progress workout instead of stacking a second one.
  const inProgress = await db.workout.findFirst({
    where: { userId: user.id, completedAt: null },
    select: { id: true },
  });
  if (inProgress) redirect(`/app/train/${inProgress.id}`);

  const program = await db.program.findFirst({
    where: { userId: user.id, isActive: true },
  });
  if (!program) redirect("/app/programs");

  const parsed = parseProgram(program.sourceYaml);
  if (!parsed.ok) redirect(`/app/programs/${program.id}`);

  let state: ProgramState = {};
  try {
    state = JSON.parse(program.state) as ProgramState;
  } catch {}

  const plan = getWorkoutPlan(parsed.program, state, program.nextDay);
  const workout = await db.workout.create({
    data: {
      userId: user.id,
      programId: program.id,
      programName: program.name,
      dayName: plan.dayName,
      dayIndex: program.nextDay,
      sets: {
        create: plan.entries.flatMap((entry, blockIndex) =>
          entry.sets.map((s, setIndex) => ({
            exerciseId: entry.exerciseId,
            exerciseName: entry.name,
            blockIndex,
            setIndex,
            targetReps: s.minReps,
            targetMaxReps: s.maxReps,
            isAmrap: s.amrap,
            isWarmup: s.isWarmup,
            targetWeight: s.weight,
            weight: s.weight,
          }))
        ),
      },
    },
  });
  redirect(`/app/train/${workout.id}`);
}

const setUpdateSchema = z.object({
  setId: z.string().min(1),
  reps: z.number().int().min(0).max(500).nullable(),
  weight: z.number().min(0).max(5000).nullable(),
  completed: z.boolean(),
});

export async function updateSetLog(input: {
  setId: string;
  reps: number | null;
  weight: number | null;
  completed: boolean;
}): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const parsed = setUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const set = await db.setLog.findFirst({
    where: {
      id: parsed.data.setId,
      workout: { userId: user.id, completedAt: null },
    },
    select: { id: true },
  });
  if (!set) return { ok: false };

  await db.setLog.update({
    where: { id: set.id },
    data: {
      reps: parsed.data.reps,
      weight: parsed.data.weight,
      completed: parsed.data.completed,
    },
  });
  return { ok: true };
}

export type FinishResult =
  | { ok: true; changes: ProgressionChange[] }
  | { ok: false; error: string };

export async function finishWorkout(input: {
  workoutId: string;
  notes: string;
}): Promise<FinishResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Session expired. Sign in again." };

  const workout = await db.workout.findFirst({
    where: { id: String(input.workoutId), userId: user.id, completedAt: null },
    include: {
      sets: { orderBy: [{ blockIndex: "asc" }, { setIndex: "asc" }] },
      program: true,
    },
  });
  if (!workout) return { ok: false, error: "Workout not found." };

  const notes = String(input.notes ?? "").slice(0, 2000);
  let changes: ProgressionChange[] = [];

  // Apply progression only when the workout is still tied to its program and
  // the schedule hasn't moved (finishing twice is impossible: completedAt gate).
  if (workout.program && workout.program.nextDay === workout.dayIndex) {
    const parsed = parseProgram(workout.program.sourceYaml);
    if (parsed.ok) {
      let state: ProgramState = {};
      try {
        state = JSON.parse(workout.program.state) as ProgramState;
      } catch {}

      const byExercise = new Map<string, ExerciseResult>();
      for (const s of workout.sets) {
        if (s.isWarmup) continue; // warmups never count toward progression
        const entry = byExercise.get(s.exerciseId) ?? {
          exerciseId: s.exerciseId,
          sets: [],
        };
        entry.sets.push({
          minReps: s.targetReps,
          maxReps: s.targetMaxReps || s.targetReps,
          reps: s.reps,
          weight: s.weight,
          completed: s.completed,
        });
        byExercise.set(s.exerciseId, entry);
      }

      const applied = applyProgression(
        parsed.program,
        state,
        workout.dayIndex,
        [...byExercise.values()]
      );
      changes = applied.changes;
      await db.program.update({
        where: { id: workout.program.id },
        data: {
          state: JSON.stringify(applied.state),
          nextDay: workout.dayIndex + 1,
        },
      });
    }
  }

  await db.workout.update({
    where: { id: workout.id },
    data: { completedAt: new Date(), notes },
  });
  // No revalidatePath here: it would refresh the player route and replace the
  // in-place progression summary. All /app pages render dynamically anyway.
  return { ok: true, changes };
}

export async function cancelWorkout(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await db.workout.deleteMany({
    where: { id, userId: user.id, completedAt: null },
  });
  revalidatePath("/app/train");
  redirect("/app/train");
}

export async function deleteWorkout(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await db.workout.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/history");
  redirect("/app/history");
}
