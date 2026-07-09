import YAML from "yaml";
import { z } from "zod";
import { checkScript, evalExpression, runScript, ScriptError } from "./script";
import { resolveSets, SetParseError } from "./sets";
import type {
  ExerciseResult,
  PlannedEntry,
  ProgramDef,
  ProgramState,
  Progression,
  ProgressionChange,
  WorkoutPlan,
} from "./types";

// ------------------------------------------------------------------ schema

const setObj = z.object({
  reps: z.union([z.number().int(), z.string()]),
  weight: z.union([z.number(), z.string()]).optional(),
});
const setsInput = z.union([
  z.string(),
  z.array(setObj),
  z.record(z.string(), z.union([z.string(), z.array(setObj)])),
]);

const progression = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("none") }),
    z.object({
      type: z.literal("linear"),
      increment: z.number(),
      deloadPct: z.number().min(0).max(90).optional(),
      failuresBeforeDeload: z.number().int().min(1).max(20).optional(),
    }),
    z.object({ type: z.literal("double"), increment: z.number() }),
    z.object({
      type: z.literal("script"),
      onComplete: z.string().optional(),
      onFail: z.string().optional(),
    }),
  ])
  .default({ type: "none" });

const warmupConfig = z.union([
  z.literal("auto"),
  z.literal("none"),
  z
    .array(
      z.object({
        reps: z.number().int().min(1).max(30),
        pct: z.number().min(0.05).max(1),
      })
    )
    .max(8),
]);

const exerciseDef = z.object({
  name: z.string().min(1),
  equipment: z.string().optional(),
  state: z.record(z.string(), z.number()).default({}),
  progress: progression,
  warmup: warmupConfig.optional(),
});

const block = z.object({
  exercise: z.string().min(1),
  sets: setsInput,
  notes: z.string().optional(),
});

const day = z.object({
  name: z.string().min(1),
  blocks: z.array(block).min(1),
});

const programSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(5000).optional(),
  author: z.string().max(120).optional(),
  units: z.enum(["lb", "kg"]).default("lb"),
  rounding: z.number().positive().optional(),
  weeks: z.number().int().min(1).max(16).default(1),
  exercises: z.record(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/), exerciseDef),
  days: z.array(day).min(1).max(14),
});

export type ParseResult =
  | { ok: true; program: ProgramDef; warnings: string[] }
  | { ok: false; errors: string[] };

const MAX_YAML_BYTES = 200_000;

/** Parse + validate program YAML. Never throws. */
export function parseProgram(source: string): ParseResult {
  // TextEncoder (not Buffer) so this also runs in the browser-side editor.
  if (new TextEncoder().encode(source).length > MAX_YAML_BYTES)
    return { ok: false, errors: ["Program file is too large (200 KB max)."] };

  let raw: unknown;
  try {
    raw = YAML.parse(source);
  } catch (e) {
    return {
      ok: false,
      errors: [`YAML syntax error: ${e instanceof Error ? e.message : String(e)}`],
    };
  }
  const parsed = programSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues
        .slice(0, 10)
        .map((i) => `${i.path.join(".") || "program"}: ${i.message}`),
    };
  }

  const p = parsed.data;
  const program: ProgramDef = {
    ...p,
    rounding: p.rounding ?? (p.units === "kg" ? 2.5 : 5),
  };

  const errors: string[] = [];
  const warnings: string[] = [];

  // Cross-checks: block references, script validity, set schemes evaluable.
  for (const [exId, ex] of Object.entries(program.exercises)) {
    if (ex.progress.type === "script") {
      for (const key of ["onComplete", "onFail"] as const) {
        const src = ex.progress[key];
        if (src) {
          const err = checkScript(src);
          if (err) errors.push(`exercises.${exId}.progress.${key}: ${err}`);
        }
      }
    }
  }
  program.days.forEach((d, di) => {
    d.blocks.forEach((b, bi) => {
      const ex = program.exercises[b.exercise];
      if (!ex) {
        errors.push(
          `days[${di}].blocks[${bi}]: unknown exercise "${b.exercise}"`
        );
        return;
      }
      for (let week = 1; week <= program.weeks; week++) {
        try {
          const templates = resolveSets(b.sets, week);
          for (const t of templates) {
            if (t.weightExpr) {
              evalExpression(t.weightExpr, {
                state: { ...ex.state },
                builtins: builtinVars(week, di + 1),
              });
            }
          }
        } catch (e) {
          const msg =
            e instanceof SetParseError || e instanceof ScriptError
              ? e.message
              : String(e);
          errors.push(
            `days[${di}].blocks[${bi}] ("${ex.name}", week ${week}): ${msg}`
          );
          break;
        }
      }
    });
  });

  const usedExercises = new Set(
    program.days.flatMap((d) => d.blocks.map((b) => b.exercise))
  );
  for (const exId of Object.keys(program.exercises)) {
    if (!usedExercises.has(exId))
      warnings.push(`Exercise "${exId}" is defined but never used.`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, program, warnings };
}

