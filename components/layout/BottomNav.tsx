"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBookOpen,
  FiCheckSquare,
  FiHome,
  FiSettings,
  FiTrendingUp,
} from "react-icons/fi";
import { CgGym } from "react-icons/cg";


const navItems = [
  {
    key: "home",
    label: "Home",
    href: "/",
    icon: FiHome,
  },
  {
    key: "routine",
    label: "Routine",
    href: "/routine",
    icon: FiCheckSquare,
  },
  {
    key: "gym",
    label: "Gym",
    href: "/gym",
    icon: CgGym,
  },
  {
    key: "recipes",
    label: "Recipes",
    href: "/recipes",
    icon: FiBookOpen,
  },
  {
    key: "progress",
    label: "Progress",
    href: "/progress",
    icon: FiTrendingUp,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: FiSettings,
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

  if (
    pathname?.startsWith("/auth") ||
    pathname === "/welcome" ||
    pathname?.startsWith("/welcome/")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="mx-auto max-w-md px-5 pb-6">
        <div className="glass-card flex items-center justify-between rounded-3xl px-5 py-3">
          {navItems.map((item) => {
            const isActive = isActiveRoute(pathname ?? "", item.key);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border border-transparent transition-colors duration-200 ${
                    isActive
                      ? "bg-card-strong text-accent"
                      : "bg-transparent"
                  }`}
                >
                  <Icon className="text-lg" aria-hidden="true" />
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


