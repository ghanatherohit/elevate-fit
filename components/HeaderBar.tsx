"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HeaderBarProps = {
  greeting: string;
  name: string;
};

type SessionUser = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

export default function HeaderBar({ greeting, name }: HeaderBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as { user: SessionUser | null };
      setUser(data.user);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const displayName = user?.username || user?.name || name;

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--card-strong)] text-sm font-semibold text-[color:var(--text)]">
          EF
        </div>
        <div>
          <p className="text-xs text-[color:var(--muted)]">{greeting}</p>
          <p className="font-[var(--font-space)] text-lg font-semibold text-[color:var(--text)]">
            {displayName}
          </p>
        </div>
      </div>
      <button
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--muted)]"
        onClick={handleLogout}
      >
        Logout
      </button>
    </header>
  );
}
