import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Public read API: list community programs (used by instances to sync). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.slice(0, 100) ?? "";
  const includeYaml = req.nextUrl.searchParams.get("yaml") === "1";

  const programs = await db.communityProgram.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
          ],
        }
      : undefined,
    orderBy: [{ isOfficial: "desc" }, { downloads: "desc" }],
    take: 100,
    select: {
      slug: true,
      name: true,
      description: true,
      author: true,
      tags: true,
      isOfficial: true,
      downloads: true,
      createdAt: true,
      sourceYaml: includeYaml,
    },
  });

  return NextResponse.json({ programs });
}
