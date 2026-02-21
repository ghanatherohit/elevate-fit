"use client";

import { motion } from "framer-motion";
import RemindersPanel from "@/components/routine/RemindersPanel";
import RoutineDietPlan from "@/components/routine/RoutineDietPlan";
import RoutineSection from "@/components/routine/RoutineSection";
import SectionHeader from "@/components/shared/SectionHeader";

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function RoutineClient() {
  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHeader title="Routine" />
      </motion.div>

      <motion.div variants={item}>
        <RemindersPanel />
      </motion.div>

      <motion.div variants={item}>
        <RoutineSection />
      </motion.div>

      <motion.div variants={item}>
        <RoutineDietPlan />
      </motion.div>

    </motion.div>
  );
}

