# Chalk Community Edition

Programmable strength training, self-hosted. A program in Chalk is a YAML
file with per-exercise state and progression rules, edited visually with a
block editor or as code. The app runs it for you every session: it computes
warmups, sets, and weights, logs what you lift, estimates your 1RM, and
advances the program automatically.

MIT licensed. Every feature is enabled; there are no plans, tiers, or
billing.

## Install in one command (Debian/Ubuntu)

```bash
curl -fsSL https://raw.githubusercontent.com/dalt0n0/Chalk/main/scripts/install.sh | sudo bash
```

Installs Node.js 22, clones to `/opt/chalk`, migrates + seeds a SQLite
database, builds, and starts a systemd service on port 3000. Update later
with `sudo /opt/chalk/scripts/update.sh`. Manual and PostgreSQL instructions
live at `/docs/self-hosting` in the running app.

## Features

- **Programs as code.** An open YAML format (see `/docs/program-format` in the
  app), validated end to end: schema, script syntax, and every set expression
  evaluated for every week of the cycle.
- **Visual block editor.** Weeks, days, and exercise blocks with set-scheme,
  warmup, and progression editors, always in sync with the YAML tab.
- **Scripted progression.** A sandboxed scripting language (no `eval`,
  hand-written parser and interpreter, execution budget): AMRAP-driven
  training maxes, failure counters, automatic deloads.
- **Estimated 1RM.** Every workout updates an Epley-based 1RM estimate per
  exercise. Programs can base weights on an auto-maintained `rm1` state
  variable, scripts can read the `e1rm` built-in, and the 1RMs page has
  manual entries plus a calculator.
- **Workout player.** Generated warmup ramps, set-by-set logging, AMRAP sets,
  rest timer, a per-exercise plate calculator, and a progression report when
  you finish.
- **Tracking.** Workout history and per-exercise history with strength
  (est. 1RM, top set) and volume charts, plus body weight and body fat
  trends.
- **Plate calculator.** Standalone page with a configurable bar and plate
  inventory, and a one-tap version inside the workout player.
- **Community repository.** Verified templates (Starting Strength, StrongLifts
  5x5, 5/3/1 BBB, GZCLP, Reddit PPL), user publishing, star ratings, and a
  verified tab. Instances can federate with a central hub.
- **User management.** The first account becomes the admin: create accounts
  with one-time temporary passwords, reset passwords, close registration.
  A server-shell CLI covers the locked-out case.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, Prisma (SQLite default,
PostgreSQL supported), Zod, Recharts.

Auth is first-party: bcrypt (cost 12), DB-backed sessions with SHA-256-hashed
opaque tokens in `httpOnly`/`SameSite=Lax`/`Secure` cookies, timing-equalized
login, uniform password-reset responses, per-IP rate limiting, and security
headers including CSP and HSTS in production.

## Development

```bash
npm install
npx prisma migrate dev
SEED_DEMO=1 npm run db:seed   # program library + demo account
npm run dev
```

Demo login: `demo@chalk.local` / `demo-password-123`. Omit `SEED_DEMO=1` to
seed only the program library; never set it on a public instance.

## Layout

```
prisma/               schema, migrations, seed
scripts/              installer, updater, password reset CLI
src/lib/engine/       program format: YAML parsing, set schemes, scripts, 1RM
src/lib/plates.ts     plate loading math
src/lib/auth/         sessions, password hashing, auth actions
src/lib/*/actions.ts  server actions per feature
src/app/(marketing)/  landing, community repo, docs
src/app/(auth)/       login, register, password reset
src/app/app/          the authenticated app
src/app/api/          federation + community JSON APIs, health check
```
