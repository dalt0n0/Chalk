import Link from "next/link";
import { ArrowRight, Dumbbell, Flame, Scale, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseProgram, getWorkoutPlan } from "@/lib/engine/program";
import type { ProgramState } from "@/lib/engine/types";
import { formatDate, formatWeight, repTarget, timeAgo } from "@/lib/format";
import { Badge, ButtonLink, Card, CardTitle, EmptyState } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday

  const [activeProgram, recentWorkouts, workoutsThisWeek, totalWorkouts, latestMetric] =
    await Promise.all([
      db.program.findFirst({ where: { userId: user.id, isActive: true } }),
      db.workout.findMany({
        where: { userId: user.id, completedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          sets: {
            where: { completed: true, isWarmup: false },
            select: { weight: true, reps: true },
          },
        },
      }),
      db.workout.count({
        where: { userId: user.id, completedAt: { not: null }, startedAt: { gte: weekStart } },
      }),
      db.workout.count({ where: { userId: user.id, completedAt: { not: null } } }),
      db.bodyMetric.findFirst({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      }),
    ]);

  // Resolve the next planned workout from the active program
  let nextWorkout: {
    dayName: string;
    week: number;
    weeks: number;
    entries: Array<{ name: string; summary: string }>;
  } | null = null;
  if (activeProgram) {
    const parsed = parseProgram(activeProgram.sourceYaml);
    if (parsed.ok) {
      try {
        const state = JSON.parse(activeProgram.state) as ProgramState;
        const plan = getWorkoutPlan(parsed.program, state, activeProgram.nextDay);
        nextWorkout = {
          dayName: plan.dayName,
          week: plan.week,
          weeks: parsed.program.weeks,
          entries: plan.entries.map((e) => ({
            name: e.name,
            summary: e.sets
              .filter((s) => !s.isWarmup)
              .map(
                (s) =>
                  `${repTarget(s.minReps, s.maxReps, s.amrap)}×${s.weight || "BW"}`
              )
              .join(", "),
          })),
        };
      } catch {
        // corrupt state; the train page surfaces the real error
      }
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    { icon: Flame, label: "This week", value: `${workoutsThisWeek} workout${workoutsThisWeek === 1 ? "" : "s"}` },
    { icon: Trophy, label: "All time", value: `${totalWorkouts} workout${totalWorkouts === 1 ? "" : "s"}` },
    {
      icon: Scale,
      label: "Body weight",
      value: latestMetric?.weight ? formatWeight(latestMetric.weight, user.unit) : "—",
    },
    {
      icon: Dumbbell,
      label: "Last session",
      value: recentWorkouts[0] ? timeAgo(recentWorkouts[0].startedAt) : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted">
          {nextWorkout
            ? "Your next session is loaded and ready."
            : "Set up a program to get training."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft">
              <s.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="truncate text-sm font-semibold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <CardTitle>Next workout</CardTitle>
            {activeProgram && (
              <Badge variant="accent">{activeProgram.name}</Badge>
            )}
          </div>
          {nextWorkout ? (
            <>
              <div className="mt-4 flex items-baseline gap-3">
                <h3 className="text-xl font-bold">{nextWorkout.dayName}</h3>
                {nextWorkout.weeks > 1 && (
                  <span className="text-sm text-muted">
                    Week {nextWorkout.week} of {nextWorkout.weeks}
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {nextWorkout.entries.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{e.name}</span>
                    <span className="font-mono text-xs text-muted">{e.summary}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/app/train" className="mt-5 w-full">
                Start workout <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No active program"
                action={
                  <div className="flex gap-3">
                    <ButtonLink href="/community" size="sm">
                      Import a program
                    </ButtonLink>
                    <ButtonLink href="/app/programs/new" variant="secondary" size="sm">
                      Build your own
                    </ButtonLink>
                  </div>
                }
              >
                Pick a community template or build one from scratch.
              </EmptyState>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Link href="/app/history" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {recentWorkouts.length ? (
            <ul className="mt-4 space-y-3">
              {recentWorkouts.map((w) => {
                const volume = w.sets.reduce(
                  (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
                  0
                );
                return (
                  <li key={w.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{w.dayName}</p>
                      <p className="text-xs text-muted">
                        {formatDate(w.startedAt)}
                        {w.programName ? ` · ${w.programName}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {volume > 0
                        ? `${Math.round(volume).toLocaleString()} ${user.unit}`
                        : `${w.sets.length} sets`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Finished workouts will show up here.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
