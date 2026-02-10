"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    key: "home",
    label: "Home",
    href: "/",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 10.5L12 4l8 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 9.8V19a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1V9.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "routine",
    label: "Routine",
    href: "/routine",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 12.5l2.6 2.6L16.2 9.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 4v2M16 4v2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "gym",
    label: "Gym",
    href: "/gym",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 9h14M5 15h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7 7v10M17 7v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="3"
          y="8"
          width="3"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="18"
          y="8"
          width="3"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    key: "recipes",
    label: "Recipes",
    href: "/recipes",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 3.5v8.5M10 3.5v8.5M6 7.8h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15.5 3.5v17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M19 3.5v6.5a2.5 2.5 0 0 1-5 0V3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "progress",
    label: "Progress",
    href: "/progress",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 19.5h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6.5 16l3.7-3.7 3.1 3.1 4.2-5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="6.5"
          cy="16"
          r="1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M19.2 15.2a7.6 7.6 0 0 0 .1-2.4l2-1.2-2-3.4-2.2.7a7.5 7.5 0 0 0-1.6-1l-.4-2.3h-4.2l-.4 2.3a7.5 7.5 0 0 0-1.6 1l-2.2-.7-2 3.4 2 1.2a7.6 7.6 0 0 0 0 2.4l-2 1.2 2 3.4 2.2-.7a7.5 7.5 0 0 0 1.6 1l.4 2.3h4.2l.4-2.3a7.5 7.5 0 0 0 1.6-1l2.2.7 2-3.4-2-1.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const isActiveRoute = (pathname: string, key: string) => {
  if (key === "home") {
    return (
      pathname === "/" ||
      pathname.startsWith("/guidance") ||
      pathname.startsWith("/health-plan")
    );
  }
  if (key === "routine") {
    return pathname.startsWith("/routine");
  }
  if (key === "gym") {
    return pathname.startsWith("/gym");
  }
  if (key === "recipes") {
    return pathname.startsWith("/recipes");
  }
  if (key === "progress") {
    return pathname.startsWith("/progress");
  }
  if (key === "settings") {
    return (
      pathname.startsWith("/settings") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/auth")
    );
  }
  return false;
};

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="mx-auto max-w-md px-5 pb-6">
        <div className="glass-card flex items-center justify-between rounded-3xl px-5 py-3">
          {navItems.map((item) => {
            const isActive = isActiveRoute(pathname ?? "", item.key);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[color:var(--text)]"
                    : "text-[color:var(--muted)]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border border-transparent transition-colors duration-200 ${
                    isActive
                      ? "bg-[color:var(--card-strong)] text-[color:var(--accent)]"
                      : "bg-transparent"
                  }`}
                >
                  <span className="h-5 w-5">{item.icon}</span>
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
