"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { ExerciseDef, Progression } from "@/lib/engine/types";
import { checkScript } from "@/lib/engine/script";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { PROGRESSION_LABELS } from "./model";

function ScriptField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const error = value.trim() ? checkScript(value) : null;
  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="font-mono text-xs"
        spellCheck={false}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function ProgressionEditor({
  value,
  onChange,
  scriptsAllowed,
}: {
  value: Progression;
  onChange: (p: Progression) => void;
  scriptsAllowed: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Progression</Label>
        <Select
          value={value.type}
          onChange={(e) => {
            const type = e.target.value as Progression["type"];
            if (type === "none") onChange({ type });
            else if (type === "linear")
              onChange({
                type,
                increment: 5,
                deloadPct: 10,
                failuresBeforeDeload: 3,
              });
            else if (type === "double") onChange({ type, increment: 5 });
            else
              onChange({ type, onComplete: "weight += 5", onFail: "" });
          }}
        >
          {(Object.keys(PROGRESSION_LABELS) as Progression["type"][]).map(
            (t) => (
              <option key={t} value={t} disabled={t === "script" && !scriptsAllowed}>
                {PROGRESSION_LABELS[t]}
                {t === "script" && !scriptsAllowed ? " (Pro)" : ""}
              </option>
            )
          )}
        </Select>
      </div>

      {value.type === "linear" && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Increment</Label>
            <Input
              type="number"
              step="any"
              value={value.increment}
              onChange={(e) =>
                onChange({ ...value, increment: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Deload %</Label>
            <Input
              type="number"
              step="any"
              min={0}
              max={90}
              value={value.deloadPct ?? 0}
              onChange={(e) =>
                onChange({ ...value, deloadPct: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Fails to deload</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={value.failuresBeforeDeload ?? 3}
              onChange={(e) =>
                onChange({
                  ...value,
                  failuresBeforeDeload: Math.max(1, Number(e.target.value) || 3),
                })
              }
            />
          </div>
        </div>
      )}

      {value.type === "double" && (
        <div className="w-1/3">
          <Label>Increment</Label>
          <Input
            type="number"
            step="any"
            value={value.increment}
            onChange={(e) =>
              onChange({ ...value, increment: Number(e.target.value) || 0 })
            }
          />
        </div>
      )}

      {value.type === "script" && (
        <>
          <ScriptField
            label="On success (all target reps hit)"
            value={value.onComplete ?? ""}
            onChange={(v) => onChange({ ...value, onComplete: v })}
            placeholder="weight += 5"
          />
          <ScriptField
            label="On failure"
            value={value.onFail ?? ""}
            onChange={(v) => onChange({ ...value, onFail: v })}
            placeholder={"failures += 1\nif (failures >= 3) { weight = roundTo(weight * 0.9, 5); failures = 0 }"}
          />
          <p className="text-xs text-muted">
            Built-ins: <code className="font-mono">completed, totalReps, lastReps, setsDone, week, day</code> ·
            Functions: <code className="font-mono">roundTo, min, max, floor, ceil</code>
          </p>
        </>
      )}
    </div>
  );
}

export function ExerciseEditor({
  id,
  exercise,
  usedInDays,
  scriptsAllowed,
  onChange,
  onRename,
  onDelete,
}: {
  id: string;
  exercise: ExerciseDef;
  usedInDays: number;
  scriptsAllowed: boolean;
  onChange: (ex: ExerciseDef) => void;
  onRename: (newId: string) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [idDraft, setIdDraft] = useState(id);

  const stateEntries = Object.entries(exercise.state);

  return (
    <div className="rounded-lg border border-border bg-surface-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
        )}
        <span className="flex-1 truncate text-sm font-medium">
          {exercise.name || "Unnamed exercise"}
        </span>
        <span className="font-mono text-xs text-muted">{id}</span>
        <span className="text-xs text-muted">
          {PROGRESSION_LABELS[exercise.progress.type].split(" ")[0]}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input
                value={exercise.name}
                onChange={(e) => onChange({ ...exercise, name: e.target.value })}
              />
            </div>
            <div>
              <Label>ID (used in scripts &amp; blocks)</Label>
              <Input
                value={idDraft}
                onChange={(e) => setIdDraft(e.target.value)}
                onBlur={() => {
                  const clean = idDraft.trim();
                  if (clean && clean !== id && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean))
                    onRename(clean);
                  else setIdDraft(id);
                }}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">State variables</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  let name = "weight";
                  let n = 2;
                  while (name in exercise.state) name = `var${n++}`;
                  onChange({
                    ...exercise,
                    state: { ...exercise.state, [name]: 0 },
                  });
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {stateEntries.length === 0 && (
              <p className="text-xs text-muted">
                No state. Add <code className="font-mono">weight</code> to track a working weight.
              </p>
            )}
            <div className="space-y-2">
              {stateEntries.map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <Input
                    defaultValue={key}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (
                        next &&
                        next !== key &&
                        /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(next) &&
                        !(next in exercise.state)
                      ) {
                        const state = { ...exercise.state };
                        state[next] = state[key];
                        delete state[key];
                        onChange({ ...exercise, state });
                      } else e.target.value = key;
                    }}
                    className="w-40 font-mono text-xs"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={val}
                    onChange={(e) =>
                      onChange({
                        ...exercise,
                        state: {
                          ...exercise.state,
                          [key]: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-28"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${key}`}
                    onClick={() => {
                      const state = { ...exercise.state };
                      delete state[key];
                      onChange({ ...exercise, state });
                    }}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <ProgressionEditor
            value={exercise.progress}
            scriptsAllowed={scriptsAllowed}
            onChange={(progress) => onChange({ ...exercise, progress })}
          />

          <div>
            <Label>Warmup sets</Label>
            <Select
              value={
                Array.isArray(exercise.warmup)
                  ? "custom"
                  : (exercise.warmup ?? "auto")
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "custom") return;
                onChange({
                  ...exercise,
                  warmup: v === "auto" ? undefined : "none",
                });
              }}
            >
              <option value="auto">Automatic (40 / 60 / 80% ramp)</option>
              <option value="none">No warmup sets</option>
              {Array.isArray(exercise.warmup) && (
                <option value="custom">Custom (edit in YAML tab)</option>
              )}
            </Select>
            <p className="mt-1.5 text-xs text-muted">
              Warmups never count toward progression. Custom schemes can be
              written in the YAML tab.
            </p>
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={usedInDays > 0}
              title={
                usedInDays > 0
                  ? `Used in ${usedInDays} block(s). Remove those first.`
                  : undefined
              }
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
