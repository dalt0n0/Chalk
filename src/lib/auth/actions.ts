"use server";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { isRegistrationOpen } from "@/lib/admin/settings";
import { rateLimit } from "@/lib/rate-limit";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  getCurrentUser,
} from "./session";

export type AuthFormState = { error?: string; message?: string };

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200);

async function clientKey(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

export async function register(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const key = await clientKey();
  const rl = rateLimit(`register:${key}`, 10, 60 * 60 * 1000);
  if (!rl.ok)
    return { error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` };

  const parsed = z
    .object({
      name: z.string().trim().min(1, "Name is required").max(100),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { name, email, password } = parsed.data;

  // The very first account bootstraps as admin and always registers, even
  // when an admin later closes public registration.
  const userCount = await db.user.count();
  if (userCount > 0 && !(await isRegistrationOpen()))
    return {
      error:
        "Registration is closed on this instance. Ask your administrator for an account.",
    };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: userCount === 0 ? "admin" : "user",
    },
  });
  const h = await headers();
  await createSession(user.id, h.get("user-agent") ?? undefined);
  redirect("/app");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const key = await clientKey();
  const rl = rateLimit(`login:${key}`, 10, 15 * 60 * 1000);
  if (!rl.ok)
    return { error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` };

  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1).max(200) })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: "Invalid email or password." };

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  // Always run a hash comparison so response timing doesn't reveal
  // whether the account exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Invalid email or password." };

  const h = await headers();
  await createSession(user.id, h.get("user-agent") ?? undefined);
  redirect("/app");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const key = await clientKey();
  const rl = rateLimit(`pwreset:${key}`, 5, 60 * 60 * 1000);
  if (!rl.ok)
    return { error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` };

  const parsed = emailSchema.safeParse(formData.get("email"));
  // Uniform response regardless of whether the account exists.
  const done = {
    message: "If an account exists for that email, a reset link has been sent.",
  };
  if (!parsed.success) return done;

  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: {
        tokenHash: createHash("sha256").update(token).digest("hex"),
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    // No SMTP configured in the demo: surface the link in server logs.
    // Production wires this to the mailer (see docs/SELF_HOSTING.md).
    console.log(
      `[mail] Password reset for ${user.email}: /reset-password/${token}`
    );
  }
  return done;
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = z
    .object({ token: z.string().min(10).max(200), password: passwordSchema })
    .safeParse({
      token: formData.get("token"),
      password: formData.get("password"),
    });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const tokenHash = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record || record.usedAt || record.expiresAt < new Date())
    return { error: "This reset link is invalid or has expired." };

  await db.$transaction([
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  return { message: "Password updated. You can now sign in." };
}

export async function changePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const parsed = z
    .object({
      current: z.string().min(1).max(200),
      next: passwordSchema,
    })
    .safeParse({
      current: formData.get("current"),
      next: formData.get("next"),
    });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ok = await verifyPassword(parsed.data.current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });
  await destroyAllSessions(user.id);
  redirect("/login?reset=1");
}
