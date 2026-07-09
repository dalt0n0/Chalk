import type { User } from "@prisma/client";

/**
 * Community Edition: every feature is enabled for every account.
 * This module keeps the entitlements interface used across the app.
 */
export type Edition = "community";

export function getEdition(): Edition {
  return "community";
}

export type Entitlements = {
  plan: "community";
  maxPrograms: number | null; // null = unlimited
  customScripts: boolean;
  historyDays: number | null;
  canPublish: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept stable for all callers
export function getEntitlements(_user: Pick<User, "plan"> | null): Entitlements {
  return {
    plan: "community",
    maxPrograms: null,
    customScripts: true,
    historyDays: null,
    canPublish: true,
  };
}
