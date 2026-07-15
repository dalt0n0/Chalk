/**
 * Official premade programs seeded into the community repository.
 * Each must parse cleanly with the Chalk engine (verified by tests/seed).
 *
 * All main lifts are driven by 1RM math: working weights are percentages of
 * an rm1 state variable, progression scripts raise rm1, and the engine also
 * bumps rm1 automatically whenever a logged set implies a higher max.
 * Small isolation accessories keep plain working weights where a 1RM is not
 * meaningful.
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
    tags: "beginner,strength,barbell,3-day,1rm",
    description:
      "The classic novice linear progression: squat every session, alternating press/bench and deadlift/row. Weights come from each lift's 1RM; every successful session raises it.",
    yaml: `name: Starting Strength
description: Novice linear progression. Squat every session, alternate Workout A and B. Working sets are 85% of each lift's rm1; set your real 1RMs before starting (1RMs page). Success raises rm1 (about +5 on the bar, +10 for deadlift); three failed sessions deload it 10%.
author: Mark Rippetoe (adaptation)
units: lb
rounding: 5
exercises:
  squat:
    name: Barbell Squat
    state: { rm1: 110, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  press:
    name: Overhead Press
    state: { rm1: 75, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  bench:
    name: Bench Press
    state: { rm1: 110, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  deadlift:
    name: Deadlift
    state: { rm1: 160, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 12
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  row:
    name: Barbell Row
    state: { rm1: 110, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
days:
  - name: Workout A
    blocks:
      - exercise: squat
        sets: 3x5 @ rm1*0.85
      - exercise: press
        sets: 3x5 @ rm1*0.85
      - exercise: deadlift
        sets: 1x5 @ rm1*0.85
  - name: Workout B
    blocks:
      - exercise: squat
        sets: 3x5 @ rm1*0.85
      - exercise: bench
        sets: 3x5 @ rm1*0.85
      - exercise: row
        sets: 3x5 @ rm1*0.85
`,
  },
  {
    slug: "stronglifts-5x5",
    name: "StrongLifts 5×5",
    author: "Mehdi (adaptation)",
    tags: "beginner,strength,barbell,3-day,1rm",
    description:
      "Five sets of five on the big barbell lifts, alternating two workouts. Weights are 1RM percentages; each successful session raises the lift's rm1, and three failures deload it.",
    yaml: `name: StrongLifts 5x5
description: Alternate Workout A and B three times a week. 5x5 at 82.5% of each lift's rm1 (deadlift 1x5 at 85%). Set your real 1RMs before starting (1RMs page). Success raises rm1 (about +5 on the bar, +10 deadlift); three failures deload rm1 10%.
author: Mehdi (adaptation)
units: lb
rounding: 5
exercises:
  squat:
    name: Barbell Squat
    state: { rm1: 115, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  bench:
    name: Bench Press
    state: { rm1: 115, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  row:
    name: Barbell Row
    state: { rm1: 115, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  press:
    name: Overhead Press
    state: { rm1: 80, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  deadlift:
    name: Deadlift
    state: { rm1: 160, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 12
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
days:
  - name: Workout A
    blocks:
      - exercise: squat
        sets: 5x5 @ rm1*0.825
      - exercise: bench
        sets: 5x5 @ rm1*0.825
      - exercise: row
        sets: 5x5 @ rm1*0.825
  - name: Workout B
    blocks:
      - exercise: squat
        sets: 5x5 @ rm1*0.825
      - exercise: press
        sets: 5x5 @ rm1*0.825
      - exercise: deadlift
        sets: 1x5 @ rm1*0.85
`,
  },
  {
    slug: "531-boring-but-big",
    name: "5/3/1 Boring But Big",
    author: "Jim Wendler (adaptation)",
    tags: "intermediate,strength,barbell,4-day,percentage,1rm",
    description:
      "Wendler's 5/3/1 with Boring But Big assistance: four days per week, three waves plus a deload, all computed from each lift's 1RM. AMRAP top sets can raise your rm1 mid-cycle; the base bump lands after each deload week.",
    yaml: `name: 5/3/1 Boring But Big
description: "Four-day 5/3/1 with 5x10 BBB volume work. Every weight is a percentage of the lift's rm1 (the classic training max is built in as 90% of rm1). Set your real 1RMs before starting (1RMs page). rm1 rises after the week-4 deload (+5 upper, +10 lower), and big AMRAP sets raise it immediately."
author: Jim Wendler (adaptation)
units: lb
rounding: 5
weeks: 4
exercises:
  press:
    name: Overhead Press
    state: { rm1: 110 }
    progress:
      type: script
      onComplete: if (week == 4) { rm1 += 5 }
      onFail: if (week == 4) { rm1 += 5 }
  deadlift:
    name: Deadlift
    state: { rm1: 335 }
    progress:
      type: script
      onComplete: if (week == 4) { rm1 += 10 }
      onFail: if (week == 4) { rm1 += 10 }
  bench:
    name: Bench Press
    state: { rm1: 225 }
    progress:
      type: script
      onComplete: if (week == 4) { rm1 += 5 }
      onFail: if (week == 4) { rm1 += 5 }
  squat:
    name: Barbell Squat
    state: { rm1: 280 }
    progress:
      type: script
      onComplete: if (week == 4) { rm1 += 10 }
      onFail: if (week == 4) { rm1 += 10 }
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
          week1: "5 @ rm1*0.9*0.65, 5 @ rm1*0.9*0.75, 5+ @ rm1*0.9*0.85"
          week2: "3 @ rm1*0.9*0.70, 3 @ rm1*0.9*0.80, 3+ @ rm1*0.9*0.90"
          week3: "5 @ rm1*0.9*0.75, 3 @ rm1*0.9*0.85, 1+ @ rm1*0.9*0.95"
          week4: "5 @ rm1*0.9*0.40, 5 @ rm1*0.9*0.50, 5 @ rm1*0.9*0.60"
      - exercise: press
        sets: 5x10 @ rm1*0.45
        notes: Boring But Big volume work
      - exercise: lat_pulldown
        sets: 5x10 @ weight
  - name: "Day 2: Deadlift"
    blocks:
      - exercise: deadlift
        sets:
          week1: "5 @ rm1*0.9*0.65, 5 @ rm1*0.9*0.75, 5+ @ rm1*0.9*0.85"
          week2: "3 @ rm1*0.9*0.70, 3 @ rm1*0.9*0.80, 3+ @ rm1*0.9*0.90"
          week3: "5 @ rm1*0.9*0.75, 3 @ rm1*0.9*0.85, 1+ @ rm1*0.9*0.95"
          week4: "5 @ rm1*0.9*0.40, 5 @ rm1*0.9*0.50, 5 @ rm1*0.9*0.60"
      - exercise: deadlift
        sets: 5x10 @ rm1*0.45
        notes: Boring But Big volume work
      - exercise: hanging_leg_raise
        sets: 5x10
  - name: "Day 3: Bench"
    blocks:
      - exercise: bench
        sets:
          week1: "5 @ rm1*0.9*0.65, 5 @ rm1*0.9*0.75, 5+ @ rm1*0.9*0.85"
          week2: "3 @ rm1*0.9*0.70, 3 @ rm1*0.9*0.80, 3+ @ rm1*0.9*0.90"
          week3: "5 @ rm1*0.9*0.75, 3 @ rm1*0.9*0.85, 1+ @ rm1*0.9*0.95"
          week4: "5 @ rm1*0.9*0.40, 5 @ rm1*0.9*0.50, 5 @ rm1*0.9*0.60"
      - exercise: bench
        sets: 5x10 @ rm1*0.45
        notes: Boring But Big volume work
      - exercise: lat_pulldown
        sets: 5x10 @ weight
  - name: "Day 4: Squat"
    blocks:
      - exercise: squat
        sets:
          week1: "5 @ rm1*0.9*0.65, 5 @ rm1*0.9*0.75, 5+ @ rm1*0.9*0.85"
          week2: "3 @ rm1*0.9*0.70, 3 @ rm1*0.9*0.80, 3+ @ rm1*0.9*0.90"
          week3: "5 @ rm1*0.9*0.75, 3 @ rm1*0.9*0.85, 1+ @ rm1*0.9*0.95"
          week4: "5 @ rm1*0.9*0.40, 5 @ rm1*0.9*0.50, 5 @ rm1*0.9*0.60"
      - exercise: squat
        sets: 5x10 @ rm1*0.45
        notes: Boring But Big volume work
      - exercise: hanging_leg_raise
        sets: 5x10
`,
  },
  {
    slug: "gzclp",
    name: "GZCLP",
    author: "Cody Lefever (adaptation)",
    tags: "beginner,intermediate,strength,barbell,4-day,1rm",
    description:
      "Cody Lefever's linear program built on the GZCL pyramid: heavy T1 with an AMRAP top set, volume T2, and high-rep T3 accessories. You set one 1RM per lift; the heavy and volume work both come from it.",
    yaml: `name: GZCLP
description: "Four-day GZCL linear progression. One 1RM per lift: the heavy work (T1, 5x3 with an AMRAP last set at 85%) and the volume work (T2, 3x10 at 65%) both come from the same number, so you only set four 1RMs. Set them before starting (1RMs page). Each lift's 1RM rises on its heavy day; two failed heavy sessions deload it 10%. T3 accessories add weight when the AMRAP hits 25."
author: Cody Lefever (adaptation)
units: lb
rounding: 5
exercises:
  squat:
    name: Barbell Squat
    state: { rm1: 185, failures: 0 }
    progress:
      type: script
      onComplete: if (day == 1) { rm1 += 12 }
      onFail: |
        if (day == 1) {
          failures += 1
          if (failures >= 2) {
            rm1 = roundTo(rm1 * 0.9, 5)
            failures = 0
          }
        }
  ohp:
    name: Overhead Press
    state: { rm1: 95, failures: 0 }
    progress:
      type: script
      onComplete: if (day == 2) { rm1 += 6 }
      onFail: |
        if (day == 2) {
          failures += 1
          if (failures >= 2) {
            rm1 = roundTo(rm1 * 0.9, 5)
            failures = 0
          }
        }
  bench:
    name: Bench Press
    state: { rm1: 135, failures: 0 }
    progress:
      type: script
      onComplete: if (day == 3) { rm1 += 6 }
      onFail: |
        if (day == 3) {
          failures += 1
          if (failures >= 2) {
            rm1 = roundTo(rm1 * 0.9, 5)
            failures = 0
          }
        }
  deadlift:
    name: Deadlift
    state: { rm1: 225, failures: 0 }
    progress:
      type: script
      onComplete: if (day == 4) { rm1 += 12 }
      onFail: |
        if (day == 4) {
          failures += 1
          if (failures >= 2) {
            rm1 = roundTo(rm1 * 0.9, 5)
            failures = 0
          }
        }
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
        sets: "4x3 @ rm1*0.85, 3+ @ rm1*0.85"
        notes: T1 heavy
      - exercise: bench
        sets: 3x10 @ rm1*0.65
        notes: T2 volume
      - exercise: lat_pulldown
        sets: "2x15 @ weight, 15+ @ weight"
  - name: "Day 2: OHP focus"
    blocks:
      - exercise: ohp
        sets: "4x3 @ rm1*0.85, 3+ @ rm1*0.85"
        notes: T1 heavy
      - exercise: deadlift
        sets: 3x10 @ rm1*0.65
        notes: T2 volume
      - exercise: row_t3
        sets: "2x15 @ weight, 15+ @ weight"
  - name: "Day 3: Bench focus"
    blocks:
      - exercise: bench
        sets: "4x3 @ rm1*0.85, 3+ @ rm1*0.85"
        notes: T1 heavy
      - exercise: squat
        sets: 3x10 @ rm1*0.65
        notes: T2 volume
      - exercise: lat_pulldown
        sets: "2x15 @ weight, 15+ @ weight"
  - name: "Day 4: Deadlift focus"
    blocks:
      - exercise: deadlift
        sets: "4x3 @ rm1*0.85, 3+ @ rm1*0.85"
        notes: T1 heavy
      - exercise: ohp
        sets: 3x10 @ rm1*0.65
        notes: T2 volume
      - exercise: row_t3
        sets: "2x15 @ weight, 15+ @ weight"
`,
  },
  {
    slug: "reddit-ppl",
    name: "Push Pull Legs (Reddit PPL)",
    author: "Metallicadpa (adaptation)",
    tags: "beginner,hypertrophy,strength,6-day,1rm",
    description:
      "The popular 6-day linear-progression Push/Pull/Legs routine. Main barbell lifts run off each lift's 1RM with AMRAP finishers that can raise it; accessories use double progression in the 8-12 rep range.",
    yaml: `name: Push Pull Legs (Reddit PPL)
description: Six days a week, alternating Push/Pull/Legs. Main lifts are 4x5 plus an AMRAP set at 85% of rm1 (secondary slots at 60-65%); set your real 1RMs before starting (1RMs page). Success raises rm1, three failures deload it 10%, and big AMRAP sets raise it immediately. Accessories use double progression in the 8-12 range.
author: Metallicadpa (adaptation)
units: lb
rounding: 5
exercises:
  bench:
    name: Bench Press
    state: { rm1: 110, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  ohp:
    name: Overhead Press
    state: { rm1: 75, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  squat:
    name: Barbell Squat
    state: { rm1: 135, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  deadlift:
    name: Deadlift
    state: { rm1: 185, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 12
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
  row:
    name: Barbell Row
    state: { rm1: 110, failures: 0 }
    progress:
      type: script
      onComplete: rm1 += 6
      onFail: |
        failures += 1
        if (failures >= 3) {
          rm1 = roundTo(rm1 * 0.9, 5)
          failures = 0
        }
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
        sets: "4x5 @ rm1*0.85, 5+ @ rm1*0.85"
      - exercise: ohp
        sets: 3x8-12 @ rm1*0.6
      - exercise: incline_db
        sets: 3x8-12 @ weight
      - exercise: triceps_pushdown
        sets: 3x8-12 @ weight
      - exercise: lateral_raise
        sets: 3x8-12 @ weight
  - name: Pull A
    blocks:
      - exercise: deadlift
        sets: "1x5+ @ rm1*0.85"
      - exercise: pullups
        sets: 3x8-12
      - exercise: row
        sets: 3x8-12 @ rm1*0.65
      - exercise: face_pull
        sets: 3x8-12 @ weight
      - exercise: curl
        sets: 3x8-12 @ weight
  - name: Legs A
    blocks:
      - exercise: squat
        sets: "4x5 @ rm1*0.85, 5+ @ rm1*0.85"
      - exercise: leg_press
        sets: 3x8-12 @ weight
      - exercise: leg_curl
        sets: 3x8-12 @ weight
      - exercise: calf_raise
        sets: 3x8-12 @ weight
  - name: Push B
    blocks:
      - exercise: ohp
        sets: "4x5 @ rm1*0.85, 5+ @ rm1*0.85"
      - exercise: bench
        sets: 3x8-12 @ rm1*0.6
      - exercise: incline_db
        sets: 3x8-12 @ weight
      - exercise: triceps_pushdown
        sets: 3x8-12 @ weight
      - exercise: lateral_raise
        sets: 3x8-12 @ weight
  - name: Pull B
    blocks:
      - exercise: row
        sets: "4x5 @ rm1*0.85, 5+ @ rm1*0.85"
      - exercise: pullups
        sets: 3x8-12
      - exercise: face_pull
        sets: 3x8-12 @ weight
      - exercise: curl
        sets: 3x8-12 @ weight
  - name: Legs B
    blocks:
      - exercise: squat
        sets: 3x8-12 @ rm1*0.65
      - exercise: leg_press
        sets: 3x8-12 @ weight
      - exercise: leg_curl
        sets: 3x8-12 @ weight
      - exercise: calf_raise
        sets: 3x8-12 @ weight
  `,
  },
];
