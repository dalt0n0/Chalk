"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">
        Something broke
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        This page hit an error
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        The details are in the server log. Self-hosting? Run{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
          journalctl -u chalk -e
        </code>{" "}
        and look for the digest below.
      </p>
      {error.digest && (
        <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-muted">
          digest: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/app" variant="secondary">
          Back to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
