/** Plate loading math. All counts are per side of the bar. */

export type PlateInventory = Array<{ weight: number; pairs: number }>;

export type PlateConfig = {
  bar: number;
  plates: PlateInventory;
};

export const DEFAULT_CONFIGS: Record<"lb" | "kg", PlateConfig> = {
  lb: {
    bar: 45,
    plates: [
      { weight: 45, pairs: 6 },
      { weight: 35, pairs: 2 },
      { weight: 25, pairs: 2 },
      { weight: 10, pairs: 2 },
      { weight: 5, pairs: 2 },
      { weight: 2.5, pairs: 2 },
    ],
  },
  kg: {
    bar: 20,
    plates: [
      { weight: 25, pairs: 6 },
      { weight: 20, pairs: 2 },
      { weight: 15, pairs: 2 },
      { weight: 10, pairs: 2 },
      { weight: 5, pairs: 2 },
      { weight: 2.5, pairs: 2 },
      { weight: 1.25, pairs: 2 },
    ],
  },
};

export type PlateSolution = {
  /** Plates for one side of the bar, heaviest first. */
  perSide: Array<{ weight: number; count: number }>;
  /** Weight actually loaded (bar + plates). */
  loaded: number;
  /** target - loaded; 0 means exact. */
  shortBy: number;
};

export function solvePlates(target: number, config: PlateConfig): PlateSolution {
  const perSideTarget = Math.max(0, (target - config.bar) / 2);
  let remaining = perSideTarget;
  const perSide: Array<{ weight: number; count: number }> = [];
  const sorted = [...config.plates].sort((a, b) => b.weight - a.weight);
  for (const p of sorted) {
    if (p.weight <= 0 || p.pairs <= 0) continue;
    const count = Math.min(p.pairs, Math.floor((remaining + 1e-9) / p.weight));
    if (count > 0) {
      perSide.push({ weight: p.weight, count });
      remaining -= count * p.weight;
    }
  }
  const loadedPerSide = perSideTarget - remaining;
  const loaded = config.bar + loadedPerSide * 2;
  return {
    perSide,
    loaded: Math.round(loaded * 100) / 100,
    shortBy: Math.round((target - loaded) * 100) / 100,
  };
}

export function describeSolution(s: PlateSolution): string {
  if (!s.perSide.length) return "empty bar";
  return s.perSide
    .map((p) => (p.count > 1 ? `${p.weight}×${p.count}` : `${p.weight}`))
    .join(" + ");
}
