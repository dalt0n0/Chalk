import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { WorkoutPlayer, type PlayerEntry } from "./player";

export const metadata = { title: "Workout" };

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();
  const workout = await db.workout.findFirst({
    where: { id, userId: user.id },
    include: { sets: { orderBy: [{ blockIndex: "asc" }, { setIndex: "asc" }] } },
  });
  if (!workout) notFound();
  if (workout.completedAt) redirect(`/app/history/${workout.id}`);

  const entries: PlayerEntry[] = [];
  for (const s of workout.sets) {
    let entry = entries[entries.length - 1];
    if (!entry || entry.exerciseId !== s.exerciseId) {
      entry = { exerciseId: s.exerciseId, name: s.exerciseName, sets: [] };
      entries.push(entry);
    }
    entry.sets.push({
      id: s.id,
      targetReps: s.targetReps,
      targetMaxReps: s.targetMaxReps || s.targetReps,
      isAmrap: s.isAmrap,
      isWarmup: s.isWarmup,
      targetWeight: s.targetWeight,
      reps: s.reps,
      weight: s.weight,
      completed: s.completed,
    });
  }

  return (
    <WorkoutPlayer
      workoutId={workout.id}
      dayName={workout.dayName}
      programName={workout.programName}
      startedAt={workout.startedAt.toISOString()}
      unit={user.unit}
      initialEntries={entries}
    />
  );
}
