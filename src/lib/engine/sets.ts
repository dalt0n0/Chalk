import { checkExpression } from "./script";
import type { SetTemplate, SetsInput } from "./types";

/**
 * Parse set-scheme notation into set templates.
 *
 * String grammar, comma separated groups:
 *   "5x5 @ weight"                  → 5 sets of 5 at expression `weight`
 *   "3x8-12 @ weight"               → rep-range sets
 *   "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"  → 5/3/1-style, "+" = AMRAP
 *   "3x10"                          → bodyweight / default weight
 *
 * Also accepts a YAML list form: [{reps: 5, weight: "tm*0.8"}, ...]
 * and a per-week map: { week1: "...", week2: "..." }.
 */

export class SetParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SetParseError";
  }
}

/** Split on commas that are not inside parentheses. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseRepSpec(spec: string): {
  minReps: number;
  maxReps: number;
  amrap: boolean;
} {
  const m = spec.match(/^(\d+)(\+)?(?:-(\d+))?$/);
  if (!m) throw new SetParseError(`Invalid rep spec "${spec}"`);
  const lo = parseInt(m[1], 10);
  const amrap = m[2] === "+";
  const hi = m[3] ? parseInt(m[3], 10) : lo;
  if (amrap && m[3])
    throw new SetParseError(`Rep spec "${spec}" cannot be both AMRAP and a range`);
  if (hi < lo) throw new SetParseError(`Rep range "${spec}" is inverted`);
  if (lo < 1 || hi > 100)
    throw new SetParseError(`Reps out of range in "${spec}"`);
  return { minReps: lo, maxReps: hi, amrap };
}

function parseGroup(group: string): SetTemplate[] {
  // [NxR][ @ expr]  or  [R][ @ expr]
  const atIdx = group.indexOf("@");
  const head = (atIdx >= 0 ? group.slice(0, atIdx) : group).trim();
  const weightExpr = atIdx >= 0 ? group.slice(atIdx + 1).trim() : "";
  if (atIdx >= 0 && !weightExpr)
    throw new SetParseError(`Missing weight expression after "@" in "${group}"`);
  if (weightExpr) {
    const err = checkExpression(weightExpr);
    if (err)
      throw new SetParseError(`Bad weight expression "${weightExpr}": ${err}`);
  }

  const xIdx = head.toLowerCase().indexOf("x");
  let count = 1;
  let repSpec = head;
  if (xIdx >= 0) {
    const n = head.slice(0, xIdx).trim();
    if (!/^\d+$/.test(n))
      throw new SetParseError(`Invalid set count in "${group}"`);
    count = parseInt(n, 10);
    if (count < 1 || count > 50)
      throw new SetParseError(`Set count out of range in "${group}"`);
    repSpec = head.slice(xIdx + 1).trim();
  }
  const reps = parseRepSpec(repSpec);
  return Array.from({ length: count }, () => ({ ...reps, weightExpr }));
}

export function parseSetString(input: string): SetTemplate[] {
  const groups = splitTopLevel(input);
  if (!groups.length) throw new SetParseError("Empty set scheme");
  return groups.flatMap(parseGroup);
}

function parseSetList(
  list: Array<{ reps: number | string; weight?: number | string }>
): SetTemplate[] {
  return list.map((s, i) => {
    const reps = parseRepSpec(String(s.reps).trim());
    let weightExpr = "";
    if (s.weight !== undefined && s.weight !== null && s.weight !== "") {
      weightExpr = String(s.weight).trim();
      const err = checkExpression(weightExpr);
      if (err)
        throw new SetParseError(`Set ${i + 1}: bad weight "${weightExpr}": ${err}`);
    }
    return { ...reps, weightExpr };
  });
}

/**
 * Resolve a SetsInput for a given week (1-based). Per-week maps use keys
 * "week1".."weekN"; a "default" key covers unlisted weeks.
 */
export function resolveSets(input: SetsInput, week: number): SetTemplate[] {
  if (typeof input === "string") return parseSetString(input);
  if (Array.isArray(input)) return parseSetList(input);
  if (input && typeof input === "object") {
    const forWeek = input[`week${week}`] ?? input.default;
    if (forWeek === undefined)
      throw new SetParseError(`No sets defined for week ${week}`);
    return typeof forWeek === "string"
      ? parseSetString(forWeek)
      : parseSetList(forWeek);
  }
  throw new SetParseError("Invalid sets definition");
}

/** Human-readable summary, e.g. "5×5 @ weight" or "5, 3, 1+ @ tm". */
export function describeSets(templates: SetTemplate[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < templates.length) {
    const t = templates[i];
    let j = i;
    while (
      j + 1 < templates.length &&
      JSON.stringify(templates[j + 1]) === JSON.stringify(t)
    )
      j++;
    const count = j - i + 1;
    const rep =
      t.minReps === t.maxReps
        ? `${t.minReps}${t.amrap ? "+" : ""}`
        : `${t.minReps}-${t.maxReps}`;
    parts.push(count > 1 ? `${count}×${rep}` : rep);
    i = j + 1;
  }
  return parts.join(", ");
}
