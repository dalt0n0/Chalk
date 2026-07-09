import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { parseProgram } from "@/lib/engine/program";
import { activateProgram } from "@/lib/programs/actions";
import { timeAgo } from "@/lib/format";
import { Badge, Button, ButtonLink, Card, EmptyState } from "@/components/ui";

export const metadata = { title: "Programs" };

export default async function ProgramsPage() {
  const user = await requireUserPage();
  const programs = await db.program.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="mt-1 text-muted">
            Your training programs. One can be active at a time.
          </p>
        </div>
        <ButtonLink href="/app/programs/new">
          <Plus className="h-4 w-4" /> New program
        </ButtonLink>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          title="No programs yet"
          action={
            <div className="flex gap-3">
              <ButtonLink href="/community" size="sm">
                Import from community
              </ButtonLink>
              <ButtonLink href="/app/programs/new" variant="secondary" size="sm">
                Build from scratch
              </ButtonLink>
            </div>
          }
        >
          Import a proven template or build your own.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => {
            const parsed = parseProgram(p.sourceYaml);
            const meta = parsed.ok
              ? `${parsed.program.days.length} day${parsed.program.days.length === 1 ? "" : "s"}${
                  parsed.program.weeks > 1 ? ` × ${parsed.program.weeks} weeks` : ""
                } · ${Object.keys(parsed.program.exercises).length} exercises`
              : "Needs attention";
            return (
              <Card
                key={p.id}
                className="relative flex flex-col transition-colors hover:border-border-strong"
              >
                <Link
                  href={`/app/programs/${p.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Open ${p.name}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="text-lg font-semibold">{p.name}</span>
                  {p.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <form action={activateProgram} className="relative z-10">
                      <input type="hidden" name="id" value={p.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        Make active
                      </Button>
                    </form>
                  )}
                </div>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {p.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
                  <span>{meta}</span>
                  <span>Updated {timeAgo(p.updatedAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
