"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, currentSessionId, destroyAllSessions } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export type SettingsFormState = { error?: string; message?: string };

export async function updateProfile(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(100),
      unit: z.enum(["lb", "kg"]),
    })
    .safeParse({ name: formData.get("name"), unit: formData.get("unit") });
  if (!parsed.success) return { error: "Invalid input." };

  await db.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  revalidatePath("/app", "layout");
  return { message: "Profile updated." };
}

export async function revokeOtherSessions(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const keep = await currentSessionId();
  await db.session.deleteMany({
    where: { userId: user.id, ...(keep ? { id: { not: keep } } : {}) },
  });
  revalidatePath("/app/settings");
}

export async function deleteAccount(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const password = String(formData.get("password") ?? "");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Password is incorrect." };

  await destroyAllSessions(user.id);
  // Cascades wipe sessions, programs, workouts, metrics. Community programs
  // the user published stay up (author field), matching repo semantics.
  await db.user.delete({ where: { id: user.id } });
  redirect("/");
}

