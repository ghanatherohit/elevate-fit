"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import RemindersPanel from "@/components/routine/RemindersPanel";
import RoutineSection from "@/components/routine/RoutineSection";
import SectionHeader from "@/components/shared/SectionHeader";

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type RoutineTab = "schedule" | "reminders";

const tabs: Array<{ id: RoutineTab; label: string; hint: string }> = [
  { id: "schedule", label: "Schedule", hint: "Day checklist" },
  { id: "reminders", label: "Reminders", hint: "Alerts" },
];

export default function RoutineClient() {
  const [tab, setTab] = useState<RoutineTab>("schedule");

  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHeader title="Routine" action="Daily rhythm" />
      </motion.div>

      <motion.div variants={item}>
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl bg-card-strong/40 p-1"
          role="tablist"
          aria-label="Routine sections"
        >
          {tabs.map((entry) => {
            const active = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(entry.id)}
                className={`rounded-xl px-2 py-2.5 text-center transition sm:px-3 ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <div className="type-heading">{entry.label}</div>
                <div
                  className={`type-meta mt-0.5 ${
                    active ? "text-accent/80" : ""
                  }`}
                >
                  {entry.hint}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        key={tab}
        variants={item}
        initial="hidden"
        animate="show"
        role="tabpanel"
        aria-label={tabs.find((entry) => entry.id === tab)?.label}
      >
        {tab === "schedule" ? <RoutineSection /> : null}
        {tab === "reminders" ? <RemindersPanel /> : null}
      </motion.div>
    </motion.div>
  );
}