// -------------------------------------------------------------- scheduling

function builtinVars(week: number, day: number): Record<string, number> {
  return { week, day };
}

/** Default warmup ramp used when an exercise doesn't configure one. */
const AUTO_WARMUP: Array<{ reps: number; pct: number }> = [
  { reps: 5, pct: 0.4 },
  { reps: 3, pct: 0.6 },
  { reps: 2, pct: 0.8 },
];

export function barWeightFor(units: "lb" | "kg"): number {
  return units === "kg" ? 20 : 45;
}

/**
 * Compute warmup sets leading into the first working set of an exercise.
 * Weights are rounded, clamped at the bar, and deduplicated; steps at or
 * above the working weight are dropped.
 */
function warmupSets(
  config: "auto" | "none" | Array<{ reps: number; pct: number }> | undefined,
  firstWorkingWeight: number,
  rounding: number,
  units: "lb" | "kg"
): Array<{ reps: number; weight: number }> {
  const scheme = config === undefined || config === "auto" ? AUTO_WARMUP : config;
  if (scheme === "none" || firstWorkingWeight <= 0) return [];
  const bar = barWeightFor(units);
  if (firstWorkingWeight <= bar) return [];
  const out: Array<{ reps: number; weight: number }> = [];
  for (const step of scheme) {
    let w = Math.round((step.pct * firstWorkingWeight) / rounding) * rounding;
    w = Math.max(bar, w);
    if (w >= firstWorkingWeight) continue;
    const prev = out[out.length - 1];
    if (prev && prev.weight === w) continue;
    out.push({ reps: step.reps, weight: w });
  }
  return out;
}

/** Epley estimated one-rep max. */
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Initial per-exercise state from the program definition. */
export function initialState(program: ProgramDef): ProgramState {
  const state: ProgramState = {};
  for (const [exId, ex] of Object.entries(program.exercises)) {
    state[exId] = { ...ex.state };
    // Linear-with-deload needs a failure counter even if the author omitted it.
    if (
      ex.progress.type === "linear" &&
      (ex.progress.deloadPct ?? 0) > 0 &&
      state[exId].failures === undefined
    )
      state[exId].failures = 0;
  }
  return state;
}

export function positionFor(program: ProgramDef, nextDay: number) {
  const dayIndex = nextDay % program.days.length;
  const week =
    (Math.floor(nextDay / program.days.length) % program.weeks) + 1;
  return { dayIndex, week };
}

/**
 * Build the concrete plan (reps + weights) for the day at absolute position
 * `nextDay` given the user's current program state.
 */
export function getWorkoutPlan(
  program: ProgramDef,
  state: ProgramState,
  nextDay: number
): WorkoutPlan {
  const { dayIndex, week } = positionFor(program, nextDay);
  const dayDef = program.days[dayIndex];
  const entries: PlannedEntry[] = dayDef.blocks.map((b) => {
    const ex = program.exercises[b.exercise];
    const exState = state[b.exercise] ?? { ...ex.state };
    const templates = resolveSets(b.sets, week);
    const working = templates.map((t) => {
      let weight = 0;
      if (t.weightExpr) {
        weight = evalExpression(t.weightExpr, {
          state: { ...exState },
          builtins: builtinVars(week, dayIndex + 1),
        });
      } else if (typeof exState.weight === "number") {
        weight = exState.weight;
      }
      weight = Math.max(
        0,
        Math.round(weight / program.rounding) * program.rounding
      );
      // Avoid float dust like 137.50000000000003
      weight = Math.round(weight * 100) / 100;
      return {
        minReps: t.minReps,
        maxReps: t.maxReps,
        amrap: t.amrap,
        weight,
        isWarmup: false,
      };
    });
    const warmups = warmupSets(
      ex.warmup,
      working[0]?.weight ?? 0,
      program.rounding,
      program.units
    ).map((w) => ({
      minReps: w.reps,
      maxReps: w.reps,
      amrap: false,
      weight: w.weight,
      isWarmup: true,
    }));
    return {
      exerciseId: b.exercise,
      name: ex.name,
      equipment: ex.equipment,
      notes: b.notes,
      sets: [...warmups, ...working],
    };
  });
  return { dayIndex, dayName: dayDef.name, week, entries };
}

// ------------------------------------------------------------- progression

