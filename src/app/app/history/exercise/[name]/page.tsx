import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import { epley1RM } from "@/lib/engine/program";
import { formatDate, formatWeight } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui";
import { StrengthChart, VolumeChart, type ExercisePoint } from "./charts";

export const metadata = { title: "Exercise history" };

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  const user = await requireUserPage();
  const ent = getEntitlements(user);

  const cutoff =
    ent.historyDays !== null
      ? // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
        new Date(Date.now() - ent.historyDays * 24 * 60 * 60 * 1000)
      : null;

  const sets = await db.setLog.findMany({
    where: {
      exerciseName: name,
      completed: true,
      isWarmup: false,
      workout: {
        userId: user.id,
        completedAt: { not: null },
        ...(cutoff ? { startedAt: { gte: cutoff } } : {}),
      },
    },
    select: {
      weight: true,
      reps: true,
      workoutId: true,
      workout: { select: { startedAt: true, dayName: true } },
    },
    orderBy: { workout: { startedAt: "asc" } },
    take: 20_000,
  });
  if (sets.length === 0) notFound();

  // Aggregate per workout, chronological.
  type Session = {
    workoutId: string;
    date: Date;
    dayName: string;
    e1rm: number;
    topWeight: number;
    volume: number;
    sets: Array<{ reps: number; weight: number }>;
  };
  const sessions: Session[] = [];
  for (const s of sets) {
    let cur = sessions[sessions.length - 1];
    if (!cur || cur.workoutId !== s.workoutId) {
      cur = {
        workoutId: s.workoutId,
        date: s.workout.startedAt,
        dayName: s.workout.dayName,
        e1rm: 0,
        topWeight: 0,
        volume: 0,
        sets: [],
      };
      sessions.push(cur);
    }
    const w = s.weight ?? 0;
    const r = s.reps ?? 0;
    cur.e1rm = Math.max(cur.e1rm, Math.round(epley1RM(w, r) * 10) / 10);
    cur.topWeight = Math.max(cur.topWeight, w);
    cur.volume += w * r;
    cur.sets.push({ reps: r, weight: w });
  }

  const points: ExercisePoint[] = sessions.map((s) => ({
    date: s.date.toLocaleDateString("sv-SE"),
    e1rm: s.e1rm,
    topWeight: s.topWeight,
    volume: Math.round(s.volume),
  }));

  const bestE1rm = Math.max(...sessions.map((s) => s.e1rm));
  const bestWeight = Math.max(...sessions.map((s) => s.topWeight));
  const totalVolume = sessions.reduce((sum, s) => sum + s.volume, 0);
  const totalSets = sets.length;
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const e1rmChange = last.e1rm - first.e1rm;
  const isWeighted = bestWeight > 0;

  const stats = [
    {
      label: "Best est. 1RM",
      value: isWeighted ? formatWeight(bestE1rm, user.unit) : "—",
    },
    {
      label: "Heaviest set",
      value: isWeighted ? formatWeight(bestWeight, user.unit) : "Bodyweight",
    },
    { label: "Sessions", value: String(sessions.length) },
    { label: "Working sets", value: String(totalSets) },
    {
      label: "Total volume",
      value: isWeighted
        ? `${Math.round(totalVolume).toLocaleString()} ${user.unit}`
        : "—",
    },
    {
      label: "Est. 1RM change",
      value:
        isWeighted && sessions.length > 1
          ? `${e1rmChange >= 0 ? "+" : ""}${Math.round(e1rmChange * 10) / 10} ${user.unit}`
          : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/history?tab=exercises"
          className="text-sm text-muted hover:text-text"
        >
          ← All exercises
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{name}</h1>
        <p className="mt-1 text-muted">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}, first{" "}
          {formatDate(first.date)}, last {formatDate(last.date)}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {isWeighted && (
        <>
          <Card>
            <CardTitle>Strength over time</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Best estimated 1RM (Epley) and heaviest set per session.
            </p>
            <div className="mt-4">
              <StrengthChart data={points} unit={user.unit} />
            </div>
          </Card>

          <Card>
            <CardTitle>Volume per session</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Total weight moved (sets × reps × weight), warmups excluded.
            </p>
            <div className="mt-4">
              <VolumeChart data={points} unit={user.unit} />
            </div>
          </Card>
        </>
      )}

      <Card>
        <CardTitle>Sessions</CardTitle>
        <div className="overflow-x-auto">
        <table className="mt-4 w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Workout</th>
              <th className="pb-2 font-medium">Sets</th>
              <th className="pb-2 font-medium">Top set</th>
              <th className="pb-2 text-right font-medium">Est. 1RM</th>
            </tr>
          </thead>
          <tbody>
            {[...sessions].reverse().slice(0, 50).map((s) => {
              const top = s.sets.reduce(
                (best, x) => (x.weight > best.weight ? x : best),
                s.sets[0]
              );
              return (
                <tr key={s.workoutId} className="border-t border-border">
                  <td className="py-2 text-xs">{formatDate(s.date)}</td>
                  <td className="py-2 text-xs">
                    <Link
                      href={`/app/history/${s.workoutId}`}
                      className="text-muted hover:text-accent-strong"
                    >
                      {s.dayName}
                    </Link>
                  </td>
                  <td className="py-2 font-mono text-xs text-muted">
                    {s.sets
                      .map((x) => `${x.reps}×${x.weight || "BW"}`)
                      .join(", ")}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {top.weight > 0
                      ? `${top.reps} × ${formatWeight(top.weight, user.unit)}`
                      : `${top.reps} reps`}
                  </td>
                  <td className="py-2 text-right font-mono text-xs">
                    {s.e1rm > 0 ? formatWeight(s.e1rm, user.unit) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}
