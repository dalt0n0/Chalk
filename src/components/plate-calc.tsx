"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_CONFIGS,
  describeSolution,
  solvePlates,
  type PlateConfig,
} from "@/lib/plates";

const storageKey = (unit: string) => `chalk.plates.${unit}`;
const CHANGE_EVENT = "chalk:plates-changed";

// Snapshot cache so useSyncExternalStore gets stable references per raw value.
const snapshotCache = new Map<string, PlateConfig>();

function readSnapshot(unit: "lb" | "kg"): PlateConfig {
  let raw = "";
  try {
    raw = localStorage.getItem(storageKey(unit)) ?? "";
  } catch {}
  const key = `${unit}|${raw}`;
  const cached = snapshotCache.get(key);
  if (cached) return cached;
  let parsed = DEFAULT_CONFIGS[unit];
  if (raw) {
    try {
      parsed = JSON.parse(raw) as PlateConfig;
    } catch {}
  }
  snapshotCache.set(key, parsed);
  return parsed;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function usePlateConfig(unit: "lb" | "kg") {
  const config = useSyncExternalStore(
    subscribe,
    () => readSnapshot(unit),
    () => DEFAULT_CONFIGS[unit]
  );
  const save = useCallback(
    (next: PlateConfig) => {
      try {
        localStorage.setItem(storageKey(unit), JSON.stringify(next));
      } catch {}
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [unit]
  );
  return [config, save] as const;
}

/** Per-side plate breakdown for a list of weights (used in the player). */
export function PlateBreakdown({
  weights,
  unit,
}: {
  weights: number[];
  unit: "lb" | "kg";
}) {
  const [config] = usePlateConfig(unit);
  const unique = [...new Set(weights.filter((w) => w > 0))].sort(
    (a, b) => a - b
  );
  if (!unique.length)
    return <p className="text-sm text-muted">No barbell weights in this exercise.</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">
        Per side, {config.bar} {unit} bar. Change your plates on the Plates
        page.
      </p>
      {unique.map((w) => {
        const sol = solvePlates(w, config);
        return (
          <div
            key={w}
            className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2"
          >
            <span className="font-mono text-sm font-semibold">
              {w} {unit}
            </span>
            <span className="font-mono text-xs text-muted">
              {describeSolution(sol)}
              {sol.shortBy > 0 && (
                <span className="text-danger"> (short {sol.shortBy})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
