import "server-only";
import { db } from "@/lib/db";

export async function getAppSetting(key: string): Promise<string | null> {
  const row = await db.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await db.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Open unless an admin has closed it. */
export async function isRegistrationOpen(): Promise<boolean> {
  return (await getAppSetting("registration")) !== "closed";
}
