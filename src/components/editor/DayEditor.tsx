"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Block, Day, ProgramDef } from "@/lib/engine/types";
import { parseSetString } from "@/lib/engine/sets";
import { Button, Input, Select } from "@/components/ui";
import { isEditableSets } from "./model";

function setsError(value: string): string | null {
  try {
    parseSetString(value);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Invalid set scheme";
  }
}

function SetsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const error = value.trim() ? setsError(value) : "Enter a set scheme";
  return (
    <div className="flex-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="5x5 @ weight"
        className="font-mono text-xs"
        spellCheck={false}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function BlockEditor({
  block,
  def,
  onChange,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  def: ProgramDef;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const editable = isEditableSets(block.sets);
  const perWeek = editable && typeof block.sets !== "string";

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start gap-2">
        <Select
          value={block.exercise}
          onChange={(e) => onChange({ ...block, exercise: e.target.value })}
          className="w-48 shrink-0"
        >
          {Object.entries(def.exercises).map(([id, ex]) => (
            <option key={id} value={id}>
              {ex.name}
            </option>
          ))}
        </Select>

        {!editable ? (
          <p className="flex-1 self-center text-xs text-muted">
            Advanced set list. Edit it in the YAML tab.
          </p>
        ) : perWeek ? (
          <div className="flex-1 space-y-2">
            {Array.from({ length: def.weeks }, (_, i) => {
              const key = `week${i + 1}`;
              const map = block.sets as Record<string, string>;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-muted">
                    Week {i + 1}
                  </span>
                  <SetsField
                    value={map[key] ?? map.default ?? ""}
                    onChange={(v) =>
                      onChange({ ...block, sets: { ...map, [key]: v } })
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <SetsField
            value={block.sets as string}
            onChange={(v) => onChange({ ...block, sets: v })}
          />
        )}

        <div className="flex shrink-0 items-center gap-1 self-center">
          {editable && def.weeks > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (perWeek) {
                  const map = block.sets as Record<string, string>;
                  onChange({ ...block, sets: map.week1 ?? "" });
                } else {
                  const entries = Object.fromEntries(
                    Array.from({ length: def.weeks }, (_, i) => [
                      `week${i + 1}`,
                      block.sets as string,
                    ])
                  );
                  onChange({ ...block, sets: entries });
                }
              }}
            >
              {perWeek ? "Same all weeks" : "Vary by week"}
            </Button>
          )}
          <button
            type="button"
            aria-label="Move up"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
            className="rounded p-1 text-muted hover:text-text disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
            className="rounded p-1 text-muted hover:text-text disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Remove block"
            onClick={onDelete}
            className="rounded p-1 text-muted hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <Input
          value={block.notes ?? ""}
          onChange={(e) =>
            onChange({ ...block, notes: e.target.value || undefined })
          }
          placeholder="Notes (optional), e.g. pause 2s at the bottom"
          className="border-transparent bg-transparent px-1 py-1 text-xs"
        />
      </div>
    </div>
  );
}

export function DayEditor({
  day,
  index,
  def,
  onChange,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  day: Day;
  index: number;
  def: ProgramDef;
  onChange: (d: Day) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const firstExercise = Object.keys(def.exercises)[0];
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-xs font-bold text-accent-strong">
          {index + 1}
        </span>
        <Input
          value={day.name}
          onChange={(e) => onChange({ ...day, name: e.target.value })}
          className="max-w-xs font-medium"
        />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Move day up"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
            className="rounded p-1 text-muted hover:text-text disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Move day down"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
            className="rounded p-1 text-muted hover:text-text disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Delete day"
            onClick={onDelete}
            className="rounded p-1 text-muted hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {day.blocks.map((block, bi) => (
          <BlockEditor
            key={bi}
            block={block}
            def={def}
            onChange={(b) =>
              onChange({
                ...day,
                blocks: day.blocks.map((x, i) => (i === bi ? b : x)),
              })
            }
            onDelete={() =>
              onChange({ ...day, blocks: day.blocks.filter((_, i) => i !== bi) })
            }
            onMove={(dir) => {
              const blocks = [...day.blocks];
              const [b] = blocks.splice(bi, 1);
              blocks.splice(bi + dir, 0, b);
              onChange({ ...day, blocks });
            }}
            canMoveUp={bi > 0}
            canMoveDown={bi < day.blocks.length - 1}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        disabled={!firstExercise}
        onClick={() =>
          onChange({
            ...day,
            blocks: [
              ...day.blocks,
              { exercise: firstExercise, sets: "3x5 @ weight" },
            ],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Add exercise block
      </Button>
    </div>
  );
}
