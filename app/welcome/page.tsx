"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AuthShell from "@/components/auth/AuthShell";
import AuthVisual from "@/components/auth/AuthVisual";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function WelcomePage() {
  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-between gap-10">
        <section className="grid gap-8">
          <motion.p
            className="pr-14 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            ElevateFit
          </motion.p>

          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <AuthVisual />
          </motion.div>

          <motion.div
            className="grid gap-3"
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <h1 className="max-w-[18ch] font-display text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
              Calm skin. Strong hair. Steady gym.
            </h1>
            <p className="max-w-[36ch] text-sm leading-relaxed text-muted">
              One focused flow for routines, workouts, and home recipes — built
              to feel calm, not crowded.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-3"
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <Link
              href="/auth/login"
              className="rounded-[var(--radius)] bg-accent px-5 py-3.5 text-center text-sm font-semibold text-[var(--bg)] transition hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-[var(--radius)] border border-border bg-card/60 px-5 py-3.5 text-center text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-accent/40"
            >
              Create account
            </Link>
          </motion.div>
        </section>

        <motion.section
          className="grid gap-4 border-t border-border pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">
            What you get
          </h2>
          <ul className="grid gap-3 text-sm text-muted">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Daily routine with reminders that stay out of the way
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Gym splits and protein guidance in one place
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Home recipes mapped to skin, hair, and recovery
            </li>
          </ul>
        </motion.section>
      </div>
    </AuthShell>
  );
}
