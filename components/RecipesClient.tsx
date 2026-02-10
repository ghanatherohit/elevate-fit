"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { recipes } from "@/lib/data/recipes";

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
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const sections = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
] as const;

export default function RecipesClient() {
  const byMeal = {
    Breakfast: recipes.filter((item) => item.meal === "Breakfast"),
    Lunch: recipes.filter((item) => item.meal === "Lunch"),
    Dinner: recipes.filter((item) => item.meal === "Dinner"),
  };

  return (
    <motion.div
      className="grid gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHeader title="Recipes" action="Meal plan" />
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[color:var(--muted)]">
                Goals aligned
              </div>
              <div className="text-sm font-semibold text-[color:var(--text)]">
                Fat loss, muscle gain, energy, skin & gut support
              </div>
            </div>
            <div className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[color:var(--muted)]">
              9 recipes
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--card-strong)] px-3 py-1 text-[10px] text-[color:var(--muted)] transition hover:border-[color:var(--accent)]/40"
              >
                {section.label}
              </a>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {sections.map((section) => (
        <motion.div key={section.id} variants={item} id={section.id}>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[color:var(--text)]">
                {section.label}
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                {byMeal[section.label].length} recipes
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {byMeal[section.label].map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-4 text-sm transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40"
                >
                  <div className="text-xs text-[color:var(--muted)]">
                    {recipe.protein} protein
                  </div>
                  <div className="text-sm font-semibold text-[color:var(--text)]">
                    {recipe.title}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    {recipe.benefits}
                  </div>
                  <div className="mt-3 text-[10px] text-[color:var(--accent)]">
                    View recipe
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

    </motion.div>
  );
}
