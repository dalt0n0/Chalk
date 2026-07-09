import Link from "next/link";
import { BadgeCheck, Download } from "lucide-react";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Input } from "@/components/ui";
import { StarRating } from "@/components/stars";

export const metadata = { title: "Community programs" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; tab?: string }>;
}) {
  const { q = "", tag = "", tab = "all" } = await searchParams;
  const verifiedOnly = tab === "verified";

  const programs = await db.communityProgram.findMany({
    where: {
      AND: [
        verifiedOnly ? { isOfficial: true } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { description: { contains: q } },
                { author: { contains: q } },
              ],
            }
          : {},
        tag ? { tags: { contains: tag } } : {},
      ],
    },
    orderBy: [{ isOfficial: "desc" }, { downloads: "desc" }],
    take: 60,
  });

  const ratings = await db.programRating.groupBy({
    by: ["programId"],
    where: { programId: { in: programs.map((p) => p.id) } },
    _avg: { stars: true },
    _count: { stars: true },
  });
  const ratingMap = new Map(
    ratings.map((r) => [r.programId, { avg: r._avg.stars, count: r._count.stars }])
  );

  const allTags = [
    ...new Set(
      (await db.communityProgram.findMany({ select: { tags: true }, take: 500 }))
        .flatMap((p) => p.tags.split(","))
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  ].sort();

  const tabHref = (t: string) =>
    `/community?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Community programs</h1>
        <p className="mt-2 text-muted">
          Proven templates and programs shared by other lifters. Import one and
          edit anything: weights, days, progression rules.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {[
            { id: "all", label: "All programs" },
            { id: "verified", label: "Verified" },
          ].map((t) => (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                (verifiedOnly ? "verified" : "all") === t.id
                  ? "bg-surface-3 font-medium text-text"
                  : "text-muted hover:text-text"
              }`}
            >
              {t.id === "verified" && <BadgeCheck className="h-4 w-4" />}
              {t.label}
            </Link>
          ))}
        </div>
        <form className="max-w-xs flex-1" action="/community" method="GET">
          {verifiedOnly && <input type="hidden" name="tab" value="verified" />}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search programs"
            aria-label="Search programs"
          />
        </form>
      </div>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/community${verifiedOnly ? "?tab=verified" : ""}`}>
            <Badge variant={!tag ? "accent" : "neutral"}>all</Badge>
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/community?tag=${encodeURIComponent(t)}${verifiedOnly ? "&tab=verified" : ""}`}
            >
              <Badge variant={tag === t ? "accent" : "neutral"}>{t}</Badge>
            </Link>
          ))}
        </div>
      )}

      {programs.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No programs found">
            Try a different search or tag.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => {
            const rating = ratingMap.get(p.id);
            return (
              <Link key={p.id} href={`/community/${p.slug}`} className="group">
                <Card className="flex h-full flex-col transition-colors group-hover:border-border-strong">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold group-hover:text-accent-strong">
                      {p.name}
                    </h2>
                    {p.isOfficial && (
                      <span title="Verified program">
                        <BadgeCheck className="h-5 w-5 shrink-0 text-accent" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-3 text-sm text-muted">
                    {p.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <StarRating
                      avg={rating?.avg ?? null}
                      count={rating?.count ?? 0}
                    />
                    <span className="flex items-center gap-3 text-xs text-muted">
                      <span className="truncate">{p.author}</span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {p.downloads.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  {p.tags && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.split(",").slice(0, 4).map((t) => (
                        <Badge key={t} className="text-[10px]">
                          {t.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
