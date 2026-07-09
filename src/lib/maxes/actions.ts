"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export type MaxFormState = { error?: string; message?: string };

const maxSchema = z.object({
  name: z.string().trim().min(1, "Exercise name is required").max(80),
  value: z.coerce.number().positive("Weight must be above zero").max(5000),
});

/** Create or update a manual 1RM entry (unique per exercise name). */
export async function saveUserMax(
  _prev: MaxFormState,
  formData: FormData
): Promise<MaxFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const parsed = maxSchema.safeParse({
    name: formData.get("name"),
    value: formData.get("value"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const value = Math.round(parsed.data.value * 100) / 100;
  await db.userMax.upsert({
    where: { userId_name: { userId: user.id, name: parsed.data.name } },
    update: { value },
    create: { userId: user.id, name: parsed.data.name, value },
  });
  revalidatePath("/app/records");
  return { message: "Saved." };
}

export async function deleteUserMax(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await db.userMax.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/records");
}
