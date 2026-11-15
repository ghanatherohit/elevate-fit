"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DataList,
  DataRow,
  OpenHint,
  SoftChip,
} from "@/components/shared/DataSurfaces";
import OverlaySheet from "@/components/shared/OverlaySheet";

type Preference = {
  email: boolean;
  push: boolean;
  sms: boolean;
};

type Reminder = {
  _id: string;
  title: string;
  scheduledFor: string;
  status: string;
};

type RecurringReminder = {
  _id: string;
  title: string;
  frequency: "daily" | "weekly";
  time: string;
  daysOfWeek: number[];
  paused?: boolean;
};

type ComposeMode = "once" | "repeat";

type EditingTarget = {
  kind: ComposeMode;
  id: string;
  title: string;
};

type DeleteTarget = {
  kind: ComposeMode;
  id: string;
  title: string;
};

const WEEKDAYS = [
  [0, "S"],
  [1, "M"],
  [2, "T"],
  [3, "W"],
  [4, "T"],
  [5, "F"],
  [6, "S"],
] as const;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toDatetimeLocal = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatRecurringMeta = (item: RecurringReminder) => {
  if (item.frequency === "daily") {
    return `Daily · ${item.time}`;
  }
  const days =
    item.daysOfWeek.length > 0
      ? item.daysOfWeek
          .slice()
          .sort((a, b) => a - b)
          .map((day) => DAY_LABELS[day] ?? "?")
          .join(" ")
      : "Weekly";
  return `${days} · ${item.time}`;
};

const emptyCompose = () => ({
  title: "",
  scheduledFor: "",
  time: "08:00",
  frequency: "daily" as "daily" | "weekly",
  daysOfWeek: [] as number[],
});

