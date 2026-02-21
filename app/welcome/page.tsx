import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";

export default function WelcomePage() {
  return (
    <DashboardShell>
      <div className="grid gap-6 pt-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-(--muted)">
            ElevateFit
          </p>
          <h1
            className="mt-3 text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-space)" }}
          >
            Calm skin. Strong hair. Steady gym.
          </h1>
          <p className="mt-3 text-sm text-(--muted)">
            A premium lifestyle companion that organizes your routines, gym
            sessions, and home recipes into one calm, focused flow.
          </p>
        </div>
        <GlassCard className="grid gap-4">
          <div className="grid gap-2 text-sm text-foreground">
            <div>• Daily routine with alarms and reminders</div>
            <div>• Skin & hair nutrition insights</div>
            <div>• Workout splits + protein guidance</div>
            <div>• Recipes by meal with benefits</div>
          </div>
          <div className="grid gap-3">
            <Link
              href="/auth/login"
              className="rounded-2xl bg-(--accent)/15 px-4 py-3 text-center text-sm font-semibold text-(--accent)"
            >
              Sign in
            </Link>
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}

