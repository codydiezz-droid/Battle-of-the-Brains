import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "../lib/cx";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/**
 * Thin wrapper around the native <dialog> element: it traps focus, closes on
 * Escape, returns focus to the trigger, and closes when the backdrop is clicked.
 */
export function Dialog({ open, onClose, labelledBy, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx("m-auto max-h-none max-w-none bg-transparent p-0", className)}
    >
      {open && children}
    </dialog>
  );
}
