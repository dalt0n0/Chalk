"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Blocks, Code2, Plus, Save } from "lucide-react";
import type { ProgramDef } from "@/lib/engine/types";
import { parseProgram, serializeProgram } from "@/lib/engine/program";
import {
  createProgram,
  updateProgram,
  type ProgramFormState,
} from "@/lib/programs/actions";
import {
  Button,
  FormError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { cloneDef, renameExercise, slugifyId, starterProgram } from "./model";
import { ExerciseEditor } from "./ExerciseEditor";
import { DayEditor } from "./DayEditor";

type Tab = "visual" | "yaml";

export function ProgramEditor({
  mode,
  programId,
  initialYaml,
  scriptsAllowed,
  defaultUnit,
}: {
  mode: "create" | "edit";
  programId?: string;
  initialYaml?: string;
  scriptsAllowed: boolean;
  defaultUnit: "lb" | "kg";
}) {
  const initial = useMemo(() => {
    if (!initialYaml)
      return { def: starterProgram(defaultUnit), yaml: "", errors: [] as string[] };
    const parsed = parseProgram(initialYaml);
    if (parsed.ok)
      return { def: parsed.program, yaml: initialYaml, errors: [] as string[] };
    return { def: null, yaml: initialYaml, errors: parsed.errors };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tab, setTab] = useState<Tab>(initial.def ? "visual" : "yaml");
  const [def, setDef] = useState<ProgramDef | null>(initial.def);
  const [yamlText, setYamlText] = useState(initial.yaml);
  const [clientErrors, setClientErrors] = useState<string[]>(initial.errors);

  const action = mode === "create" ? createProgram : updateProgram;
  const [serverState, dispatch] = useActionState<ProgramFormState, FormData>(
    action,
    {}
  );
  const [saving, startSaving] = useTransition();

  function switchTab(next: Tab) {
    if (next === tab) return;
    if (next === "yaml") {
      if (def) setYamlText(serializeProgram(def));
      setClientErrors([]);
      setTab("yaml");
    } else {
      const parsed = parseProgram(yamlText);
      if (parsed.ok) {
        setDef(parsed.program);
        setClientErrors([]);
        setTab("visual");
      } else {
        setClientErrors(parsed.errors);
      }
    }
  }

  function save() {
    const source = tab === "visual" && def ? serializeProgram(def) : yamlText;
    const parsed = parseProgram(source);
    if (!parsed.ok) {
      setClientErrors(parsed.errors);
      return;
    }
    setClientErrors([]);
    const fd = new FormData();
    if (programId) fd.set("id", programId);
    fd.set("yaml", source);
    startSaving(() => dispatch(fd));
  }

  const errors = [
    ...(serverState.error ? [serverState.error] : []),
    ...(serverState.errors ?? []),
    ...clientErrors,
  ];

  const usage = useMemo(() => {
    const counts: Record<string, number> = {};
    if (def)
      for (const d of def.days)
        for (const b of d.blocks)
          counts[b.exercise] = (counts[b.exercise] ?? 0) + 1;
    return counts;
  }, [def]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(
            [
              { id: "visual", label: "Block editor", icon: Blocks },
              { id: "yaml", label: "YAML", icon: Code2 },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.id
                  ? "bg-surface-3 font-medium text-text"
                  : "text-muted hover:text-text"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : mode === "create" ? "Create program" : "Save changes"}
        </Button>
      </div>

      {errors.length > 0 && (
        <FormError>
          <ul className="list-inside list-disc space-y-1">
            {errors.slice(0, 8).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </FormError>
      )}

      {tab === "yaml" || !def ? (
        <div>
          <Textarea
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            rows={28}
            spellCheck={false}
            className="font-mono text-[13px] leading-relaxed"
            placeholder="Paste or write a Chalk program in YAML"
          />
          <p className="mt-2 text-xs text-muted">
            See the{" "}
            <a
              href="/docs/program-format"
              target="_blank"
              className="text-accent hover:underline"
            >
              program format reference
            </a>{" "}
            for the full syntax.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Program meta */}
          <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label>Program name</Label>
              <Input
                value={def.name}
                onChange={(e) => setDef({ ...def, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Units</Label>
              <Select
                value={def.units}
                onChange={(e) =>
                  setDef({ ...def, units: e.target.value as "lb" | "kg" })
                }
              >
                <option value="lb">Pounds (lb)</option>
                <option value="kg">Kilograms (kg)</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Weeks</Label>
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={def.weeks}
                  onChange={(e) =>
                    setDef({
                      ...def,
                      weeks: Math.min(16, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div>
                <Label>Round to</Label>
                <Input
                  type="number"
                  step="any"
                  min={0.5}
                  value={def.rounding}
                  onChange={(e) =>
                    setDef({
                      ...def,
                      rounding: Math.max(0.5, Number(e.target.value) || 5),
                    })
                  }
                />
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={def.description ?? ""}
                onChange={(e) =>
                  setDef({ ...def, description: e.target.value || undefined })
                }
              />
            </div>
          </div>

          {/* Exercises */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Exercises
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const next = cloneDef(def);
                  const id = slugifyId(
                    "new exercise",
                    new Set(Object.keys(next.exercises))
                  );
                  next.exercises[id] = {
                    name: "New Exercise",
                    state: { weight: 45 },
                    progress: { type: "linear", increment: 5 },
                  };
                  setDef(next);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add exercise
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(def.exercises).map(([id, ex]) => (
                <ExerciseEditor
                  key={id}
                  id={id}
                  exercise={ex}
                  usedInDays={usage[id] ?? 0}
                  scriptsAllowed={scriptsAllowed}
                  onChange={(updated) =>
                    setDef({
                      ...def,
                      exercises: { ...def.exercises, [id]: updated },
                    })
                  }
                  onRename={(newId) => {
                    if (newId in def.exercises) return;
                    setDef(renameExercise(def, id, newId));
                  }}
                  onDelete={() => {
                    const next = cloneDef(def);
                    delete next.exercises[id];
                    setDef(next);
                  }}
                />
              ))}
            </div>
          </section>

          {/* Days */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Schedule{def.weeks > 1 ? ` (${def.weeks}-week cycle)` : ""}
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDef({
                    ...def,
                    days: [
                      ...def.days,
                      { name: `Day ${def.days.length + 1}`, blocks: [] },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add day
              </Button>
            </div>
            <div className="space-y-4">
              {def.days.map((day, di) => (
                <DayEditor
                  key={di}
                  day={day}
                  index={di}
                  def={def}
                  onChange={(d) =>
                    setDef({
                      ...def,
                      days: def.days.map((x, i) => (i === di ? d : x)),
                    })
                  }
                  onDelete={() =>
                    setDef({ ...def, days: def.days.filter((_, i) => i !== di) })
                  }
                  onMove={(dir) => {
                    const days = [...def.days];
                    const [d] = days.splice(di, 1);
                    days.splice(di + dir, 0, d);
                    setDef({ ...def, days });
                  }}
                  canMoveUp={di > 0}
                  canMoveDown={di < def.days.length - 1}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
