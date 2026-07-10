import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import { epley1RM, parseProgram } from "@/lib/engine/program";
import type { ProgramState } from "@/lib/engine/types";
import { formatDate, formatWeight } from "@/lib/format";
import { Badge, Card, CardTitle, EmptyState } from "@/components/ui";
import { StateEditor } from "@/components/state-editor";
import {
  AddMaxForm,
  DeleteMaxButton,
  EditMaxButton,
  OneRmCalculator,
} from "./one-rm-tools";

export const metadata = { title: "1RMs" };

type ProgramMax = {
  programId: string;
  programName: string;
  isActive: boolean;
  exerciseId: string;
  exerciseName: string;
  values: Record<string, number>;
};

type EstimatedRecord = {
  exerciseName: string;
  e1rm: number;
  weight: number;
  reps: number;
  date: Date;
};

export default async function RecordsPage() {
  const user = await requireUserPage();
  const ent = getEntitlements(user);

  const userMaxes = await db.userMax.findMany({
    where: { userId: user.id },
    orderBy: { value: "desc" },
  });

  // Program 1RMs: every exercise that tracks an rm1 state variable.
  const programs = await db.program.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
  const programMaxes: ProgramMax[] = [];
  for (const p of programs) {
    const parsed = parseProgram(p.sourceYaml);
    if (!parsed.ok) continue;
    let state: ProgramState = {};
    try {
      state = JSON.parse(p.state) as ProgramState;
    } catch {}
    for (const [exId, ex] of Object.entries(parsed.program.exercises)) {
      const vars = { ...ex.state, ...(state[exId] ?? {}) };
      if (typeof vars.rm1 === "number") {
        programMaxes.push({
          programId: p.id,
          programName: p.name,
          isActive: p.isActive,
          exerciseId: exId,
          exerciseName: ex.name,
          values: vars,
        });
      }
    }
  }

  // Estimated records from logged working sets (Epley).
  const cutoff =
    ent.historyDays !== null
      ? // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
        new Date(Date.now() - ent.historyDays * 24 * 60 * 60 * 1000)
      : null;
  const sets = await db.setLog.findMany({
    where: {
      completed: true,
      isWarmup: false,
      weight: { gt: 0 },
      reps: { gt: 0 },
      workout: {
        userId: user.id,
        completedAt: { not: null },
        ...(cutoff ? { startedAt: { gte: cutoff } } : {}),
      },
    },
    select: {
      exerciseName: true,
      weight: true,
      reps: true,
      workout: { select: { startedAt: true } },
    },
    take: 20_000,
  });

  const best = new Map<string, EstimatedRecord>();
  for (const s of sets) {
    const e1rm = epley1RM(s.weight ?? 0, s.reps ?? 0);
    const current = best.get(s.exerciseName);
    if (!current || e1rm > current.e1rm) {
      best.set(s.exerciseName, {
        exerciseName: s.exerciseName,
        e1rm,
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
        date: s.workout.startedAt,
      });
    }
  }
  const records = [...best.values()].sort((a, b) => b.e1rm - a.e1rm);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">1RMs</h1>
        <p className="mt-1 text-muted">
          Your one-rep maxes: the values your programs use, and estimates from
          what you actually lift.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>My 1RMs</CardTitle>
          <p className="mt-1 text-xs text-muted">
            Your reference maxes. Enter them directly or save one from the
            calculator.
          </p>
          {userMaxes.length > 0 && (
            <div className="mt-4 space-y-2">
              {userMaxes.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted">
                      Updated {formatDate(m.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {formatWeight(m.value, user.unit)}
                    </span>
                    <EditMaxButton name={m.name} value={m.value} unit={user.unit} />
                    <DeleteMaxButton id={m.id} name={m.name} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-border pt-4">
            <AddMaxForm unit={user.unit} />
          </div>
        </Card>

        <Card>
          <CardTitle>1RM calculator</CardTitle>
          <p className="mt-1 text-xs text-muted">
            Estimate your single from any hard set.
          </p>
          <div className="mt-4">
            <OneRmCalculator unit={user.unit} />
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Program 1RMs</CardTitle>
        <p className="mt-1 text-xs text-muted">
          These drive weight calculations in programs that use rm1. They update
          automatically when a logged set beats them, and you can set them
          yourself here.
        </p>
        {programMaxes.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No program tracks a 1RM yet. Add an{" "}
            <code className="font-mono">rm1</code> state variable to an
            exercise, or see the{" "}
            <Link
              href="/docs/program-format"
              className="text-accent hover:underline"
            >
              program format docs
            </Link>{" "}
            for how 1RM-based programs work.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {programMaxes.map((m) => (
              <div
                key={`${m.programId}-${m.exerciseId}`}
                className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {m.exerciseName}
                    {m.isActive && (
                      <Badge variant="success" className="text-[10px]">
                        Active program
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    <Link
                      href={`/app/programs/${m.programId}`}
                      className="hover:text-text"
                    >
                      {m.programName}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">
                    {formatWeight(m.values.rm1, user.unit)}
                  </span>
                  <StateEditor
                    programId={m.programId}
                    exerciseId={m.exerciseId}
                    exerciseName={m.exerciseName}
                    values={m.values}
                    unit={user.unit}
                    returnTo="/app/records"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Estimated from your training</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Best estimated single for each exercise (Epley formula), from every
          working set you have logged.
        </p>
        {records.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No logged sets yet">
              Finish a workout and your estimated maxes show up here.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="mt-4 w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Exercise</th>
                <th className="pb-2 font-medium">Best set</th>
                <th className="pb-2 font-medium">Est. 1RM</th>
                <th className="pb-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.exerciseName} className="border-t border-border">
                  <td className="py-2 font-medium">{r.exerciseName}</td>
                  <td className="py-2 font-mono text-xs text-muted">
                    {r.reps} × {formatWeight(r.weight, user.unit)}
                  </td>
                  <td className="py-2 font-mono text-sm font-semibold">
                    {formatWeight(Math.round(r.e1rm * 10) / 10, user.unit)}
                  </td>
                  <td className="py-2 text-right text-xs text-muted">
                    {formatDate(r.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
}
