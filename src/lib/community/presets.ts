/**
 * Official premade programs seeded into the community repository.
 * Each must parse cleanly with the Chalk engine (verified by tests/seed).
 */

export type Preset = {
  slug: string;
  name: string;
  author: string;
  tags: string;
  description: string;
  yaml: string;
};

export const PRESETS: Preset[] = [
  {
    slug: "starting-strength",
    name: "Starting Strength",
    author: "Mark Rippetoe (adaptation)",
    tags: "beginner,strength,barbell,3-day",
    description:
      "The classic novice linear progression: squat every session, alternating press/bench and deadlift/row, adding weight every workout.",
    yaml: `name: Starting Strength
description: Novice linear progression. Squat every session, alternate Workout A and B, add weight every time. Deload 10% after three failed sessions on a lift.
author: Mark Rippetoe (adaptation)
units: lb
rounding: 5
exercises:
  squat:
    name: Barbell Squat
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  press:
    name: Overhead Press
    state: { weight: 65 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  bench:
    name: Bench Press
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  deadlift:
    name: Deadlift
    state: { weight: 135 }
    progress: { type: linear, increment: 10, deloadPct: 10, failuresBeforeDeload: 3 }
  row:
    name: Barbell Row
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
days:
  - name: Workout A
    blocks:
      - exercise: squat
        sets: 3x5 @ weight
      - exercise: press
        sets: 3x5 @ weight
      - exercise: deadlift
        sets: 1x5 @ weight
  - name: Workout B
    blocks:
      - exercise: squat
        sets: 3x5 @ weight
      - exercise: bench
        sets: 3x5 @ weight
      - exercise: row
        sets: 3x5 @ weight
`,
  },
  {
    slug: "stronglifts-5x5",
    name: "StrongLifts 5×5",
    author: "Mehdi (adaptation)",
    tags: "beginner,strength,barbell,3-day",
    description:
      "Five sets of five on the big barbell lifts, alternating two workouts. Add weight every session; automatic 10% deload after three failures.",
    yaml: `name: StrongLifts 5x5
description: Alternate Workout A and B three times a week. 5x5 on everything except deadlift (1x5). +5 lb per session (+10 deadlift), 10% deload after 3 failures.
author: Mehdi (adaptation)
units: lb
rounding: 5
exercises:
  squat:
    name: Barbell Squat
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  bench:
    name: Bench Press
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  row:
    name: Barbell Row
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  press:
    name: Overhead Press
    state: { weight: 65 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  deadlift:
    name: Deadlift
    state: { weight: 135 }
    progress: { type: linear, increment: 10, deloadPct: 10, failuresBeforeDeload: 3 }
days:
  - name: Workout A
    blocks:
      - exercise: squat
        sets: 5x5 @ weight
      - exercise: bench
        sets: 5x5 @ weight
      - exercise: row
        sets: 5x5 @ weight
  - name: Workout B
    blocks:
      - exercise: squat
        sets: 5x5 @ weight
      - exercise: press
        sets: 5x5 @ weight
      - exercise: deadlift
        sets: 1x5 @ weight
`,
  },
  {
    slug: "531-boring-but-big",
    name: "5/3/1 Boring But Big",
    author: "Jim Wendler (adaptation)",
    tags: "intermediate,strength,barbell,4-day,percentage",
    description:
      "Wendler's 5/3/1 with Boring But Big assistance: four days per week, three waves plus a deload, driven by training-max percentages. AMRAP top sets; the training max bumps automatically after each cycle.",
    yaml: `name: 5/3/1 Boring But Big
description: Four-day 5/3/1 with 5x10 BBB volume work. Weights are percentages of each lift's training max (tm, roughly 90% of 1RM; edit the state values before starting). The TM increases after the week-4 deload (+5 upper, +10 lower).
author: Jim Wendler (adaptation)
units: lb
rounding: 5
weeks: 4
exercises:
  press:
    name: Overhead Press
    state: { tm: 100 }
    progress:
      type: script
      onComplete: if (week == 4) { tm += 5 }
      onFail: if (week == 4) { tm += 5 }
  deadlift:
    name: Deadlift
    state: { tm: 300 }
    progress:
      type: script
      onComplete: if (week == 4) { tm += 10 }
      onFail: if (week == 4) { tm += 10 }
  bench:
    name: Bench Press
    state: { tm: 200 }
    progress:
      type: script
      onComplete: if (week == 4) { tm += 5 }
      onFail: if (week == 4) { tm += 5 }
  squat:
    name: Barbell Squat
    state: { tm: 250 }
    progress:
      type: script
      onComplete: if (week == 4) { tm += 10 }
      onFail: if (week == 4) { tm += 10 }
  lat_pulldown:
    name: Lat Pulldown
    state: { weight: 90 }
    progress: { type: double, increment: 10 }
  hanging_leg_raise:
    name: Hanging Leg Raise
    state: {}
    progress: { type: none }
days:
  - name: "Day 1: Press"
    blocks:
      - exercise: press
        sets:
          week1: "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"
          week2: "3 @ tm*0.70, 3 @ tm*0.80, 3+ @ tm*0.90"
          week3: "5 @ tm*0.75, 3 @ tm*0.85, 1+ @ tm*0.95"
          week4: "5 @ tm*0.40, 5 @ tm*0.50, 5 @ tm*0.60"
      - exercise: press
        sets: 5x10 @ tm*0.5
        notes: Boring But Big volume work
      - exercise: lat_pulldown
        sets: 5x10 @ weight
  - name: "Day 2: Deadlift"
    blocks:
      - exercise: deadlift
        sets:
          week1: "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"
          week2: "3 @ tm*0.70, 3 @ tm*0.80, 3+ @ tm*0.90"
          week3: "5 @ tm*0.75, 3 @ tm*0.85, 1+ @ tm*0.95"
          week4: "5 @ tm*0.40, 5 @ tm*0.50, 5 @ tm*0.60"
      - exercise: deadlift
        sets: 5x10 @ tm*0.5
        notes: Boring But Big volume work
      - exercise: hanging_leg_raise
        sets: 5x10
  - name: "Day 3: Bench"
    blocks:
      - exercise: bench
        sets:
          week1: "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"
          week2: "3 @ tm*0.70, 3 @ tm*0.80, 3+ @ tm*0.90"
          week3: "5 @ tm*0.75, 3 @ tm*0.85, 1+ @ tm*0.95"
          week4: "5 @ tm*0.40, 5 @ tm*0.50, 5 @ tm*0.60"
      - exercise: bench
        sets: 5x10 @ tm*0.5
        notes: Boring But Big volume work
      - exercise: lat_pulldown
        sets: 5x10 @ weight
  - name: "Day 4: Squat"
    blocks:
      - exercise: squat
        sets:
          week1: "5 @ tm*0.65, 5 @ tm*0.75, 5+ @ tm*0.85"
          week2: "3 @ tm*0.70, 3 @ tm*0.80, 3+ @ tm*0.90"
          week3: "5 @ tm*0.75, 3 @ tm*0.85, 1+ @ tm*0.95"
          week4: "5 @ tm*0.40, 5 @ tm*0.50, 5 @ tm*0.60"
      - exercise: squat
        sets: 5x10 @ tm*0.5
        notes: Boring But Big volume work
      - exercise: hanging_leg_raise
        sets: 5x10
`,
  },
  {
    slug: "gzclp",
    name: "GZCLP",
    author: "Cody Lefever (adaptation)",
    tags: "beginner,intermediate,strength,barbell,4-day",
    description:
      "Cody Lefever's linear program built on the GZCL pyramid: heavy T1 with an AMRAP top set, volume T2, and high-rep T3 accessories.",
    yaml: `name: GZCLP
description: "Four-day GZCL linear progression. T1: 5 sets of 3 with an AMRAP last set (+5/+10 per session). T2: 3x10 volume (+5). T3: 3x15 with an AMRAP last set; add weight when the AMRAP hits 25. This adaptation deloads a lift 10% after two failed sessions."
author: Cody Lefever (adaptation)
units: lb
rounding: 5
exercises:
  squat:
    name: Barbell Squat (T1)
    state: { weight: 135 }
    progress: { type: linear, increment: 10, deloadPct: 10, failuresBeforeDeload: 2 }
  bench:
    name: Bench Press (T1)
    state: { weight: 115 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 2 }
  ohp:
    name: Overhead Press (T1)
    state: { weight: 75 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 2 }
  deadlift:
    name: Deadlift (T1)
    state: { weight: 185 }
    progress: { type: linear, increment: 10, deloadPct: 10, failuresBeforeDeload: 2 }
  bench_t2:
    name: Bench Press (T2)
    state: { weight: 85 }
    progress: { type: linear, increment: 5 }
  squat_t2:
    name: Barbell Squat (T2)
    state: { weight: 95 }
    progress: { type: linear, increment: 5 }
  ohp_t2:
    name: Overhead Press (T2)
    state: { weight: 55 }
    progress: { type: linear, increment: 5 }
  deadlift_t2:
    name: Deadlift (T2)
    state: { weight: 135 }
    progress: { type: linear, increment: 5 }
  lat_pulldown:
    name: Lat Pulldown (T3)
    state: { weight: 70 }
    progress:
      type: script
      onComplete: if (lastReps >= 25) { weight += 5 }
  row_t3:
    name: Dumbbell Row (T3)
    state: { weight: 35 }
    progress:
      type: script
      onComplete: if (lastReps >= 25) { weight += 5 }
days:
  - name: "Day 1: Squat focus"
    blocks:
      - exercise: squat
        sets: "4x3 @ weight, 3+ @ weight"
      - exercise: bench_t2
        sets: 3x10 @ weight
      - exercise: lat_pulldown
        sets: "2x15 @ weight, 15+ @ weight"
  - name: "Day 2: OHP focus"
    blocks:
      - exercise: ohp
        sets: "4x3 @ weight, 3+ @ weight"
      - exercise: deadlift_t2
        sets: 3x10 @ weight
      - exercise: row_t3
        sets: "2x15 @ weight, 15+ @ weight"
  - name: "Day 3: Bench focus"
    blocks:
      - exercise: bench
        sets: "4x3 @ weight, 3+ @ weight"
      - exercise: squat_t2
        sets: 3x10 @ weight
      - exercise: lat_pulldown
        sets: "2x15 @ weight, 15+ @ weight"
  - name: "Day 4: Deadlift focus"
    blocks:
      - exercise: deadlift
        sets: "4x3 @ weight, 3+ @ weight"
      - exercise: ohp_t2
        sets: 3x10 @ weight
      - exercise: row_t3
        sets: "2x15 @ weight, 15+ @ weight"
`,
  },
  {
    slug: "reddit-ppl",
    name: "Push Pull Legs (Reddit PPL)",
    author: "Metallicadpa (adaptation)",
    tags: "beginner,hypertrophy,strength,6-day",
    description:
      "The popular 6-day linear-progression Push/Pull/Legs routine: 5x5 main lifts with AMRAP finishers and double-progression accessories in the 8-12 rep range.",
    yaml: `name: Push Pull Legs (Reddit PPL)
description: Six days a week, alternating Push/Pull/Legs. Main barbell lifts run 4x5 plus an AMRAP set with linear progression; accessories use double progression in the 8-12 rep range.
author: Metallicadpa (adaptation)
units: lb
rounding: 5
exercises:
  bench:
    name: Bench Press
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  ohp:
    name: Overhead Press
    state: { weight: 65 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  squat:
    name: Barbell Squat
    state: { weight: 115 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  deadlift:
    name: Deadlift
    state: { weight: 155 }
    progress: { type: linear, increment: 10, deloadPct: 10, failuresBeforeDeload: 3 }
  row:
    name: Barbell Row
    state: { weight: 95 }
    progress: { type: linear, increment: 5, deloadPct: 10, failuresBeforeDeload: 3 }
  incline_db:
    name: Incline Dumbbell Press
    state: { weight: 35 }
    progress: { type: double, increment: 5 }
  triceps_pushdown:
    name: Triceps Pushdown
    state: { weight: 40 }
    progress: { type: double, increment: 5 }
  lateral_raise:
    name: Lateral Raise
    state: { weight: 15 }
    progress: { type: double, increment: 5 }
  pullups:
    name: Pull-ups
    state: {}
    progress: { type: none }
  face_pull:
    name: Face Pull
    state: { weight: 30 }
    progress: { type: double, increment: 5 }
  curl:
    name: Dumbbell Curl
    state: { weight: 25 }
    progress: { type: double, increment: 5 }
  leg_press:
    name: Leg Press
    state: { weight: 180 }
    progress: { type: double, increment: 10 }
  leg_curl:
    name: Leg Curl
    state: { weight: 70 }
    progress: { type: double, increment: 5 }
  calf_raise:
    name: Standing Calf Raise
    state: { weight: 100 }
    progress: { type: double, increment: 10 }
days:
  - name: Push A
    blocks:
      - exercise: bench
        sets: "4x5 @ weight, 5+ @ weight"
      - exercise: ohp
        sets: 3x8-12 @ weight*0.7
      - exercise: incline_db
        sets: 3x8-12 @ weight
      - exercise: triceps_pushdown
        sets: 3x8-12 @ weight
      - exercise: lateral_raise
        sets: 3x8-12 @ weight
  - name: Pull A
    blocks:
      - exercise: deadlift
        sets: "1x5+ @ weight"
      - exercise: pullups
        sets: 3x8-12
      - exercise: row
        sets: 3x8-12 @ weight*0.8
      - exercise: face_pull
        sets: 3x8-12 @ weight
      - exercise: curl
        sets: 3x8-12 @ weight
  - name: Legs A
    blocks:
      - exercise: squat
        sets: "4x5 @ weight, 5+ @ weight"
      - exercise: leg_press
        sets: 3x8-12 @ weight
      - exercise: leg_curl
        sets: 3x8-12 @ weight
      - exercise: calf_raise
        sets: 3x8-12 @ weight
  - name: Push B
    blocks:
      - exercise: ohp
        sets: "4x5 @ weight, 5+ @ weight"
      - exercise: bench
        sets: 3x8-12 @ weight*0.7
      - exercise: incline_db
        sets: 3x8-12 @ weight
      - exercise: triceps_pushdown
        sets: 3x8-12 @ weight
      - exercise: lateral_raise
        sets: 3x8-12 @ weight
  - name: Pull B
    blocks:
      - exercise: row
        sets: "4x5 @ weight, 5+ @ weight"
      - exercise: pullups
        sets: 3x8-12
      - exercise: face_pull
        sets: 3x8-12 @ weight
      - exercise: curl
        sets: 3x8-12 @ weight
  - name: Legs B
    blocks:
      - exercise: squat
        sets: 3x8-12 @ weight*0.8
      - exercise: leg_press
        sets: 3x8-12 @ weight
      - exercise: leg_curl
        sets: 3x8-12 @ weight
      - exercise: calf_raise
        sets: 3x8-12 @ weight
`,
  },
];
