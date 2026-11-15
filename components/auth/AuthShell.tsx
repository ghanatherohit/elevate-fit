"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SketchbookThemeOrb from "@/components/auth/SketchbookThemeOrb";

type AuthShellProps = {
  children: React.ReactNode;
  /** Compact top brand link for form pages */
  showBrandLink?: boolean;
};

export default function AuthShell({
  children,
  showBrandLink = false,
}: AuthShellProps) {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-24 top-[-10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,var(--ambient-1),transparent_68%)] blur-2xl" />
        <div className="absolute -right-16 bottom-[-5%] h-[48vh] w-[48vh] rounded-full bg-[radial-gradient(circle,var(--ambient-2),transparent_70%)] blur-2xl" />
        <div className="hero-panel absolute inset-x-0 top-0 h-[58vh] opacity-60" />
      </div>

      <SketchbookThemeOrb />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-10 pt-8 sm:px-6 sm:pt-12">
        {showBrandLink ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 pr-14"
          >
            <Link
              href="/welcome"
              className="font-display text-lg font-semibold tracking-wide text-foreground transition hover:text-accent"
            >
              ElevateFit
            </Link>
          </motion.div>
        ) : (
          <div className="mb-2 h-2 pr-14" aria-hidden />
        )}
        {children}
      </div>
    </div>
  );
}
