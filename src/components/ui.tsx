import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// --------------------------------------------------------------- buttons

const buttonVariants = {
  primary:
    "bg-accent text-black font-semibold hover:bg-accent-strong active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-text border border-border-strong hover:bg-surface-3",
  ghost: "text-muted hover:text-text hover:bg-surface-2",
  danger:
    "bg-danger-soft text-danger border border-danger/30 hover:bg-danger/20",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function buttonClass({
  variant = "primary",
  size = "md",
}: ButtonStyleProps = {}) {
  return cx(
    "inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    buttonVariants[variant],
    buttonSizes[size]
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return (
    <button
      {...props}
      className={cx(buttonClass({ variant, size }), className)}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return (
    <Link {...props} className={cx(buttonClass({ variant, size }), className)} />
  );
}

// ----------------------------------------------------------------- cards

export function Card({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-xl border border-border bg-surface p-5",
        className
      )}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      {...props}
      className={cx("text-sm font-semibold tracking-wide text-muted uppercase", className)}
    />
  );
}

// ----------------------------------------------------------------- forms

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cx("block text-sm font-medium text-muted mb-1.5", className)}
    />
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted/60 outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20 transition-colors";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(inputClass, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(inputClass, className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(inputClass, "appearance-none", className)} />;
}

// ---------------------------------------------------------------- badges

const badgeVariants = {
  neutral: "bg-surface-3 text-muted",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
} as const;

export function Badge({
  variant = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: keyof typeof badgeVariants }) {
  return (
    <span
      {...props}
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
    />
  );
}

// -------------------------------------------------------------- feedback

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

export function FormSuccess({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm text-success">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface/50 px-6 py-12 text-center">
      <p className="text-base font-medium">{title}</p>
      {children && <p className="mt-1.5 text-sm text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

// ----------------------------------------------------------------- brand

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-black text-black shadow-[0_0_12px_rgba(232,227,216,0.25)]"
      >
        C
      </span>
      <span className="text-lg">Chalk</span>
    </span>
  );
}
