import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";

export default function WelcomePage() {
  return (
    <DashboardShell>
      <div className="grid gap-6 pt-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
            ElevateFit
          </p>
          <h1 className="mt-3 font-[var(--font-space)] text-3xl font-semibold text-[color:var(--text)]">
            Calm skin. Strong hair. Steady gym.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            A premium lifestyle companion that organizes your routines, gym
            sessions, and home recipes into one calm, focused flow.
          </p>
        </div>
        <GlassCard className="grid gap-4">
          <div className="grid gap-2 text-sm text-[color:var(--text)]">
            <div>• Daily routine with alarms and reminders</div>
            <div>• Skin & hair nutrition insights</div>
            <div>• Workout splits + protein guidance</div>
            <div>• Recipes by meal with benefits</div>
          </div>
          <div className="grid gap-3">
            <Link
              href="/auth/login"
              className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-center text-sm font-semibold text-[color:var(--accent)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-center text-sm text-[color:var(--text)]"
            >
              Create account
            </Link>
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
