import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteWorkout } from "@/lib/workouts/actions";
import { formatDateTime, formatWeight, repTarget } from "@/lib/format";
import { Badge, Card } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";

export const metadata = { title: "Workout detail" };

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const workout = await db.workout.findFirst({
    where: { id, userId: user.id },
    include: { sets: { orderBy: [{ blockIndex: "asc" }, { setIndex: "asc" }] } },
  });
  if (!workout) notFound();

  const groups: Array<{ name: string; sets: typeof workout.sets }> = [];
  for (const s of workout.sets) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== s.exerciseName)
      groups.push({ name: s.exerciseName, sets: [s] });
    else last.sets.push(s);
  }

  const volume = workout.sets
    .filter((s) => s.completed && !s.isWarmup)
    .reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workout.dayName}</h1>
          <p className="mt-1 text-muted">
            {formatDateTime(workout.startedAt)}
            {workout.programName ? ` · ${workout.programName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {volume > 0 && (
            <Badge variant="accent">
              {Math.round(volume).toLocaleString()} {user.unit} volume
            </Badge>
          )}
        </div>
      </div>

      {workout.notes && (
        <Card className="p-4 text-sm text-muted">{workout.notes}</Card>
      )}

      <div className="space-y-4">
        {groups.map((g, gi) => (
          <Card key={gi} className="p-4">
            <h2 className="font-semibold">{g.name}</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 font-medium">Set</th>
                  <th className="pb-2 font-medium">Target</th>
                  <th className="pb-2 font-medium">Actual</th>
                  <th className="pb-2 text-right font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {g.sets.map((s, i) => {
                  const hit =
                    s.completed && (s.reps ?? 0) >= s.targetReps;
                  const workingIndex = g.sets
                    .slice(0, i + 1)
                    .filter((x) => !x.isWarmup).length;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-2 font-mono text-xs text-muted">
                        {s.isWarmup ? "W" : workingIndex}
                      </td>
                      <td className="py-2 font-mono text-xs">
                        {repTarget(
                          s.targetReps,
                          s.targetMaxReps || s.targetReps,
                          s.isAmrap
                        )}{" "}
                        × {s.targetWeight > 0 ? formatWeight(s.targetWeight, user.unit) : "BW"}
                      </td>
                      <td className="py-2 font-mono text-xs">
                        {s.completed
                          ? `${s.reps ?? 0} × ${s.weight ? formatWeight(s.weight, user.unit) : "BW"}`
                          : "—"}
                      </td>
                      <td className="py-2 text-right">
                        {s.isWarmup ? (
                          <Badge>Warmup</Badge>
                        ) : s.completed ? (
                          <Badge variant={hit ? "success" : "danger"}>
                            {hit ? "Hit" : "Missed"}
                          </Badge>
                        ) : (
                          <Badge>Skipped</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        trigger="Delete workout"
        triggerVariant="danger"
        title="Delete this workout?"
        body="It is removed from your history for good. Progression that already ran is not rolled back."
        confirmLabel="Delete workout"
        cancelLabel="Keep it"
        action={deleteWorkout}
        fields={{ id: workout.id }}
      />
    </div>
  );
}
