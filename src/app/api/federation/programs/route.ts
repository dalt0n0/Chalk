import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseProgram } from "@/lib/engine/program";
import { rateLimit } from "@/lib/rate-limit";

function makeSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "program"
  );
}

/** Publish a program from a registered, approved instance. */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!key)
    return NextResponse.json(
      { error: "Missing Bearer API key" },
      { status: 401 }
    );

  const instance = await db.instance.findUnique({
    where: { apiKeyHash: createHash("sha256").update(key).digest("hex") },
  });
  if (!instance)
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  if (!instance.approved)
    return NextResponse.json(
      { error: "Instance not yet approved by the hub operator" },
      { status: 403 }
    );

  const rl = rateLimit(`fed-publish:${instance.id}`, 20, 60 * 60 * 1000);
  if (!rl.ok)
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } }
    );

  const body = await req.json().catch(() => null);
  const parsedBody = z
    .object({
      name: z.string().trim().min(1).max(120),
      description: z.string().max(5000).default(""),
      author: z.string().trim().min(1).max(120),
      tags: z.string().max(200).default(""),
      yaml: z.string().max(200_000),
    })
    .safeParse(body);
  if (!parsedBody.success)
    return NextResponse.json(
      { error: "Expected { name, description?, author, tags?, yaml }" },
      { status: 400 }
    );

  const program = parseProgram(parsedBody.data.yaml);
  if (!program.ok)
    return NextResponse.json(
      { error: "Program failed validation", details: program.errors },
      { status: 422 }
    );

  const base = makeSlug(parsedBody.data.name);
  let slug = base;
  let n = 2;
  while (await db.communityProgram.findUnique({ where: { slug } }))
    slug = `${base}-${n++}`;

  const created = await db.communityProgram.create({
    data: {
      slug,
      name: parsedBody.data.name,
      description: parsedBody.data.description,
      author: `${parsedBody.data.author} (via ${instance.name})`,
      sourceYaml: parsedBody.data.yaml,
      tags: parsedBody.data.tags,
      instanceId: instance.id,
    },
  });

  return NextResponse.json(
    { slug: created.slug, url: `/community/${created.slug}` },
    { status: 201 }
  );
}
