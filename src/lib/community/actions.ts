"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEdition, getEntitlements } from "@/lib/edition";
import { initialState, parseProgram } from "@/lib/engine/program";
import { rateLimit } from "@/lib/rate-limit";

export type PublishFormState = { error?: string };

function makeSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "program"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await db.communityProgram.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
    if (n > 500) throw new Error("Could not allocate slug");
  }
  return slug;
}

/** Import a community program into the signed-in user's library. */
export async function importCommunityProgram(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/community/${encodeURIComponent(slug)}`);

  const community = await db.communityProgram.findUnique({ where: { slug } });
  if (!community) redirect("/community");

  const ent = getEntitlements(user);
  if (ent.maxPrograms !== null) {
    const count = await db.program.count({ where: { userId: user.id } });
    if (count >= ent.maxPrograms)
      redirect(`/community/${slug}?error=limit`);
  }

  const parsed = parseProgram(community.sourceYaml);
  if (!parsed.ok) redirect(`/community/${slug}?error=invalid`);

  const hasActive = await db.program.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true },
  });
  const [program] = await db.$transaction([
    db.program.create({
      data: {
        userId: user.id,
        name: parsed.program.name,
        description: parsed.program.description ?? "",
        sourceYaml: community.sourceYaml,
        state: JSON.stringify(initialState(parsed.program)),
        isActive: !hasActive,
        sourceSlug: community.slug,
      },
    }),
    db.communityProgram.update({
      where: { id: community.id },
      data: { downloads: { increment: 1 } },
    }),
  ]);
  redirect(`/app/programs/${program.id}`);
}

/** Rate a community program 1 to 5 stars (one rating per user, updatable). */
export async function rateProgram(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/community/${encodeURIComponent(slug)}`);

  const stars = z.coerce.number().int().min(1).max(5).safeParse(formData.get("stars"));
  if (!stars.success) return;

  const program = await db.communityProgram.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!program) return;

  await db.programRating.upsert({
    where: {
      programId_userId: { programId: program.id, userId: user.id },
    },
    update: { stars: stars.data },
    create: { programId: program.id, userId: user.id, stars: stars.data },
  });
  revalidatePath(`/community/${slug}`);
  revalidatePath("/community");
}

/**
 * Publish one of the user's programs to the community repo.
 * Without a hub configured, this instance is its own community repo and the
 * program is written locally. With HUB_URL + INSTANCE_API_KEY configured,
 * it publishes to the remote hub via the federation API instead.
 */
export async function publishProgram(
  _prev: PublishFormState,
  formData: FormData
): Promise<PublishFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const ent = getEntitlements(user);
  if (!ent.canPublish)
    return { error: "Publishing is not enabled for this account." };

  const rl = rateLimit(`publish:${user.id}`, 10, 60 * 60 * 1000);
  if (!rl.ok)
    return { error: `Too many publishes. Try again in ${rl.retryAfterSec}s.` };

  const input = z
    .object({
      id: z.string().min(1),
      tags: z
        .string()
        .max(200)
        .transform((v) =>
          v
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 8)
            .join(",")
        ),
    })
    .safeParse({ id: formData.get("id"), tags: formData.get("tags") ?? "" });
  if (!input.success) return { error: "Invalid input." };

  const program = await db.program.findFirst({
    where: { id: input.data.id, userId: user.id },
  });
  if (!program) return { error: "Program not found." };

  const parsed = parseProgram(program.sourceYaml);
  if (!parsed.ok)
    return { error: "Fix the program's validation errors before publishing." };

  const hubUrl = process.env.HUB_URL?.replace(/\/+$/, "");
  const instanceKey = process.env.INSTANCE_API_KEY;

  if (getEdition() === "community" && hubUrl && instanceKey) {
    // Federate to the remote hub.
    let res: Response;
    try {
      res = await fetch(`${hubUrl}/api/federation/programs`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${instanceKey}`,
        },
        body: JSON.stringify({
          name: parsed.program.name,
          description: parsed.program.description ?? "",
          author: user.name,
          tags: input.data.tags,
          yaml: program.sourceYaml,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return { error: "Could not reach the community hub. Try again later." };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return { error: body?.error ?? `Hub rejected the publish (${res.status}).` };
    }
    redirect(`/app/programs/${program.id}?published=hub`);
  }

  // Local publish (this instance is the hub).
  const slug = await uniqueSlug(makeSlug(parsed.program.name));
  await db.communityProgram.create({
    data: {
      slug,
      name: parsed.program.name,
      description: parsed.program.description ?? "",
      author: user.name,
      sourceYaml: program.sourceYaml,
      tags: input.data.tags,
      publishedById: user.id,
    },
  });
  revalidatePath("/community");
  redirect(`/community/${slug}`);
}
