import type { Progression, ProgramDef, SetsInput } from "@/lib/engine/types";

/** Derive a valid exercise identifier from a display name. */
export function slugifyId(
  name: string,
  taken: Set<string>
): string {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "_$1");
  if (!base) base = "exercise";
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}_${n++}`;
  return id;
}

export function renameExercise(
  def: ProgramDef,
  from: string,
  to: string
): ProgramDef {
  const exercises: ProgramDef["exercises"] = {};
  for (const [id, ex] of Object.entries(def.exercises))
    exercises[id === from ? to : id] = ex;
  return {
    ...def,
    exercises,
    days: def.days.map((d) => ({
      ...d,
      blocks: d.blocks.map((b) =>
        b.exercise === from ? { ...b, exercise: to } : b
      ),
    })),
  };
}

/** Sets forms the visual editor can edit directly. */
export function isEditableSets(
  sets: SetsInput
): sets is string | Record<string, string> {
  if (typeof sets === "string") return true;
  if (Array.isArray(sets)) return false;
  return Object.values(sets).every((v) => typeof v === "string");
}

export const PROGRESSION_LABELS: Record<Progression["type"], string> = {
  none: "No progression",
  linear: "Linear (add weight on success)",
  double: "Double (add weight at top of rep range)",
  script: "Custom script",
};

export function starterProgram(unit: "lb" | "kg"): ProgramDef {
  const w = unit === "kg" ? 60 : 135;
  const inc = unit === "kg" ? 2.5 : 5;
  return {
    name: "My Program",
    description: "",
    units: unit,
    rounding: inc,
    weeks: 1,
    exercises: {
      squat: {
        name: "Barbell Squat",
        state: { weight: w },
        progress: {
          type: "linear",
          increment: inc,
          deloadPct: 10,
          failuresBeforeDeload: 3,
        },
      },
    },
    days: [
      {
        name: "Day 1",
        blocks: [{ exercise: "squat", sets: "3x5 @ weight" }],
      },
    ],
  };
}

export function cloneDef(def: ProgramDef): ProgramDef {
  return JSON.parse(JSON.stringify(def)) as ProgramDef;
}
