import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import { ProgramEditor } from "@/components/editor/ProgramEditor";

export const metadata = { title: "Edit program" };

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const program = await db.program.findFirst({
    where: { id, userId: user.id },
  });
  if (!program) notFound();
  const ent = getEntitlements(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit: {program.name}
        </h1>
        <p className="mt-1 text-muted">
          Changes keep your current progression state for matching exercises.
        </p>
      </div>
      <ProgramEditor
        mode="edit"
        programId={program.id}
        initialYaml={program.sourceYaml}
        scriptsAllowed={ent.customScripts}
        defaultUnit={user.unit === "kg" ? "kg" : "lb"}
      />
    </div>
  );
}
