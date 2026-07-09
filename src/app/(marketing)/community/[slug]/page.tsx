import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Download } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseProgram } from "@/lib/engine/program";
import { describeSets, resolveSets } from "@/lib/engine/sets";
import { importCommunityProgram } from "@/lib/community/actions";
import { formatDate } from "@/lib/format";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  FormError,
} from "@/components/ui";
import { RateProgram, StarRating } from "@/components/stars";

export const metadata = { title: "Program" };

export default async function CommunityProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const program = await db.communityProgram.findUnique({ where: { slug } });
  if (!program) notFound();

  const user = await getCurrentUser();
  const parsed = parseProgram(program.sourceYaml);

  const [agg, myRating] = await Promise.all([
    db.programRating.aggregate({
      where: { programId: program.id },
      _avg: { stars: true },
      _count: { stars: true },
    }),
    user
      ? db.programRating.findUnique({
          where: {
            programId_userId: { programId: program.id, userId: user.id },
          },
          select: { stars: true },
        })
      : null,
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/community" className="text-sm text-muted hover:text-text">
        ← All programs
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
            {program.isOfficial && (
              <Badge variant="accent" className="gap-1">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </div>
          <p className="mt-2 text-muted">{program.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <StarRating avg={agg._avg.stars} count={agg._count.stars} />
            <span>·</span>
            <span>by {program.author}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" /> {program.downloads.toLocaleString()} imports
            </span>
            <span>·</span>
            <span>Published {formatDate(program.createdAt)}</span>
          </div>
          <div className="mt-4">
            <RateProgram
              slug={program.slug}
              myStars={myRating?.stars ?? null}
              signedIn={!!user}
            />
          </div>
          {program.tags && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {program.tags.split(",").map((t) => (
                <Badge key={t}>{t.trim()}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="w-full sm:w-auto">
          {user ? (
            <form action={importCommunityProgram}>
              <input type="hidden" name="slug" value={program.slug} />
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                <Download className="h-4 w-4" /> Import to my programs
              </Button>
            </form>
          ) : (
            <ButtonLink
              href={`/login?next=/community/${program.slug}`}
              size="lg"
            >
              Sign in to import
            </ButtonLink>
          )}
        </div>
      </div>

      {error === "limit" && (
        <div className="mt-6">
          <FormError>
            This account has reached its program limit. Delete an old program
            first.
          </FormError>
        </div>
      )}
      {error === "invalid" && (
        <div className="mt-6">
          <FormError>This program failed validation and cannot be imported.</FormError>
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Schedule</CardTitle>
          {parsed.ok ? (
            <div className="mt-4 space-y-4">
              {parsed.program.weeks > 1 && (
                <p className="text-xs text-muted">
                  {parsed.program.weeks}-week cycle, week 1 shown.
                </p>
              )}
              {parsed.program.days.map((day, di) => (
                <div key={di}>
                  <p className="text-sm font-semibold">{day.name}</p>
                  <ul className="mt-1.5 space-y-1">
                    {day.blocks.map((b, bi) => {
                      const ex = parsed.program.exercises[b.exercise];
                      let summary = "";
                      try {
                        summary = describeSets(resolveSets(b.sets, 1));
                      } catch {
                        summary = "—";
                      }
                      return (
                        <li
                          key={bi}
                          className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-1.5 text-sm"
                        >
                          <span>{ex?.name ?? b.exercise}</span>
                          <span className="font-mono text-xs text-muted">
                            {summary}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-danger">
              This program has validation errors.
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>Program source (YAML)</CardTitle>
          <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-bg p-4 text-xs leading-relaxed text-muted">
            <code className="font-mono">{program.sourceYaml}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
}
