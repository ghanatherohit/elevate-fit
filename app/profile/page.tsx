"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import GlassCard from "@/components/shared/GlassCard";
import SectionHeader from "@/components/shared/SectionHeader";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { getUsernameHint } from "@/lib/validation/username";
import { getFirstZodError, profileFormSchema } from "@/lib/validation/schemas";

type SessionUser = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as { user: SessionUser | null };
      setUser(data.user);
      setUsername(data.user?.username ?? "");
      setName(data.user?.name ?? "");
      setPhotoURL(data.user?.photoURL ?? "");
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setStatus(null);
    setError(null);

    const parsed = profileFormSchema.safeParse({ username, name, photoURL });
    if (!parsed.success) {
      setError(getFirstZodError(parsed.error));
      return;
    }

    const { username: normalized, name: nextName, photoURL: nextPhotoURL } = parsed.data;

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: normalized,
        name: nextName,
        photoURL: nextPhotoURL,
      }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error || "Update failed");
      return;
    }

    const body = (await response.json()) as { user: SessionUser };
    setUser(body.user);
    setStatus("Profile updated");
  };

  return (
    <DashboardShell>
      <SectionHeader title="Profile" action="Session" />
      <GlassCard className="grid gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-(--border) bg-(--card-strong) text-xs text-(--muted)">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              "EF"
            )}
          </div>
          <div className="text-xs text-(--muted)">
            Preview
          </div>
        </div>
        {user?.uid ? (
          <AvatarUpload
            uid={user.uid}
            onUploaded={(url) => setPhotoURL(url)}
          />
        ) : null}
        {user?.photoURL ? (
          <button
            className="rounded-2xl border border-(--border) bg-(--card) px-4 py-3 text-left text-sm text-foreground"
            onClick={() => setPhotoURL(user.photoURL ?? "")}
          >
            Use Google photo
          </button>
        ) : null}
        <div className="grid gap-2">
          <label className="text-xs text-(--muted)">Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-2xl border border-(--border) bg-(--card) px-4 py-3 text-sm text-foreground"
          />
          <div className="text-[10px] text-(--muted)">
            {getUsernameHint()}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-(--muted)">Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-(--border) bg-(--card) px-4 py-3 text-sm text-foreground"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-(--muted)">Avatar URL</label>
          <input
            value={photoURL}
            onChange={(event) => setPhotoURL(event.target.value)}
            className="rounded-2xl border border-(--border) bg-(--card) px-4 py-3 text-sm text-foreground"
          />
        </div>
        <div className="text-xs text-(--muted)">
          Email: {user?.email || "Not set"}
        </div>
        {error ? (
          <div className="rounded-2xl border border-(--border) bg-(--card) px-4 py-2 text-xs text-(--accent)">
            {error}
          </div>
        ) : null}
        {status ? (
          <div className="rounded-2xl border border-(--border) bg-(--card) px-4 py-2 text-xs text-(--muted)">
            {status}
          </div>
        ) : null}
        <button
          className="rounded-2xl bg-(--accent)/15 px-4 py-3 text-sm font-semibold text-(--accent)"
          onClick={handleSave}
        >
          Save profile
        </button>
      </GlassCard>
    </DashboardShell>
  );
}

