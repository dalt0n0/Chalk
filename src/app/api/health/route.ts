import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + database check for reverse proxies and monitors. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "ok" });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "unreachable" },
      { status: 503 }
    );
  }
}
