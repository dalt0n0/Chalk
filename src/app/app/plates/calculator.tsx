"use client";

import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  DEFAULT_CONFIGS,
  describeSolution,
  solvePlates,
} from "@/lib/plates";
import { usePlateConfig } from "@/components/plate-calc";
import { Button, Card, CardTitle, Input, Label, Select } from "@/components/ui";

export function PlateCalculator({ defaultUnit }: { defaultUnit: "lb" | "kg" }) {
  const [unit, setUnit] = useState<"lb" | "kg">(defaultUnit);
  const [config, saveConfig] = usePlateConfig(unit);
  const [target, setTarget] = useState("");

  const targetNum = Number(target);
  const solution =
    target !== "" && Number.isFinite(targetNum) && targetNum > 0
      ? solvePlates(targetNum, config)
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle>Load a bar</CardTitle>
        <div className="mt-4 flex gap-3">
          <div className="flex-1">
            <Label htmlFor="target">Target weight</Label>
            <Input
              id="target"
              inputMode="decimal"
              value={target}
              onChange={(e) =>
                setTarget(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="225"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </Select>
          </div>
        </div>

        {solution && (
          <div className="mt-5 rounded-lg bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-wide text-muted">
              Per side
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {describeSolution(solution)}
            </p>
            <p className="mt-2 text-sm text-muted">
              Bar {config.bar} {unit} + plates = {solution.loaded} {unit}
              {solution.shortBy > 0 && (
                <span className="text-danger">
                  {" "}
                  ({solution.shortBy} {unit} short of {targetNum}: add smaller
                  plates to your inventory)
                </span>
              )}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Your plates ({unit})</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => saveConfig(DEFAULT_CONFIGS[unit])}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
        <div className="mt-4">
          <Label htmlFor="bar">Bar weight</Label>
          <Input
            id="bar"
            inputMode="decimal"
            value={config.bar}
            onChange={(e) =>
              saveConfig({ ...config, bar: Number(e.target.value) || 0 })
            }
            className="w-28 font-mono"
          />
        </div>
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs uppercase tracking-wide text-muted">
            <span>Plate</span>
            <span>Pairs</span>
            <span />
          </div>
          {config.plates.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                inputMode="decimal"
                value={p.weight}
                onChange={(e) => {
                  const plates = [...config.plates];
                  plates[i] = { ...p, weight: Number(e.target.value) || 0 };
                  saveConfig({ ...config, plates });
                }}
                className="font-mono"
              />
              <Input
                inputMode="numeric"
                value={p.pairs}
                onChange={(e) => {
                  const plates = [...config.plates];
                  plates[i] = {
                    ...p,
                    pairs: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  };
                  saveConfig({ ...config, plates });
                }}
                className="font-mono"
              />
              <button
                type="button"
                aria-label="Remove plate"
                onClick={() =>
                  saveConfig({
                    ...config,
                    plates: config.plates.filter((_, j) => j !== i),
                  })
                }
                className="px-2 text-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() =>
            saveConfig({
              ...config,
              plates: [...config.plates, { weight: 0, pairs: 2 }],
            })
          }
        >
          <Plus className="h-3.5 w-3.5" /> Add plate
        </Button>
        <p className="mt-3 text-xs text-muted">
          Saved on this device. Pairs means how many of that plate you can put
          on each side.
        </p>
      </Card>
    </div>
  );
}