export default function RemindersPanel() {
  const [preference, setPreference] = useState<Preference>({
    email: true,
    push: false,
    sms: false,
  });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recurring, setRecurring] = useState<RecurringReminder[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("once");
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState(emptyCompose);

  const allPaused =
    recurring.length > 0 && recurring.every((item) => item.paused);
  const activeCount =
    reminders.length + recurring.filter((item) => !item.paused).length;

  useEffect(() => {
    const load = async () => {
      const [prefRes, onceRes, recurRes] = await Promise.all([
        fetch("/api/notifications/preferences"),
        fetch("/api/notifications/reminders"),
        fetch("/api/notifications/recurring"),
      ]);

      if (prefRes.ok) {
        const data = (await prefRes.json()) as { preference: Preference };
        setPreference(data.preference);
      }
      if (onceRes.ok) {
        const data = (await onceRes.json()) as { reminders: Reminder[] };
        setReminders(data.reminders);
      }
      if (recurRes.ok) {
        const data = (await recurRes.json()) as {
          recurring: RecurringReminder[];
        };
        setRecurring(data.recurring);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timer = window.setTimeout(() => setStatus(null), 2800);
    return () => window.clearTimeout(timer);
  }, [status]);

  const upcomingOnce = useMemo(
    () =>
      [...reminders].sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      ),
    [reminders],
  );

  const resetCompose = () => {
    setEditing(null);
    setComposeMode("once");
    setDraft(emptyCompose());
  };

  const openCreate = () => {
    resetCompose();
    setSheetOpen(true);
  };

  const openEditOnce = (item: Reminder) => {
    setEditing({ kind: "once", id: item._id, title: item.title });
    setComposeMode("once");
    setDraft({
      ...emptyCompose(),
      title: item.title,
      scheduledFor: toDatetimeLocal(item.scheduledFor),
    });
    setSheetOpen(true);
  };

  const openEditRecurring = (item: RecurringReminder) => {
    setEditing({ kind: "repeat", id: item._id, title: item.title });
    setComposeMode("repeat");
    setDraft({
      title: item.title,
      scheduledFor: "",
      time: item.time,
      frequency: item.frequency,
      daysOfWeek: item.daysOfWeek || [],
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    resetCompose();
  };

  const handleSave = async () => {
    const title = draft.title.trim();
    if (!title) {
      setStatus("Add a title");
      return;
    }

    setSaving(true);
    try {
      if (composeMode === "once") {
        if (!draft.scheduledFor) {
          setStatus("Pick a date and time");
          return;
        }

        if (editing?.kind === "once") {
          const response = await fetch("/api/notifications/reminders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editing.id,
              title,
              scheduledFor: draft.scheduledFor,
            }),
          });

          if (!response.ok) {
            const body = (await response.json()) as { error?: string };
            setStatus(body.error || "Could not update");
            return;
          }

          const data = (await response.json()) as { reminder: Reminder };
          setReminders((prev) =>
            prev.map((item) =>
              item._id === data.reminder._id ? data.reminder : item,
            ),
          );
          setStatus("Updated");
          closeSheet();
          return;
        }

        const response = await fetch("/api/notifications/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            scheduledFor: draft.scheduledFor,
            channels: preference,
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          setStatus(body.error || "Could not schedule");
          return;
        }

        const data = (await response.json()) as { reminder: Reminder };
        setReminders((prev) => [data.reminder, ...prev]);
        setStatus("Scheduled");
        closeSheet();
        return;
      }

      if (draft.frequency === "weekly" && draft.daysOfWeek.length === 0) {
        setStatus("Pick at least one day");
        return;
      }

      if (editing?.kind === "repeat") {
        const response = await fetch("/api/notifications/recurring", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            title,
            time: draft.time,
            frequency: draft.frequency,
            daysOfWeek: draft.frequency === "weekly" ? draft.daysOfWeek : [],
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          setStatus(body.error || "Could not update");
          return;
        }

        const data = (await response.json()) as { recurring: RecurringReminder };
        setRecurring((prev) =>
          prev.map((item) =>
            item._id === data.recurring._id ? data.recurring : item,
          ),
        );
        setStatus("Updated");
        closeSheet();
        return;
      }

      const response = await fetch("/api/notifications/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          time: draft.time,
          frequency: draft.frequency,
          daysOfWeek: draft.frequency === "weekly" ? draft.daysOfWeek : [],
          channels: preference,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setStatus(body.error || "Could not create");
        return;
      }

      const data = (await response.json()) as { recurring: RecurringReminder };
      setRecurring((prev) => [data.recurring, ...prev]);
      setStatus("Repeating reminder set");
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePaused = async (item: RecurringReminder) => {
    const response = await fetch("/api/notifications/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item._id, paused: !item.paused }),
    });

    if (!response.ok) {
      setStatus("Could not update");
      return;
    }

    const data = (await response.json()) as { recurring: RecurringReminder };
    setRecurring((prev) =>
      prev.map((entry) =>
        entry._id === data.recurring._id ? data.recurring : entry,
      ),
    );
  };

  const handlePauseAll = async () => {
    if (recurring.length === 0) {
      return;
    }
    const nextPaused = !allPaused;
    const results = await Promise.all(
      recurring.map((item) =>
        fetch("/api/notifications/recurring", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item._id, paused: nextPaused }),
        }),
      ),
    );

    if (results.some((res) => !res.ok)) {
      setStatus("Could not update");
      return;
    }

    setRecurring((prev) =>
      prev.map((item) => ({ ...item, paused: nextPaused })),
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      const endpoint =
        deleteTarget.kind === "once"
          ? `/api/notifications/reminders?id=${deleteTarget.id}`
          : `/api/notifications/recurring?id=${deleteTarget.id}`;

      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) {
        setStatus("Could not delete");
        return;
      }

      if (deleteTarget.kind === "once") {
        setReminders((prev) =>
          prev.filter((item) => item._id !== deleteTarget.id),
        );
      } else {
        setRecurring((prev) =>
          prev.filter((item) => item._id !== deleteTarget.id),
        );
      }

      if (editing?.id === deleteTarget.id) {
        closeSheet();
      }
      setDeleteTarget(null);
      setStatus("Removed");
    } finally {
      setDeleting(false);
    }
  };

  const isEmpty = upcomingOnce.length === 0 && recurring.length === 0;
  const sheetTitle = editing
    ? editing.kind === "once"
      ? "Edit reminder"
      : "Edit repeating"
    : "Add reminder";

  return (
    <div className="grid gap-4">
      <div className="glass-card grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="type-kicker">Nudges</div>
            <div className="type-title">Reminders</div>
            <div className="type-meta mt-1">
              {activeCount === 0
                ? "Nothing scheduled"
                : `${activeCount} active`}
            </div>
          </div>
          <button
            type="button"
            className="openable soft-chip gap-1 text-xs font-semibold text-accent"
            onClick={openCreate}
          >
            Add
            <OpenHint kind="open" />
          </button>
        </div>

        {status ? (
          <div className="soft-tile px-3 py-2 text-xs text-muted">{status}</div>
        ) : null}

        {isEmpty ? (
          <div className="py-8 text-center">
            <div className="text-sm text-foreground">No reminders yet</div>
            <div className="mt-1 text-xs text-muted">
              Set a one-time nudge or a repeating habit check-in.
            </div>
            <button
              type="button"
              className="mt-4 soft-chip px-4 py-2 text-xs font-semibold text-accent"
              onClick={openCreate}
            >
              Add reminder
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {upcomingOnce.length > 0 ? (
              <section className="grid gap-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Upcoming
                </div>
                <DataList>
                  {upcomingOnce.map((reminder) => (
                    <DataRow
                      key={reminder._id}
                      className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm text-foreground">
                          {reminder.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span>{formatWhen(reminder.scheduledFor)}</span>
                          <SoftChip className="text-[10px] capitalize text-muted">
                            {reminder.status}
                          </SoftChip>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="soft-chip px-2.5 py-1 text-[11px] text-muted hover:text-foreground"
                          onClick={() => openEditOnce(reminder)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="soft-chip px-2.5 py-1 text-[11px] text-muted hover:text-accent"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "once",
                              id: reminder._id,
                              title: reminder.title,
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </DataRow>
                  ))}
                </DataList>
              </section>
            ) : null}

            {recurring.length > 0 ? (
              <section className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Repeating
                  </div>
                  {recurring.length > 1 ? (
                    <button
                      type="button"
                      className="text-[11px] text-muted hover:text-foreground"
                      onClick={() => {
                        void handlePauseAll();
                      }}
                    >
                      {allPaused ? "Resume all" : "Pause all"}
                    </button>
                  ) : null}
                </div>
                <DataList>
                  {recurring.map((item) => (
                    <DataRow
                      key={item._id}
                      className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div
                          className={`truncate text-sm ${
                            item.paused
                              ? "text-muted line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {formatRecurringMeta(item)}
                          {item.paused ? " · Paused" : ""}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        <button
                          type="button"
                          className="soft-chip px-2.5 py-1 text-[11px] text-muted hover:text-foreground"
                          onClick={() => openEditRecurring(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="soft-chip px-2.5 py-1 text-[11px] text-muted hover:text-foreground"
                          onClick={() => {
                            void handleTogglePaused(item);
                          }}
                        >
                          {item.paused ? "Resume" : "Pause"}
                        </button>
                        <button
                          type="button"
                          className="soft-chip px-2.5 py-1 text-[11px] text-muted hover:text-accent"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "repeat",
                              id: item._id,
                              title: item.title,
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </DataRow>
                  ))}
                </DataList>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <OverlaySheet
        open={sheetOpen}
        onClose={closeSheet}
        title={sheetTitle}
        subtitle={
          editing
            ? "Change the title or schedule"
            : "One-time or repeating"
        }
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-xs text-muted">
            Title
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Drink water, stretch, prep meals…"
              className="soft-tile w-full px-3 py-2.5 text-sm text-foreground outline-none"
              autoFocus
            />
          </label>

          {!editing ? (
            <div className="grid gap-1.5">
              <div className="text-xs text-muted">Type</div>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-card-strong/50 p-1">
                {(
                  [
                    ["once", "Once"],
                    ["repeat", "Repeat"],
                  ] as const
                ).map(([id, label]) => {
                  const active = composeMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setComposeMode(id)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "bg-accent/15 text-accent"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {composeMode === "once" ? (
            <label className="grid gap-1.5 text-xs text-muted">
              When
              <input
                type="datetime-local"
                value={draft.scheduledFor}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    scheduledFor: event.target.value,
                  }))
                }
                className="soft-tile w-full px-3 py-2.5 text-sm text-foreground outline-none"
              />
            </label>
          ) : (
            <>
              <label className="grid gap-1.5 text-xs text-muted">
                Time
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, time: event.target.value }))
                  }
                  className="soft-tile w-full px-3 py-2.5 text-sm text-foreground outline-none"
                />
              </label>

              <div className="grid gap-1.5">
                <div className="text-xs text-muted">Repeat</div>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-card-strong/50 p-1">
                  {(
                    [
                      ["daily", "Every day"],
                      ["weekly", "Weekly"],
                    ] as const
                  ).map(([id, label]) => {
                    const active = draft.frequency === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, frequency: id }))
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "bg-accent/15 text-accent"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {draft.frequency === "weekly" ? (
                <div className="grid gap-1.5">
                  <div className="text-xs text-muted">Days</div>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map(([value, label]) => {
                      const active = draft.daysOfWeek.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              daysOfWeek: prev.daysOfWeek.includes(value)
                                ? prev.daysOfWeek.filter((day) => day !== value)
                                : [...prev.daysOfWeek, value],
                            }))
                          }
                          className={`rounded-lg py-2 text-[11px] font-medium transition ${
                            active
                              ? "bg-accent/15 text-accent"
                              : "bg-card-strong/40 text-muted"
                          }`}
                          aria-pressed={active}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}

          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
            className="w-full rounded-xl bg-accent/15 px-4 py-2.5 text-xs font-semibold text-accent disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : editing
                ? "Save changes"
                : composeMode === "once"
                  ? "Schedule"
                  : "Set reminder"}
          </button>
        </div>
      </OverlaySheet>

      <OverlaySheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete reminder"
        subtitle="This cannot be undone"
      >
        <div className="grid gap-4">
          <p className="text-sm text-foreground">
            Remove{" "}
            <span className="font-semibold">{deleteTarget?.title}</span>?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-xl bg-card-strong/50 px-4 py-2.5 text-xs font-semibold text-muted"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-accent/15 px-4 py-2.5 text-xs font-semibold text-accent disabled:opacity-60"
              onClick={() => {
                void confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </OverlaySheet>
    </div>
  );
}
