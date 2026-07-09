import Link from "next/link";
import {
  Blocks,
  Code2,
  Dumbbell,
  GitFork,
  LineChart,
  ServerCog,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";

const SAMPLE_YAML = `name: StrongLifts 5x5
units: lb
exercises:
  squat:
    name: Barbell Squat
    state: { weight: 135, failures: 0 }
    progress:
      type: script
      onComplete: weight += 5
      onFail: |
        failures += 1
        if (failures >= 3) {
          weight = roundTo(weight * 0.9, 5)
          failures = 0
        }
days:
  - name: Workout A
    blocks:
      - exercise: squat
        sets: 5x5 @ weight`;

const FEATURES = [
  {
    icon: Code2,
    title: "Programs as code",
    body: "Every program is a readable YAML file with per-exercise state and progression rules. Version it, share it, fork it.",
  },
  {
    icon: Blocks,
    title: "Visual block editor",
    body: "Build weeks, days, and exercise blocks without touching YAML. The editor and the file stay in sync, so you can switch whenever you want.",
  },
  {
    icon: Dumbbell,
    title: "Progression that runs itself",
    body: "Linear progression, double progression, or your own scripts: AMRAP-driven training maxes, failure counters, automatic deloads, estimated 1RM tracking.",
  },
  {
    icon: LineChart,
    title: "Real tracking",
    body: "Warmups computed for you, every working set logged, body weight and body fat charted over time. A plate calculator is one tap away during a session.",
  },
  {
    icon: GitFork,
    title: "Community programs",
    body: "Import Starting Strength, 5/3/1, GZCLP and more, or publish your own. Ratings and a verified tab help you pick.",
  },
  {
    icon: ServerCog,
    title: "Self-hostable",
    body: "The Community Edition runs on your own server with every feature enabled. Your data stays yours.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(232,227,216,0.10),transparent)]"
        />
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              Open program format · Scriptable progression
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Your training program, running on autopilot
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Chalk computes every session for you: sets, weights, warmups, and
              deloads, all driven by progression rules you control. Show up,
              lift, log. The program handles the rest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">
                Start training free
              </ButtonLink>
              <ButtonLink href="/community" variant="secondary" size="lg">
                Browse programs
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-muted">
              Self-hosted Community Edition with every feature enabled.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-danger/60" />
              <span className="h-3 w-3 rounded-full bg-accent/60" />
              <span className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted">stronglifts-5x5.yaml</span>
            </div>
            <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-muted">
              <code className="font-mono">{SAMPLE_YAML}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            What you get
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
            The tools serious lifters actually use, and nothing else.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <f.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to train?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Import a proven program in one click, or build your own from
            scratch.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/register" size="lg">
              Create your account
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-muted">
            Prefer your own hardware?{" "}
            <Link href="/docs/self-hosting" className="text-accent hover:underline">
              Self-host the Community Edition
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
