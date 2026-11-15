"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOverlayLock } from "@/components/shared/OverlayLock";

type OverlaySheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Wider sheet for denser forms (reminders, diet profile). */
  size?: "md" | "lg";
  /** Close when backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Show the header Close control. Default true. */
  showClose?: boolean;
};

/**
 * Shared overlay for create/edit flows that should NOT expand existing page blocks.
 *
 * Portaled to document.body so bottom nav / page transforms cannot cover it.
 *
 * Use OverlaySheet when:
 * - adding / editing / confirming something temporary
 * - the form would push or reshape a stable browsing surface
 *
 * Keep inline when:
 * - the content itself is the browse target (accordions, tabs, filters)
 * - the panel is a dedicated primary workspace (Progress day edits, detail editors)
 */
export default function OverlaySheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  closeOnBackdrop = true,
  showClose = true,
}: OverlaySheetProps) {
  const [mounted, setMounted] = useState(false);
  const maxWidth = size === "lg" ? "max-w-3xl" : "max-w-md";

  useOverlayLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--scrim)] p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdrop ? onClose : undefined}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`glass-card w-full ${maxWidth} max-h-[min(90vh,720px)] overflow-y-auto p-5 themed-scroll`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {subtitle ? <div className="type-meta">{subtitle}</div> : null}
                <div className="type-title">{title}</div>
              </div>
              {showClose ? (
                <button
                  type="button"
                  className="soft-chip shrink-0 px-2.5 py-1 type-meta"
                  onClick={onClose}
                >
                  Close
                </button>
              ) : null}
            </div>
            <div className="type-body mt-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