function applyOne(
  progress: Progression,
  exState: Record<string, number>,
  success: boolean,
  toppedOut: boolean,
  builtins: Record<string, number>,
  rounding: number
): void {
  switch (progress.type) {
    case "none":
      return;
    case "linear": {
      if (success) {
        exState.weight = (exState.weight ?? 0) + progress.increment;
        if ((progress.deloadPct ?? 0) > 0) exState.failures = 0;
      } else if ((progress.deloadPct ?? 0) > 0) {
        exState.failures = (exState.failures ?? 0) + 1;
        if (exState.failures >= (progress.failuresBeforeDeload ?? 3)) {
          exState.weight =
            Math.round(
              ((exState.weight ?? 0) * (1 - (progress.deloadPct ?? 0) / 100)) /
                rounding
            ) * rounding;
          exState.failures = 0;
        }
      }
      return;
    }
    case "double": {
      if (success && toppedOut)
        exState.weight = (exState.weight ?? 0) + progress.increment;
      return;
    }
    case "script": {
      const src = success ? progress.onComplete : progress.onFail;
      if (src) runScript(src, { state: exState, builtins });
      return;
    }
  }
}

/**
 * Apply progression rules after a finished workout. Returns the new state
 * and a change log for the UI. Input `results` describes actual reps.
 */
export function applyProgression(
  program: ProgramDef,
  state: ProgramState,
  nextDay: number,
  results: ExerciseResult[]
): { state: ProgramState; changes: ProgressionChange[] } {
  const { dayIndex, week } = positionFor(program, nextDay);
  const newState: ProgramState = JSON.parse(JSON.stringify(state));
  const changes: ProgressionChange[] = [];

  for (const result of results) {
    const ex = program.exercises[result.exerciseId];
    if (!ex) continue;
    const exState = newState[result.exerciseId] ?? { ...ex.state };
    newState[result.exerciseId] = exState;
    const before = { ...exState };

    const logged = result.sets.filter((s) => s.completed);
    const success =
      result.sets.length > 0 &&
      result.sets.every(
        (s) => s.completed && (s.reps ?? 0) >= s.minReps
      );
    const toppedOut =
      success && result.sets.every((s) => (s.reps ?? 0) >= s.maxReps);
    const totalReps = logged.reduce((sum, s) => sum + (s.reps ?? 0), 0);
    const lastReps = logged.length ? (logged[logged.length - 1].reps ?? 0) : 0;
    const e1rm =
      Math.round(
        Math.max(
          0,
          ...logged.map((s) => epley1RM(s.weight ?? 0, s.reps ?? 0))
        ) * 100
      ) / 100;

    // Auto-maintain an estimated 1RM: any exercise with an `rm1` state
    // variable gets bumped whenever a logged set implies a higher max.
    if (typeof exState.rm1 === "number" && e1rm > exState.rm1) {
      exState.rm1 = e1rm;
    }

    const builtins = {
      week,
      day: dayIndex + 1,
      completed: success ? 1 : 0,
      totalReps,
      lastReps,
      setsDone: logged.length,
      e1rm,
    };

    const change: ProgressionChange = {
      exerciseId: result.exerciseId,
      name: ex.name,
      success,
      changes: [],
    };
    try {
      applyOne(ex.progress, exState, success, toppedOut, builtins, program.rounding);
    } catch (e) {
      change.error =
        e instanceof ScriptError ? e.message : "Progression script failed";
    }
    for (const key of new Set([...Object.keys(before), ...Object.keys(exState)])) {
      const from = before[key] ?? 0;
      const to = exState[key] ?? 0;
      if (from !== to) change.changes.push({ variable: key, from, to });
    }
    changes.push(change);
  }
  return { state: newState, changes };
}

/** Serialize a ProgramDef back to canonical YAML (used by the block editor). */
export function serializeProgram(program: ProgramDef): string {
  const doc: Record<string, unknown> = {
    name: program.name,
  };
  if (program.description) doc.description = program.description;
  if (program.author) doc.author = program.author;
  doc.units = program.units;
  doc.rounding = program.rounding;
  if (program.weeks > 1) doc.weeks = program.weeks;
  doc.exercises = Object.fromEntries(
    Object.entries(program.exercises).map(([id, ex]) => {
      const e: Record<string, unknown> = { name: ex.name };
      if (ex.equipment) e.equipment = ex.equipment;
      if (Object.keys(ex.state).length) e.state = ex.state;
      if (ex.progress.type !== "none") e.progress = ex.progress;
      if (ex.warmup !== undefined && ex.warmup !== "auto") e.warmup = ex.warmup;
      return [id, e];
    })
  );
  doc.days = program.days.map((d) => ({
    name: d.name,
    blocks: d.blocks.map((b) => {
      const out: Record<string, unknown> = { exercise: b.exercise, sets: b.sets };
      if (b.notes) out.notes = b.notes;
      return out;
    }),
  }));
  return YAML.stringify(doc, { lineWidth: 100 });
}
