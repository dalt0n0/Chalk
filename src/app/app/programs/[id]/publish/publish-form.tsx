"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { publishProgram, type PublishFormState } from "@/lib/community/actions";
import { Button, FormError, Input, Label } from "@/components/ui";

export function PublishForm({ programId }: { programId: string }) {
  const [state, action, pending] = useActionState<PublishFormState, FormData>(
    publishProgram,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <FormError>{state.error}</FormError>
      <input type="hidden" name="id" value={programId} />
      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="strength, barbell, 4-day"
          maxLength={200}
        />
        <p className="mt-1.5 text-xs text-muted">
          Up to 8 tags to help lifters find your program.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        <Upload className="h-4 w-4" />
        {pending ? "Publishing…" : "Publish program"}
      </Button>
    </form>
  );
}
