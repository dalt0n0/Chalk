import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import { epley1RM } from "@/lib/engine/program";
import { formatDate, formatWeight } from "@/lib/format";
import { Card, EmptyState } from "@/components/ui";

export const metadata = { title: "History" };

type ExerciseAgg = {
  name: string;
  workoutIds: Set<string>;
  lastDate: Date;
  bestE1rm: number;
  bestWeight: number;
  totalVolume: number;
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "workouts" } = await searchParams;
  const byExercise = tab === "exercises";
  const user = await requireUserPage();
  const ent = getEntitlements(user);

  const cutoff =
    ent.historyDays !== null
      ? // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
        new Date(Date.now() - ent.historyDays * 24 * 60 * 60 * 1000)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="mt-1 text-muted">
          Every completed session, or dig into a single exercise.
        </p>
      </div>

      <div className="flex rounded-lg border border-border bg-surface p-1 w-fit">
        {[
          { id: "workouts", label: "Workouts", href: "/app/history" },
          { id: "exercises", label: "By exercise", href: "/app/history?tab=exercises" },
        ].map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              (byExercise ? "exercises" : "workouts") === t.id
                ? "bg-surface-3 font-medium text-text"
                : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {byExercise ? (
        <ExerciseList userId={user.id} unit={user.unit} cutoff={cutoff} />
      ) : (
        <WorkoutList userId={user.id} unit={user.unit} cutoff={cutoff} />
      )}
    </div>
  );
}

async function WorkoutList({
  userId,
  unit,
  cutoff,
}: {
  userId: string;
  unit: string;
  cutoff: Date | null;
}) {
  const workouts = await db.workout.findMany({
    where: {
      userId,
      completedAt: { not: null },
      ...(cutoff ? { startedAt: { gte: cutoff } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 200,
    include: {
      sets: {
        where: { completed: true, isWarmup: false },
        select: { weight: true, reps: true },
      },
    },
  });

  if (workouts.length === 0)
    return (
      <EmptyState title="No workouts yet">
        Finish your first session and it will show up here.
      </EmptyState>
    );

  return (
    <div className="space-y-3">
      {workouts.map((w) => {
        const volume = w.sets.reduce(
          (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
          0
        );
        return (
          <Link key={w.id} href={`/app/history/${w.id}`} className="block">
            <Card className="flex items-center justify-between p-4 transition-colors hover:border-border-strong">
              <div>
                <p className="font-medium">{w.dayName}</p>
                <p className="text-xs text-muted">
                  {formatDate(w.startedAt)}
                  {w.programName ? ` · ${w.programName}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{w.sets.length} sets</p>
                {volume > 0 && (
                  <p className="font-mono text-xs text-muted">
                    {Math.round(volume).toLocaleString()} {unit} volume
                  </p>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

async function ExerciseList({
  userId,
  unit,
  cutoff,
}: {
  userId: string;
  unit: string;
  cutoff: Date | null;
}) {
  const sets = await db.setLog.findMany({
    where: {
      completed: true,
      isWarmup: false,
      workout: {
        userId,
        completedAt: { not: null },
        ...(cutoff ? { startedAt: { gte: cutoff } } : {}),
      },
    },
    select: {
      exerciseName: true,
      weight: true,
      reps: true,
      workoutId: true,
      workout: { select: { startedAt: true } },
    },
    take: 20_000,
  });

  const byName = new Map<string, ExerciseAgg>();
  for (const s of sets) {
    const agg = byName.get(s.exerciseName) ?? {
      name: s.exerciseName,
      workoutIds: new Set<string>(),
      lastDate: s.workout.startedAt,
      bestE1rm: 0,
      bestWeight: 0,
      totalVolume: 0,
    };
    agg.workoutIds.add(s.workoutId);
    if (s.workout.startedAt > agg.lastDate) agg.lastDate = s.workout.startedAt;
    agg.bestE1rm = Math.max(agg.bestE1rm, epley1RM(s.weight ?? 0, s.reps ?? 0));
    agg.bestWeight = Math.max(agg.bestWeight, s.weight ?? 0);
    agg.totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
    byName.set(s.exerciseName, agg);
  }
  const exercises = [...byName.values()].sort(
    (a, b) => b.lastDate.getTime() - a.lastDate.getTime()
  );

  if (exercises.length === 0)
    return (
      <EmptyState title="No logged sets yet">
        Finish a workout and your exercises will show up here.
      </EmptyState>
    );

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Exercise</th>
            <th className="px-4 py-3 font-medium">Sessions</th>
            <th className="px-4 py-3 font-medium">Best est. 1RM</th>
            <th className="px-4 py-3 font-medium">Heaviest set</th>
            <th className="px-4 py-3 text-right font-medium">Last done</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((e) => (
            <tr key={e.name} className="border-t border-border transition-colors hover:bg-surface-2">
              <td className="px-4 py-3">
                <Link
                  href={`/app/history/exercise/${encodeURIComponent(e.name)}`}
                  className="font-medium hover:text-accent-strong"
                >
                  {e.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted">
                {e.workoutIds.size}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {e.bestE1rm > 0
                  ? formatWeight(Math.round(e.bestE1rm * 10) / 10, unit)
                  : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {e.bestWeight > 0 ? formatWeight(e.bestWeight, unit) : "BW"}
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted">
                {formatDate(e.lastDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
