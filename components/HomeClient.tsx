"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ActionSection from "@/components/ActionSection";
import DailyFocus from "@/components/DailyFocus";
import DashboardSection from "@/components/DashboardSection";
import DaySummaryCard from "@/components/DaySummaryCard";
import GlassCard from "@/components/GlassCard";
import HeaderSection from "@/components/HeaderSection";
import HealthPanel from "@/components/HealthPanel";
import PrimaryActionSection from "@/components/PrimaryActionSection";
import RoutineSection from "@/components/RoutineSection";
import SummarySection from "@/components/SummarySection";

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const quickLinks = [
  { label: "Routine", href: "/routine", meta: "Plan the day" },
  { label: "Gym", href: "/gym", meta: "Workouts" },
  { label: "Recipes", href: "/recipes", meta: "Meals" },
  { label: "Progress", href: "/progress", meta: "Trends" },
];

export default function HomeClient() {
  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <HeaderSection />
      </motion.div>

      <motion.div variants={item}>
        <div className="grid gap-4">
          <DaySummaryCard />
          <SummarySection />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[color:var(--muted)]">
                Quick jump
              </div>
              <div className="text-sm font-semibold text-[color:var(--text)]">
                Move fast without losing focus
              </div>
            </div>
            <div className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[color:var(--muted)]">
              Today
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-strong)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40"
              >
                <div className="text-sm font-semibold text-[color:var(--text)]">
                  {item.label}
                </div>
                <div className="text-xs text-[color:var(--muted)]">
                  {item.meta}
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item}>
        <div className="grid gap-4 sm:grid-cols-2">
          <PrimaryActionSection />
          <DailyFocus />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <RoutineSection />
      </motion.div>

      <motion.div variants={item}>
        <DashboardSection />
      </motion.div>

      <motion.div variants={item}>
        <HealthPanel />
      </motion.div>

      <motion.div variants={item}>
        <ActionSection />
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[color:var(--muted)]">
              Guidance
            </div>
            <div className="text-sm font-semibold text-[color:var(--text)]">
              Diet + skin + hair plan
            </div>
          </div>
          <Link
            href="/guidance"
            className="text-xs font-semibold text-[color:var(--accent)]"
          >
            Open
          </Link>
        </GlassCard>
      </motion.div>

    </motion.div>
  );
}
