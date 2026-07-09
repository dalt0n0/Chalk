import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { getEdition, getEntitlements } from "@/lib/edition";
import { PublishForm } from "./publish-form";
import { FormError } from "@/components/ui";

export const metadata = { title: "Publish program" };

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();
  const program = await db.program.findFirst({
    where: { id, userId: user.id },
  });
  if (!program) notFound();

  const ent = getEntitlements(user);
  const edition = getEdition();
  const federated =
    edition === "community" &&
    !!process.env.HUB_URL &&
    !!process.env.INSTANCE_API_KEY;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Publish “{program.name}”
        </h1>
        <p className="mt-1 text-muted">
          {federated
            ? "This instance publishes to the central community hub."
            : "Share this program in the community repository. Only the program definition is published. Your progression state stays private."}
        </p>
      </div>
      {ent.canPublish ? (
        <PublishForm programId={program.id} />
      ) : (
        <FormError>
          Publishing is not enabled for this account.
        </FormError>
      )}
    </div>
  );
}
