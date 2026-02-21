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
  const [avatarError, setAvatarError] = useState(false);

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
  const avatarUrl = user?.photoURL || null;
  const showAvatar = Boolean(avatarUrl) && !avatarError;

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showAvatar ? (
          <img
            src={avatarUrl as string}
            alt={displayName}
            className="h-11 w-11 rounded-2xl border border-border object-cover"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card-strong text-sm font-semibold text-foreground">
            EF
          </div>
        )}
        <div>
          <p className="text-xs text-muted">{greeting}</p>
          <p className="font-display text-lg font-semibold text-foreground">
            {displayName}
          </p>
        </div>
      </div>
      <button
        className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted"
        onClick={handleLogout}
      >
        Logout
      </button>
    </header>
  );
}


