/**
 * Reset a user's password from the server shell. No email required.
 *
 *   npm run user:reset-password -- user@example.com
 *   npm run user:reset-password -- user@example.com --password "NewPass123!"
 *
 * Generates a temporary password unless --password is given, updates the
 * account, and signs the user out everywhere. Run from the install
 * directory (script installs: cd /opt/chalk first).
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function usage(): never {
  console.error(
    'Usage: npm run user:reset-password -- <email> [--password "<new password>"]'
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  if (!email || !email.includes("@")) usage();

  let password: string;
  const pwFlag = args.indexOf("--password");
  if (pwFlag !== -1) {
    password = args[pwFlag + 1] ?? "";
    if (password.length < 10) {
      console.error("Password must be at least 10 characters.");
      process.exit(1);
    }
  } else {
    password = randomBytes(12).toString("base64url").replace(/[-_]/g, "").slice(0, 14);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  console.log(`Password reset for ${user.email} (${user.name}).`);
  if (pwFlag === -1) console.log(`Temporary password: ${password}`);
  console.log("All sessions for this account were signed out.");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    return db.$disconnect().then(() => process.exit(1));
  });
