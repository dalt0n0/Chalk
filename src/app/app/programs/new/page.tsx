import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/edition";
import { ProgramEditor } from "@/components/editor/ProgramEditor";

export const metadata = { title: "New program" };

export default async function NewProgramPage() {
  const user = (await getCurrentUser())!;
  const ent = getEntitlements(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New program</h1>
        <p className="mt-1 text-muted">
          Build with blocks, or switch to YAML and paste an existing program.
          Prefer a head start?{" "}
          <Link href="/community" className="text-accent hover:underline">
            Import from the community
          </Link>
          .
        </p>
      </div>
      <ProgramEditor
        mode="create"
        scriptsAllowed={ent.customScripts}
        defaultUnit={user.unit === "kg" ? "kg" : "lb"}
      />
    </div>
  );
}
