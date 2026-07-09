"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateProgram } from "@/lib/community/actions";

/** Read-only average display, e.g. on cards. */
export function StarRating({
  avg,
  count,
  className,
}: {
  avg: number | null;
  count: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-1 text-xs text-muted ${className ?? ""}`}>
      <Star
        className={`h-3.5 w-3.5 ${count > 0 ? "fill-accent text-accent" : "text-muted/50"}`}
      />
      {count > 0 ? (
        <>
          <span className="font-medium text-text">{avg?.toFixed(1)}</span>
          <span>({count})</span>
        </>
      ) : (
        <span>No ratings</span>
      )}
    </span>
  );
}

/** Interactive 1-5 star picker; submits the rateProgram action. */
export function RateProgram({
  slug,
  myStars,
  signedIn,
}: {
  slug: string;
  myStars: number | null;
  signedIn: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [optimistic, setOptimistic] = useState<number | null>(null);
  const [, startSubmit] = useTransition();
  const shown = hover ?? optimistic ?? myStars ?? 0;

  if (!signedIn)
    return (
      <p className="text-xs text-muted">
        <a href={`/login?next=/community/${slug}`} className="text-accent hover:underline">
          Sign in
        </a>{" "}
        to rate this program.
      </p>
    );

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => {
            setOptimistic(n);
            const fd = new FormData();
            fd.set("slug", slug);
            fd.set("stars", String(n));
            startSubmit(() => rateProgram(fd));
          }}
          className="p-0.5"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              n <= shown ? "fill-accent text-accent" : "text-muted/40 hover:text-muted"
            }`}
          />
        </button>
      ))}
      {(optimistic ?? myStars) && (
        <span className="ml-1 text-xs text-muted">Your rating</span>
      )}
    </div>
  );
}
