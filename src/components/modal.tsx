"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  /** Label of the button that opens the dialog. */
  trigger: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerSize?: "sm" | "md" | "lg";
  triggerClassName?: string;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  cancelLabel?: string;
} & (
  | {
      /** Server action to run on confirm, with hidden fields. */
      action: (formData: FormData) => void | Promise<void>;
      fields?: Record<string, string>;
      onConfirm?: never;
    }
  | {
      onConfirm: () => void;
      action?: never;
      fields?: never;
    }
);

export function ConfirmDialog({
  trigger,
  triggerVariant = "secondary",
  triggerSize = "sm",
  triggerClassName,
  title,
  body,
  confirmLabel,
  confirmVariant = "danger",
  cancelLabel = "Keep going",
  action,
  fields,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </Button>
          {action ? (
            <form ref={formRef} action={action}>
              {Object.entries(fields ?? {}).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button
                type="submit"
                className={buttonClass({ variant: confirmVariant, size: "sm" })}
              >
                {confirmLabel}
              </button>
            </form>
          ) : (
            <Button
              type="button"
              variant={confirmVariant}
              size="sm"
              onClick={() => {
                setOpen(false);
                onConfirm?.();
              }}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
