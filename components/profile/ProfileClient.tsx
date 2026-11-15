"use client";

import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GlassCard from "@/components/shared/GlassCard";
import { DataList, DataRow } from "@/components/shared/DataSurfaces";
import DisabledWithHint, {
  getBlockReasons,
} from "@/components/shared/FormBlockHint";
import SectionHeader from "@/components/shared/SectionHeader";
import { firebaseAuth } from "@/lib/auth/firebase-client";
import { getFirstZodError, profileUpdateSchema } from "@/lib/validation/schemas";

type SessionUser = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const fieldClass =
  "w-full rounded-xl bg-card-strong/40 px-3 py-2.5 type-body text-foreground outline-none transition placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent/40";

/** Google avatar CDN hosts only — not every google.com URL. */
function isGooglePhotoUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith("googleusercontent.com") ||
      host.endsWith("ggpht.com")
    );
  } catch {
    return false;
  }
}

export default function ProfileClient() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [googlePhotoURL, setGooglePhotoURL] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setGooglePhotoURL(firebaseUser?.photoURL ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.status === 401) {
          router.replace("/welcome");
          return;
        }
        const data = (await response.json()) as { user: SessionUser | null };
        if (!data.user) {
          router.replace("/welcome");
          return;
        }
        setUser(data.user);
        setUsername(data.user.username ?? "");
        setName(data.user.name ?? "");
        setPhotoURL(data.user.photoURL ?? "");
      } catch {
        setToast({ type: "error", message: "Could not load profile" });
      } finally {
        setLoaded(true);
      }
    };
    void fetchProfile();
  }, [router]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const displayName = name.trim() || user?.name || "Your profile";
  const handle = username.trim()
    ? `@${username.trim().toLowerCase()}`
    : "Add a username";
  const initial = displayName.charAt(0).toUpperCase() || "E";

  const usingGoogle = Boolean(
    photoURL &&
      ((googlePhotoURL && photoURL === googlePhotoURL) ||
        isGooglePhotoUrl(photoURL)),
  );

  const handleUseGooglePhoto = () => {
    const googlePhoto = googlePhotoURL || firebaseAuth.currentUser?.photoURL;
    if (!googlePhoto) {
      setToast({
        type: "error",
        message:
          "No Google photo available. Sign in with Google once, then try again.",
      });
      return;
    }
    setGooglePhotoURL(googlePhoto);
    setPhotoURL(googlePhoto);
  };

  const handleSave = async () => {
    const parsed = profileUpdateSchema.safeParse({
      name,
      photoURL,
    });
    if (!parsed.success) {
      setToast({ type: "error", message: getFirstZodError(parsed.error) });
      return;
    }

    const { name: nextName, photoURL: nextPhotoURL } = parsed.data;

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName ?? "",
          photoURL: nextPhotoURL ?? null,
        }),
      });

      if (response.status === 401) {
        router.replace("/welcome");
        return;
      }

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setToast({ type: "error", message: body.error || "Update failed" });
        return;
      }

      const body = (await response.json()) as { user: SessionUser };
      setUser(body.user);
      setUsername(body.user.username ?? "");
      setName(body.user.name ?? nextName ?? "");
      setPhotoURL(body.user.photoURL ?? "");
      setToast({ type: "success", message: "Saved" });
    } catch {
      setToast({ type: "error", message: "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast ? (
          <motion.div
            key="profile-toast"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-4 z-70"
          >
            <div
              className={`max-w-xs rounded-2xl border px-3 py-2 text-xs shadow-lg ${
                toast.type === "success"
                  ? "border-accent/40 bg-card text-foreground"
                  : "border-accent/45 bg-card text-accent"
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.message}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="grid gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <SectionHeader title="Profile" />
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-card-strong type-heading">
                {photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote avatar URLs vary by provider
                  <img
                    src={photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="type-title truncate">{displayName}</div>
                <div className="type-meta mt-0.5 truncate">{handle}</div>
                <div className="type-meta mt-0.5 truncate">
                  {user?.email || (loaded ? "Email not set" : "Loading…")}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="soft-chip type-meta"
                aria-pressed={usingGoogle}
                onClick={handleUseGooglePhoto}
              >
                Use Google
              </button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="overflow-hidden p-0">
            <DataList>
              <DataRow className="mx-1 !items-start !py-3">
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="type-heading">Username</div>
                  <div className="type-body">
                    {username ? `@${username}` : "Not set"}
                  </div>
                  <div className="type-meta">
                    Chosen at registration and cannot be changed.
                  </div>
                </div>
              </DataRow>

              <DataRow className="mx-1 !items-start !py-3">
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <label htmlFor="profile-name" className="type-heading">
                    Name
                  </label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Display name"
                    className={fieldClass}
                    autoComplete="name"
                  />
                </div>
              </DataRow>

              <DataRow className="mx-1">
                <div className="min-w-0">
                  <div className="type-heading">Email</div>
                  <div className="type-meta mt-0.5 truncate">
                    {user?.email || (loaded ? "Not set" : "Loading…")}
                  </div>
                </div>
              </DataRow>
            </DataList>
          </GlassCard>
        </motion.div>

        <motion.div variants={item} className="grid gap-2">
          {(() => {
            const saveBlockReasons = getBlockReasons([
              {
                ok: loaded,
                reason: "Profile is still loading",
              },
              {
                ok: Boolean(user),
                reason: "Sign in again to save profile changes",
              },
              {
                ok: !saving,
                reason: "Saving in progress…",
              },
            ]);
            const canSave = saveBlockReasons.length === 0;
            return (
              <DisabledWithHint disabled={!canSave} reasons={saveBlockReasons}>
                <button
                  type="button"
                  className="soft-chip w-full justify-center py-3 type-heading text-accent disabled:opacity-50"
                  disabled={!canSave}
                  onClick={() => {
                    void handleSave();
                  }}
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </DisabledWithHint>
            );
          })()}
        </motion.div>
      </motion.div>
    </>
  );
}
