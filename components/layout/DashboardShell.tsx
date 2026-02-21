"use client";

import { usePathname, useRouter } from "next/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const showBackButton =
    pathname !== "/" &&
    !pathname?.startsWith("/auth") &&
    pathname !== "/welcome" &&
    !pathname?.startsWith("/welcome/");

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 pb-28 pt-6">
        {showBackButton ? (
          <div className="sticky top-4 z-30">
            <button
              onClick={handleBack}
              className="rounded-2xl border border-border bg-card px-4 py-2 text-xs font-medium text-muted transition hover:border-accent/30 hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}


