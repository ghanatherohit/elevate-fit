import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";
import Link from "next/link";

const issues = [
  {
    title: "Acne + acne marks",
    causes: "Inflammation, excess oil, insulin spikes, stress, friction.",
    nutrients: "Zinc, vitamin A (food), vitamin D, omega-3, antioxidants.",
    foods: "Pumpkin seeds, spinach, carrots, berries, fatty fish.",
    avoid: "Sugary drinks, high glycemic snacks, harsh scrubs, sweaty fabric.",
  },
  {
    title: "Hair fall + greying",
    causes: "Stress, low protein, iron/B12/D deficiency, inflammation.",
    nutrients: "Protein, iron, B12, biotin, selenium, omega-3.",
    foods: "Eggs, dal, spinach, nuts, fish, paneer.",
    avoid: "Sleep debt, crash diets, high stress.",
  },
];

const dietPlan = [
  {
    title: "Morning",
    items: "Warm water + lemon, soaked nuts, veggie oats + eggs/paneer.",
  },
  {
    title: "Midday",
    items: "Fruit + green tea, brown rice + dal + greens + salad.",
  },
  {
    title: "Pre-workout",
    items: "Banana + peanut butter or light carbs 45-60 min before.",
  },
  {
    title: "Post-workout",
    items: "Whey isolate or paneer + fruit within 30 minutes.",
  },
  {
    title: "Dinner",
    items: "Lean protein + vegetables, light carbs if needed.",
  },
  {
    title: "Night",
    items: "Turmeric milk or chamomile tea, sleep 7-8 hours.",
  },
];

export default function GuidancePage() {
  return (
    <DashboardShell>
      <SectionHeader title="Health guidance" action="Daily" />
      <div className="grid gap-4">
        {issues.map((issue) => (
          <GlassCard key={issue.title} className="grid gap-3">
            <div className="text-sm font-semibold text-foreground">
              {issue.title}
            </div>
            <div className="text-xs text-muted">
              Root causes: {issue.causes}
            </div>
            <div className="text-xs text-muted">
              Nutrients: {issue.nutrients}
            </div>
            <div className="text-xs text-muted">
              Food sources: {issue.foods}
            </div>
            <div className="text-xs text-muted">
              Avoid: {issue.avoid}
            </div>
          </GlassCard>
        ))}
        <GlassCard className="grid gap-3">
          <div className="text-sm font-semibold text-foreground">
            Full-day diet plan
          </div>
          {dietPlan.map((item) => (
            <div key={item.title} className="grid gap-1">
              <div className="text-xs text-muted">
                {item.title}
              </div>
              <div className="text-sm text-foreground">
                {item.items}
              </div>
            </div>
          ))}
          <Link
            href="/health-plan"
            className="text-xs font-semibold text-accent"
          >
            Edit your plan
          </Link>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}


