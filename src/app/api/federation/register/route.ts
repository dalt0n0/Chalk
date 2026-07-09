import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Register a self-hosted instance with this hub.
 * Returns an API key exactly once; the instance stays pending until an
 * operator approves it (Instance.approved).
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`fed-register:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok)
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } }
    );

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      url: z.string().trim().url().max(300),
    })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Expected { name, url } with a valid URL" },
      { status: 400 }
    );

  const apiKey = `lfi_${randomBytes(32).toString("base64url")}`;
  await db.instance.create({
    data: {
      name: parsed.data.name,
      url: parsed.data.url,
      apiKeyHash: createHash("sha256").update(apiKey).digest("hex"),
      approved: false,
    },
  });

  return NextResponse.json(
    {
      apiKey,
      status: "pending_approval",
      message:
        "Store this key securely. It is shown once. Publishing unlocks after the hub operator approves your instance.",
    },
    { status: 201 }
  );
}
