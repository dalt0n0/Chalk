import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Play, RotateCcw, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import {
  parseProgram,
  getWorkoutPlan,
  positionFor,
} from "@/lib/engine/program";
import { describeSets, resolveSets } from "@/lib/engine/sets";
import type { ProgramDef, ProgramState } from "@/lib/engine/types";
import {
  activateProgram,
  deleteProgram,
  resetProgramProgress,
} from "@/lib/programs/actions";
import { formatWeight } from "@/lib/format";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  FormError,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { StateEditor } from "@/components/state-editor";

export const metadata = { title: "Program" };

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const ent = getEntitlements(user);
  const program = await db.program.findFirst({
    where: { id, userId: user.id },
  });
  if (!program) notFound();

  const parsed = parseProgram(program.sourceYaml);
  let state: ProgramState = {};
  try {
    state = JSON.parse(program.state) as ProgramState;
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
            {program.isActive && <Badge variant="success">Active</Badge>}
          </div>
          {program.description && (
            <p className="mt-1 max-w-2xl text-muted">{program.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {program.isActive ? (
            <ButtonLink href="/app/train" size="sm">
              <Play className="h-4 w-4" /> Train
            </ButtonLink>
          ) : (
            <form action={activateProgram}>
              <input type="hidden" name="id" value={program.id} />
              <Button size="sm" type="submit">
                Make active
              </Button>
            </form>
          )}
          <ButtonLink href={`/app/programs/${program.id}/edit`} variant="secondary" size="sm">
            <Pencil className="h-4 w-4" /> Edit
          </ButtonLink>
          {ent.canPublish && (
            <ButtonLink
              href={`/app/programs/${program.id}/publish`}
              variant="secondary"
              size="sm"
            >
              <Upload className="h-4 w-4" /> Publish
            </ButtonLink>
          )}
        </div>
      </div>

      {!parsed.ok ? (
        <FormError>
          <p className="font-medium">This program has errors:</p>
          <ul className="mt-1 list-inside list-disc">
            {parsed.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p className="mt-2">
            <Link href={`/app/programs/${program.id}/edit`} className="underline">
              Fix in the editor
            </Link>
          </p>
        </FormError>
      ) : (
        <ProgramOverview
          programId={program.id}
          programDef={parsed.program}
          state={state}
          nextDay={program.nextDay}
          unit={parsed.program.units}
        />
      )}

      <Card>
        <CardTitle>Danger zone</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <ConfirmDialog
            trigger={
              <>
                <RotateCcw className="h-4 w-4" /> Reset progress
              </>
            }
            triggerVariant="secondary"
            title="Reset progress?"
            body="All weights and progression state go back to the program's starting values, and the schedule returns to day one."
            confirmLabel="Reset"
            confirmVariant="primary"
            cancelLabel="Never mind"
            action={resetProgramProgress}
            fields={{ id: program.id }}
          />
          <ConfirmDialog
            trigger="Delete program"
            triggerVariant="danger"
            title={`Delete ${program.name}?`}
            body="Your workout history stays, but the program and its progression state are gone for good."
            confirmLabel="Delete program"
            cancelLabel="Keep it"
            action={deleteProgram}
            fields={{ id: program.id }}
          />
        </div>
      </Card>
    </div>
  );
}

function ProgramOverview({
  programId,
  programDef,
  state,
  nextDay,
  unit,
}: {
  programId: string;
  programDef: ProgramDef;
  state: ProgramState;
  nextDay: number;
  unit: string;
}) {
  const { dayIndex, week } = positionFor(programDef, nextDay);
  let nextPlanError: string | null = null;
  try {
    getWorkoutPlan(programDef, state, nextDay);
  } catch (e) {
    nextPlanError = e instanceof Error ? e.message : "Cannot compute next workout";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardTitle>
          Schedule
          {programDef.weeks > 1
            ? ` (${programDef.weeks}-week cycle, currently week ${week})`
            : ""}
        </CardTitle>
        {nextPlanError && (
          <p className="mt-3 text-sm text-danger">{nextPlanError}</p>
        )}
        <div className="mt-4 space-y-4">
          {programDef.days.map((day, di) => (
            <div key={di}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {day.name}
                {di === dayIndex && (
                  <Badge variant="accent" className="text-[10px]">
                    Up next
                  </Badge>
                )}
              </p>
              <ul className="mt-1.5 space-y-1">
                {day.blocks.map((b, bi) => {
                  const ex = programDef.exercises[b.exercise];
                  let summary = "";
                  try {
                    summary = describeSets(resolveSets(b.sets, week));
                  } catch {
                    summary = "—";
                  }
                  return (
                    <li
                      key={bi}
                      className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-1.5 text-sm"
                    >
                      <span>{ex?.name ?? b.exercise}</span>
                      <span className="font-mono text-xs text-muted">{summary}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle>Current training state</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Know your numbers? Edit any value, including your 1RM.
        </p>
        <div className="mt-3 space-y-3">
          {Object.entries(programDef.exercises).map(([exId, ex]) => {
            const vars = state[exId] ?? ex.state;
            return (
              <div key={exId} className="rounded-md bg-surface-2 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{ex.name}</p>
                  <StateEditor
                    programId={programId}
                    exerciseId={exId}
                    exerciseName={ex.name}
                    values={vars}
                    unit={unit}
                    returnTo={`/app/programs/${programId}`}
                  />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(vars).length === 0 && (
                    <span className="text-xs text-muted">stateless</span>
                  )}
                  {Object.entries(vars).map(([k, v]) => (
                    <span key={k} className="font-mono text-xs text-muted">
                      {k}:{" "}
                      <span className="text-text">
                        {k.toLowerCase().includes("weight") || k === "tm"
                          ? formatWeight(v, unit)
                          : v}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
