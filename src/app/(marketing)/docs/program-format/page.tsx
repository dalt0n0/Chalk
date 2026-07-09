import { Card } from "@/components/ui";

export const metadata = { title: "Program format" };

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-4 text-[13px] leading-relaxed text-muted">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function ProgramFormatPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Chalk program format
      </h1>
      <p className="mt-3 text-muted">
        Every program is a YAML document: exercises with per-lifter state and
        progression rules, plus a schedule of days built from exercise blocks.
        The visual block editor and this format are interchangeable.
      </p>

      <Section title="Minimal program">
        <Code>{`name: My Program
units: lb            # lb | kg
rounding: 5          # round computed weights to this increment
exercises:
  squat:
    name: Barbell Squat
    state: { weight: 135 }
    progress: { type: linear, increment: 5 }
days:
  - name: Day 1
    blocks:
      - exercise: squat
        sets: 3x5 @ weight`}</Code>
      </Section>

      <Section title="Set schemes">
        <p>
          The <code className="font-mono text-text">sets</code> field accepts
          compact notation, comma separated groups, rep ranges, and AMRAP sets:
        </p>
        <Code>{`sets: 5x5 @ weight            # 5 sets of 5 at the weight state var
sets: 3x8-12 @ weight         # rep ranges (used by double progression)
sets: "4x3 @ weight, 3+ @ weight"   # "+" marks an AMRAP set
sets: 3x10                    # no weight means bodyweight (or state.weight if set)`}</Code>
        <p>
          Weights are expressions over the exercise state variables plus the
          built-ins <code className="font-mono text-text">week</code> and{" "}
          <code className="font-mono text-text">day</code>:
        </p>
        <Code>{`sets: "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"`}</Code>
        <p>
          Multi-week cycles set <code className="font-mono text-text">weeks: N</code>{" "}
          at the program level and can vary sets per week:
        </p>
        <Code>{`weeks: 4
# in a block:
sets:
  week1: "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"
  week2: "3 @ tm*0.70, 3 @ tm*0.80, 3+ @ tm*0.90"
  week3: "5 @ tm*0.75, 3 @ tm*0.85, 1+ @ tm*0.95"
  week4: "5 @ tm*0.40, 5 @ tm*0.50, 5 @ tm*0.60"`}</Code>
      </Section>

      <Section title="Warmups">
        <p>
          Chalk generates warmup sets automatically: 5 reps at 40%, 3 at 60%,
          and 2 at 80% of your first working set, rounded and clamped at the
          bar. Warmups never count toward progression. Configure per exercise:
        </p>
        <Code>{`warmup: auto                  # default, can be omitted
warmup: none                  # skip warmups for this exercise
warmup:                       # custom ramp
  - { reps: 8, pct: 0.35 }
  - { reps: 5, pct: 0.55 }
  - { reps: 3, pct: 0.75 }
  - { reps: 1, pct: 0.90 }`}</Code>
      </Section>

      <Section title="Progression types">
        <Code>{`progress: { type: none }

# Add weight after a fully successful day; optional automatic deload.
progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }

# Add weight once every set reaches the top of its rep range.
progress: { type: double, increment: 5 }

# Full control with a script.
progress:
  type: script
  onComplete: weight += 5
  onFail: |
    failures += 1
    if (failures >= 3) {
      weight = roundTo(weight * 0.9, 5)
      failures = 0
    }`}</Code>
      </Section>

      <Section title="Estimated 1RM">
        <p>
          After every workout Chalk computes an estimated one-rep max for each
          exercise from your logged working sets (Epley: weight × (1 + reps /
          30)). Two ways to use it:
        </p>
        <p>
          1. Give an exercise an <code className="font-mono text-text">rm1</code>{" "}
          state variable and base weights on it. Chalk raises{" "}
          <code className="font-mono text-text">rm1</code> automatically
          whenever a set implies a higher max, so your working weights track
          your strength:
        </p>
        <Code>{`bench:
  name: Bench Press
  state: { rm1: 225 }
  progress: { type: none }   # rm1 updates itself; sets follow it
# in a block:
sets: "5x5 @ rm1*0.75"`}</Code>
        <p>
          2. Read the <code className="font-mono text-text">e1rm</code>{" "}
          built-in inside progression scripts for the best estimate from the
          workout that just finished:
        </p>
        <Code>{`onComplete: if (e1rm > tm / 0.9) { tm = roundTo(e1rm * 0.9, 5) }`}</Code>
      </Section>

      <Section title="Scripts">
        <p>
          Progression scripts are a small sandboxed language. Statements are
          assignments (<code className="font-mono text-text">= += -= *= /=</code>)
          and <code className="font-mono text-text">if / else</code> blocks.
          Expressions support arithmetic, comparisons,{" "}
          <code className="font-mono text-text">&amp;&amp; || !</code>, and
          function calls.
        </p>
        <p>
          <span className="text-text">Read-only built-ins:</span>{" "}
          <code className="font-mono">completed</code> (1 or 0),{" "}
          <code className="font-mono">totalReps</code>,{" "}
          <code className="font-mono">lastReps</code>,{" "}
          <code className="font-mono">setsDone</code>,{" "}
          <code className="font-mono">e1rm</code>,{" "}
          <code className="font-mono">week</code>,{" "}
          <code className="font-mono">day</code>.
        </p>
        <p>
          <span className="text-text">Functions:</span>{" "}
          <code className="font-mono">
            roundTo(x, inc), floorTo, ceilTo, min, max, abs, floor, ceil, round
          </code>
          .
        </p>
        <Code>{`# 5/3/1 style: bump the training max after the deload week
onComplete: if (week == 4) { tm += 10 }

# AMRAP driven: bigger jump when the last set was strong
onComplete: if (lastReps >= 10) { tm += 10 } else { tm += 5 }`}</Code>
        <p>
          Scripts run when a workout is finished.{" "}
          <code className="font-mono text-text">onComplete</code> fires when
          every working set hit its minimum reps, otherwise{" "}
          <code className="font-mono text-text">onFail</code>. Changes are
          shown to the lifter and applied to the next session.
        </p>
      </Section>

      <Section title="Validation">
        <Card className="p-4 text-sm">
          Programs are validated on save and on import: YAML syntax, schema
          shape, unknown exercise references, script syntax, and every set
          expression is test-evaluated for each week of the cycle.
        </Card>
      </Section>
    </div>
  );
}
