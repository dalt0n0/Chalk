"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export type MetricFormState = { error?: string; message?: string };

export async function addBodyMetric(
  _prev: MetricFormState,
  formData: FormData
): Promise<MetricFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const parsed = z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weight: z
        .string()
        .transform((v) => (v.trim() === "" ? null : Number(v)))
        .pipe(z.number().min(20).max(2000).nullable()),
      bodyFatPct: z
        .string()
        .transform((v) => (v.trim() === "" ? null : Number(v)))
        .pipe(z.number().min(1).max(75).nullable()),
      notes: z.string().max(500).default(""),
    })
    .safeParse({
      date: formData.get("date"),
      weight: formData.get("weight") ?? "",
      bodyFatPct: formData.get("bodyFatPct") ?? "",
      notes: formData.get("notes") ?? "",
    });
  if (!parsed.success)
    return { error: "Check the values. Weight and body fat look invalid." };
  const { date, weight, bodyFatPct, notes } = parsed.data;
  if (weight === null && bodyFatPct === null)
    return { error: "Enter a weight, a body fat %, or both." };

  await db.bodyMetric.create({
    data: {
      userId: user.id,
      date: new Date(`${date}T12:00:00`),
      weight,
      bodyFatPct,
      notes,
    },
  });
  revalidatePath("/app/metrics");
  return { message: "Logged." };
}

export async function deleteBodyMetric(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await db.bodyMetric.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/metrics");
}
