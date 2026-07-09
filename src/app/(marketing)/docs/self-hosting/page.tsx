export const metadata = { title: "Self-hosting" };

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

export default function SelfHostingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Self-hosting the Community Edition
      </h1>
      <p className="mt-3 text-muted">
        The Community Edition is the full app with every feature enabled and no
        billing. One Node.js process, one database file. Source:{" "}
        <a
          href="https://github.com/dalt0n0/Chalk"
          className="text-accent hover:underline"
        >
          github.com/dalt0n0/Chalk
        </a>{" "}
        (MIT).
      </p>

      <Section title="Install on Debian or Ubuntu">
        <p>One command as root:</p>
        <Code>{`curl -fsSL https://raw.githubusercontent.com/dalt0n0/Chalk/main/scripts/install.sh | sudo bash`}</Code>
        <p>
          The installer sets up Node.js 22, clones Chalk to{" "}
          <code className="font-mono text-text">/opt/chalk</code>, creates a
          SQLite database, seeds the community program library, builds the app,
          and starts a systemd service on port 3000. When it finishes it prints
          the URL, and the first account is created in the browser.
        </p>
        <p>Useful afterwards:</p>
        <Code>{`systemctl status chalk        # service state
journalctl -u chalk -f        # live logs
sudo /opt/chalk/scripts/update.sh   # pull, migrate, rebuild, restart
/opt/chalk/.env               # configuration`}</Code>
        <p>
          Defaults can be overridden when running the installer:{" "}
          <code className="font-mono text-text">CHALK_DIR</code>,{" "}
          <code className="font-mono text-text">CHALK_PORT</code>,{" "}
          <code className="font-mono text-text">CHALK_USER</code>.
        </p>
      </Section>

      <Section title="Manual install (any Linux, macOS, Windows)">
        <p>Requires Node.js 20 or newer and git.</p>
        <Code>{`git clone https://github.com/dalt0n0/Chalk.git chalk
cd chalk
cp .env.example .env          # defaults to a local SQLite database
npm ci
npx prisma migrate deploy
npm run db:seed               # community program library
npm run build
npm start                     # serves on :3000 (PORT env to change)`}</Code>
        <p>
          Health check for proxies and monitors:{" "}
          <code className="font-mono text-text">GET /api/health</code>.
        </p>
      </Section>

      <Section title="Updating">
        <p>
          Script installs:{" "}
          <code className="font-mono text-text">
            sudo /opt/chalk/scripts/update.sh
          </code>
          . Manual installs: git pull, then{" "}
          <code className="font-mono text-text">
            npm ci && npx prisma migrate deploy && npm run build
          </code>{" "}
          and restart the process. Migrations are always additive and safe to
          run on an existing database.
        </p>
      </Section>

      <Section title="User management">
        <p>
          The first account registered on a fresh instance automatically
          becomes the administrator. Admins get an Admin page in the app
          where they can:
        </p>
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            Close or open public registration. Closed means only admins create
            accounts; the register page tells visitors to ask you.
          </li>
          <li>
            Create accounts with a generated temporary password (shown to you
            once; the user changes it in Settings).
          </li>
          <li>Reset a user&apos;s password, which signs them out everywhere.</li>
          <li>Promote or demote admins, and delete accounts.</li>
        </ul>
        <p>
          Admins cannot demote or delete themselves, so an instance always
          keeps at least one administrator.
        </p>
        <p className="text-text">Locked out (for example the only admin)?</p>
        <p>
          Reset any password from the server shell, no email needed. It prints
          a temporary password and signs that account out everywhere:
        </p>
        <Code>{`cd /opt/chalk
sudo -u chalk npm run user:reset-password -- you@example.com

# or choose the password yourself:
sudo -u chalk npm run user:reset-password -- you@example.com --password "NewPass123!"`}</Code>
      </Section>

      <Section title="PostgreSQL">
        <p>
          SQLite is the default and is plenty for a personal or small-group
          instance. To run on PostgreSQL instead:
        </p>
        <Code>{`# 1. prisma/schema.prisma: change provider to "postgresql"
# 2. .env:
DATABASE_URL="postgresql://chalk:password@localhost:5432/chalk"
# 3. Generate fresh migrations for Postgres (the shipped ones are SQLite):
npx prisma migrate dev --name init`}</Code>
        <p>
          The shipped migration history targets SQLite, so a Postgres instance
          creates its own on first setup. Do this once, before you have data.
        </p>
      </Section>

      <Section title="Publishing to the community hub">
        <p>
          Self-hosted instances can publish programs to a central hub. Register
        once for an API key, wait for operator approval, then configure:
        </p>
        <Code>{`# 1. Register (returns your API key exactly once)
curl -X POST https://hub.example.com/api/federation/register \\
  -H "content-type: application/json" \\
  -d '{"name": "My Gym Instance", "url": "https://lift.mygym.com"}'

# 2. /opt/chalk/.env
HUB_URL="https://hub.example.com"
INSTANCE_API_KEY="lfi_..."

# 3. Restart. Publishing now goes to the hub, attributed
#    "author (via My Gym Instance)".`}</Code>
        <p>
          Without a hub configured, publishing stays local to your instance.
          The hub also exposes a public read API:{" "}
          <code className="font-mono text-text">
            GET /api/community/programs?yaml=1
          </code>
          .
        </p>
      </Section>

      <Section title="Production checklist">
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            Serve behind HTTPS (Caddy or nginx in front of port 3000). The
            session cookie is Secure in production.
          </li>
          <li>
            Back up the database. On SQLite that is the single{" "}
            <code className="font-mono text-text">chalk.db</code> file in the
            install directory.
          </li>
          <li>
            Point your monitor at{" "}
            <code className="font-mono text-text">/api/health</code>.
          </li>
          <li>
            Password resets do not need email: admins reset from the Admin
            page, and the server shell has{" "}
            <code className="font-mono text-text">npm run user:reset-password</code>.
            The email flow on /forgot-password logs its link to the server
            console (<code className="font-mono text-text">journalctl -u chalk</code>)
            until SMTP is wired up.
          </li>
          <li>
            Never set <code className="font-mono text-text">SEED_DEMO=1</code>{" "}
            on a public instance; it creates an account with a known password.
          </li>
          <li>
            Running more than one node? Replace the in-memory rate limiter with
            a shared store (interface in{" "}
            <code className="font-mono text-text">src/lib/rate-limit.ts</code>).
          </li>
        </ul>
      </Section>
    </div>
  );
}
