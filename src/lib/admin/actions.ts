"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { setAppSetting } from "./settings";

export type AdminFormState = {
  error?: string;
  message?: string;
  /** Shown exactly once after create/reset. */
  tempPassword?: string;
};

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

/** Readable random password, e.g. "kQ3xVb9TmP2w". */
function generatePassword(): string {
  return randomBytes(12)
    .toString("base64url")
    .replace(/[-_]/g, "")
    .slice(0, 14);
}

export async function adminCreateUser(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin access required." };

  const parsed = z
    .object({
      name: z.string().trim().min(1, "Name is required").max(100),
      email: z.string().trim().toLowerCase().email().max(254),
    })
    .safeParse({ name: formData.get("name"), email: formData.get("email") });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "A user with that email already exists." };

  const tempPassword = generatePassword();
  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(tempPassword),
    },
  });
  revalidatePath("/app/admin");
  return {
    message: `Account created for ${parsed.data.email}.`,
    tempPassword,
  };
}

export async function adminResetPassword(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin access required." };

  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const tempPassword = generatePassword();
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(tempPassword) },
    }),
    // Sign the user out everywhere; the temp password is the only way in.
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  return {
    message: `Password reset for ${user.email}. They are signed out everywhere.`,
    tempPassword,
  };
}

export async function adminSetRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) redirect("/app");

  const parsed = z
    .object({
      userId: z.string().min(1),
      role: z.enum(["user", "admin"]),
    })
    .safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) return;
  // No self-demotion: an instance must always keep at least this admin.
  if (parsed.data.userId === admin.id) return;

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/app/admin");
}

export async function adminDeleteUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) redirect("/app");

  const userId = String(formData.get("userId") ?? "");
  if (userId === admin.id) return; // delete your own account from Settings
  await db.user.deleteMany({ where: { id: userId } });
  revalidatePath("/app/admin");
}

export async function adminSetRegistration(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) redirect("/app");

  const value = String(formData.get("registration") ?? "");
  if (value !== "open" && value !== "closed") return;
  await setAppSetting("registration", value);
  revalidatePath("/app/admin");
  revalidatePath("/register");
}
