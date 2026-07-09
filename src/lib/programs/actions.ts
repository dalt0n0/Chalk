"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import { initialState, parseProgram } from "@/lib/engine/program";
import type { ProgramDef, ProgramState } from "@/lib/engine/types";

export type ProgramFormState = { error?: string; errors?: string[] };

function usesCustomScripts(def: ProgramDef): boolean {
  return Object.values(def.exercises).some((e) => e.progress.type === "script");
}

/**
 * Merge existing user progression state into the state layout implied by an
 * updated program definition: keep values the lifter has earned, pick up new
 * variables from the definition.
 */
function mergeState(def: ProgramDef, existing: ProgramState): ProgramState {
  const fresh = initialState(def);
  const merged: ProgramState = {};
  for (const [exId, freshVars] of Object.entries(fresh)) {
    merged[exId] = { ...freshVars };
    const prev = existing[exId];
    if (prev) {
      for (const key of Object.keys(freshVars)) {
        if (typeof prev[key] === "number") merged[exId][key] = prev[key];
      }
    }
  }
  return merged;
}

async function requireUserOr(): Promise<
  { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please sign in again." };
  return { user };
}

export async function createProgram(
  _prev: ProgramFormState,
  formData: FormData
): Promise<ProgramFormState> {
  const auth = await requireUserOr();
  if ("error" in auth) return auth;
  const { user } = auth;

  const source = z.string().max(200_000).safeParse(formData.get("yaml"));
  if (!source.success) return { error: "Invalid program source." };

  const parsed = parseProgram(source.data);
  if (!parsed.ok) return { errors: parsed.errors };

  const ent = getEntitlements(user);
  if (ent.maxPrograms !== null) {
    const count = await db.program.count({ where: { userId: user.id } });
    if (count >= ent.maxPrograms)
      return {
        error: `This account is limited to ${ent.maxPrograms} programs. Delete one first.`,
      };
  }
  if (!ent.customScripts && usesCustomScripts(parsed.program))
    return {
      error:
        "Custom progression scripts are a Pro feature. Use linear or double progression, or upgrade.",
    };

  const hasActive = await db.program.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true },
  });
  const program = await db.program.create({
    data: {
      userId: user.id,
      name: parsed.program.name,
      description: parsed.program.description ?? "",
      sourceYaml: source.data,
      state: JSON.stringify(initialState(parsed.program)),
      isActive: !hasActive,
    },
  });
  redirect(`/app/programs/${program.id}`);
}

export async function updateProgram(
  _prev: ProgramFormState,
  formData: FormData
): Promise<ProgramFormState> {
  const auth = await requireUserOr();
  if ("error" in auth) return auth;
  const { user } = auth;

  const input = z
    .object({ id: z.string().min(1), yaml: z.string().max(200_000) })
    .safeParse({ id: formData.get("id"), yaml: formData.get("yaml") });
  if (!input.success) return { error: "Invalid input." };

  const program = await db.program.findFirst({
    where: { id: input.data.id, userId: user.id },
  });
  if (!program) return { error: "Program not found." };

  const parsed = parseProgram(input.data.yaml);
  if (!parsed.ok) return { errors: parsed.errors };

  const ent = getEntitlements(user);
  if (!ent.customScripts && usesCustomScripts(parsed.program))
    return {
      error:
        "Custom progression scripts are a Pro feature. Use linear or double progression, or upgrade.",
    };

  let existing: ProgramState = {};
  try {
    existing = JSON.parse(program.state) as ProgramState;
  } catch {
    // fall back to fresh state
  }
  await db.program.update({
    where: { id: program.id },
    data: {
      name: parsed.program.name,
      description: parsed.program.description ?? "",
      sourceYaml: input.data.yaml,
      state: JSON.stringify(mergeState(parsed.program, existing)),
      // Keep schedule position but clamp to the (possibly shorter) new plan
      nextDay:
        program.nextDay %
        (parsed.program.days.length * parsed.program.weeks),
    },
  });
  revalidatePath(`/app/programs/${program.id}`);
  redirect(`/app/programs/${program.id}`);
}

export async function activateProgram(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const program = await db.program.findFirst({
    where: { id, userId: user.id },
  });
  if (!program) return;
  await db.$transaction([
    db.program.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    }),
    db.program.update({ where: { id }, data: { isActive: true } }),
  ]);
  revalidatePath("/app/programs");
  revalidatePath("/app");
}

export async function resetProgramProgress(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const program = await db.program.findFirst({
    where: { id, userId: user.id },
  });
  if (!program) return;
  const parsed = parseProgram(program.sourceYaml);
  if (!parsed.ok) return;
  await db.program.update({
    where: { id },
    data: { state: JSON.stringify(initialState(parsed.program)), nextDay: 0 },
  });
  revalidatePath(`/app/programs/${id}`);
}

export async function deleteProgram(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await db.program.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/programs");
  redirect("/app/programs");
}

/**
 * Update one exercise's state variables (weight, tm, rm1, ...) by hand.
 * Fields arrive as "state.<var>" form entries; only variables that already
 * exist in the exercise's state layout are accepted.
 */
export async function updateExerciseState(
  _prev: ProgramFormState,
  formData: FormData
): Promise<ProgramFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const input = z
    .object({
      programId: z.string().min(1),
      exerciseId: z.string().min(1),
      returnTo: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).default("/app/programs"),
    })
    .safeParse({
      programId: formData.get("programId"),
      exerciseId: formData.get("exerciseId"),
      returnTo: formData.get("returnTo") ?? undefined,
    });
  if (!input.success) return { error: "Invalid input." };

  const program = await db.program.findFirst({
    where: { id: input.data.programId, userId: user.id },
  });
  if (!program) return { error: "Program not found." };

  const parsed = parseProgram(program.sourceYaml);
  if (!parsed.ok) return { error: "Fix the program's errors first." };
  if (!parsed.program.exercises[input.data.exerciseId])
    return { error: "Exercise not found in this program." };

  let state: ProgramState = {};
  try {
    state = JSON.parse(program.state) as ProgramState;
  } catch {}
  const merged = mergeState(parsed.program, state);
  const exState = merged[input.data.exerciseId] ?? {};

  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("state.")) continue;
    const varName = key.slice("state.".length);
    if (!(varName in exState)) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100_000)
      return { error: `"${varName}" must be a number between 0 and 100000.` };
    exState[varName] = value;
  }
  merged[input.data.exerciseId] = exState;

  await db.program.update({
    where: { id: program.id },
    data: { state: JSON.stringify(merged) },
  });
  revalidatePath(`/app/programs/${program.id}`);
  revalidatePath("/app/records");
  redirect(input.data.returnTo);
}

/** Skip the next scheduled day (e.g. missed session the lifter wants to drop). */
export async function skipNextDay(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const program = await db.program.findFirst({
    where: { id, userId: user.id },
  });
  if (!program) return;
  await db.program.update({
    where: { id },
    data: { nextDay: program.nextDay + 1 },
  });
  revalidatePath("/app/train");
  revalidatePath("/app");
}
