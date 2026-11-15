"use client";

import { motion } from "framer-motion";

/** Abstract fitness atmosphere — theme-token driven, no stock photos. */
export default function AuthVisual() {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-border"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--card)_0%,var(--bg-elevated)_45%,var(--card-strong)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--ambient-1),transparent_55%),radial-gradient(ellipse_at_80%_70%,var(--ambient-2),transparent_50%)]" />

      <motion.div
        className="absolute left-[12%] top-[18%] h-28 w-28 rounded-full border border-accent/30 bg-accent/10 soft-glow"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[22%] right-[10%] h-40 w-40 rounded-[var(--radius-lg)] border border-accent-2/25 bg-accent-2/10"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[28%] top-[42%] h-16 w-16 rotate-12 border border-border bg-card/40 backdrop-blur-sm"
        style={{ borderRadius: "var(--radius)" }}
        animate={{ rotate: [12, 18, 12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_55%,transparent)] to-transparent px-5 pb-5 pt-16">
        <div className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Routine.
          <br />
          Training.
          <br />
          Nourish.
        </div>
      </div>
    </div>
  );
}
