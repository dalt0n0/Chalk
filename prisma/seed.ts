/**
 * Seed: official community programs + a demo account.
 * Run: npm run db:seed
 */
import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRESETS } from "../src/lib/community/presets";
import { parseProgram, initialState } from "../src/lib/engine/program";

const db = new PrismaClient();

async function main() {
  // Official programs
  for (const preset of PRESETS) {
    const parsed = parseProgram(preset.yaml);
    if (!parsed.ok) {
      throw new Error(
        `Preset ${preset.slug} failed validation:\n${parsed.errors.join("\n")}`
      );
    }
    await db.communityProgram.upsert({
      where: { slug: preset.slug },
      update: {
        name: preset.name,
        description: preset.description,
        author: preset.author,
        sourceYaml: preset.yaml,
        tags: preset.tags,
        isOfficial: true,
      },
      create: {
        slug: preset.slug,
        name: preset.name,
        description: preset.description,
        author: preset.author,
        sourceYaml: preset.yaml,
        tags: preset.tags,
        isOfficial: true,
      },
    });
    console.log(`seeded program: ${preset.slug}`);
  }

  // Demo account and demo federation instance are opt-in: they use known
  // credentials, so production instances must not seed them.
  if (process.env.SEED_DEMO !== "1") {
    console.log("Skipped demo data (set SEED_DEMO=1 to include it).");
    return;
  }

  // Demo account (pro plan) with StrongLifts active
  const demoEmail = "demo@chalk.local";
  // Migrate the old demo email if a previous seed created it
  await db.user
    .update({
      where: { email: "demo@liftforge.local" },
      data: { email: demoEmail },
    })
    .catch(() => {});
  const existing = await db.user.findUnique({ where: { email: demoEmail } });
  if (existing && existing.role !== "admin") {
    await db.user.update({
      where: { id: existing.id },
      data: { role: "admin" },
    });
    console.log("promoted demo user to admin");
  }
  if (!existing) {
    const user = await db.user.create({
      data: {
        email: demoEmail,
        name: "Demo Lifter",
        passwordHash: await bcrypt.hash("demo-password-123", 12),
        plan: "pro",
        role: "admin",
        emailVerified: true,
      },
    });
    const sl = PRESETS.find((p) => p.slug === "stronglifts-5x5")!;
    const parsed = parseProgram(sl.yaml);
    if (parsed.ok) {
      await db.program.create({
        data: {
          userId: user.id,
          name: parsed.program.name,
          description: parsed.program.description ?? "",
          sourceYaml: sl.yaml,
          state: JSON.stringify(initialState(parsed.program)),
          isActive: true,
          sourceSlug: sl.slug,
        },
      });
    }
    console.log(`seeded demo user: ${demoEmail} / demo-password-123`);
  }

  // Approved demo federation instance (key printed once)
  const instanceName = "Demo CE Instance";
  const existingInstance = await db.instance.findFirst({
    where: { name: instanceName },
  });
  if (!existingInstance) {
    const apiKey = `lfi_${randomBytes(32).toString("base64url")}`;
    await db.instance.create({
      data: {
        name: instanceName,
        url: "http://localhost:3001",
        apiKeyHash: createHash("sha256").update(apiKey).digest("hex"),
        approved: true,
      },
    });
    console.log(`seeded approved instance "${instanceName}"`);
    console.log(`  INSTANCE_API_KEY=${apiKey}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    return db.$disconnect().then(() => process.exit(1));
  });
