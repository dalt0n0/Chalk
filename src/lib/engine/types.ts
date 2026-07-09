/** Shared program-definition types (used server-side and by the editor). */

export type Unit = "lb" | "kg";

export type Progression =
  | { type: "none" }
  | {
      type: "linear";
      /** Weight added after a successful day. */
      increment: number;
      /** Deload percent applied after N failures (0 disables). */
      deloadPct?: number;
      failuresBeforeDeload?: number;
    }
  | {
      type: "double";
      /** Weight added once every set reaches the top of its rep range. */
      increment: number;
    }
  | {
      type: "script";
      /** LiftScript run when all sets hit their target reps. */
      onComplete?: string;
      /** LiftScript run otherwise. */
      onFail?: string;
    };

export type WarmupStep = { reps: number; pct: number };

/**
 * Warmup scheme for an exercise. "auto" ramps 40/60/80% of the first working
 * set, "none" skips warmups, or give explicit steps as percentages.
 */
export type WarmupConfig = "auto" | "none" | WarmupStep[];

export type ExerciseDef = {
  name: string;
  equipment?: string;
  /** Per-user mutable variables, e.g. { weight: 135, failures: 0 }. */
  state: Record<string, number>;
  progress: Progression;
  /** Defaults to "auto". */
  warmup?: WarmupConfig;
};

/** One parsed set template before weights are resolved. */
export type SetTemplate = {
  minReps: number;
  maxReps: number;
  amrap: boolean;
  /** LiftScript expression; empty string means "state.weight or 0". */
  weightExpr: string;
};

export type SetsInput =
  | string
  | Array<{ reps: number | string; weight?: number | string }>
  | Record<string, string | Array<{ reps: number | string; weight?: number | string }>>;

export type Block = {
  exercise: string;
  sets: SetsInput;
  notes?: string;
};

export type Day = {
  name: string;
  blocks: Block[];
};

export type ProgramDef = {
  name: string;
  description?: string;
  author?: string;
  units: Unit;
  /** Weight rounding increment (defaults: 5 lb / 2.5 kg). */
  rounding: number;
  /** Number of weeks in one cycle (set schemes may vary per week). */
  weeks: number;
  exercises: Record<string, ExerciseDef>;
  days: Day[];
};

/** A fully resolved set ready to be performed. */
export type PlannedSet = {
  minReps: number;
  maxReps: number;
  amrap: boolean;
  weight: number;
  isWarmup: boolean;
};

export type PlannedEntry = {
  exerciseId: string;
  name: string;
  equipment?: string;
  notes?: string;
  sets: PlannedSet[];
};

export type WorkoutPlan = {
  dayIndex: number;
  dayName: string;
  week: number;
  entries: PlannedEntry[];
};

/** Actual performance for one exercise in a finished workout (working sets only). */
export type ExerciseResult = {
  exerciseId: string;
  sets: Array<{
    minReps: number;
    maxReps: number;
    reps: number | null;
    weight: number | null;
    completed: boolean;
  }>;
};

export type ProgressionChange = {
  exerciseId: string;
  name: string;
  success: boolean;
  changes: Array<{ variable: string; from: number; to: number }>;
  error?: string;
};

export type ProgramState = Record<string, Record<string, number>>;
