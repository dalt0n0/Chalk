import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

const COOKIE_NAME = "lf_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
// Sessions past half their lifetime get silently renewed on use.
const RENEW_THRESHOLD_MS = SESSION_TTL_MS / 2;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: userAgent?.slice(0, 255),
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session
      .delete({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Resolve the current user from the session cookie. Cached per request.
 * Returns null when unauthenticated; never throws.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Sliding renewal (best-effort; cookie refresh happens on next auth action)
  if (session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    await db.session
      .update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      })
      .catch(() => {});
  }
  return session.user;
});

/** Like getCurrentUser but throws a redirect-friendly error for actions. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/**
 * Page-level auth guard. Layouts and pages render concurrently in the App
 * Router, so a page must not rely on the layout's redirect: with no session
 * it would dereference null and crash the render. Every authenticated page
 * resolves its user through this.
 */
export async function requireUserPage(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function listSessions(userId: string) {
  return db.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, expiresAt: true, userAgent: true },
  });
}

export async function currentSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true },
  });
  return s?.id ?? null;
}
