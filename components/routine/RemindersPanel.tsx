"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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

const modalMotion = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 30, opacity: 0 },
  transition: { type: "spring" as const, damping: 24, stiffness: 260 },
};

export default function RemindersPanel() {
  const [preference, setPreference] = useState<Preference>({
    email: true,
    push: false,
    sms: false,
  });
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [recurringTitle, setRecurringTitle] = useState("");
  const [recurringTime, setRecurringTime] = useState("08:00");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [recurring, setRecurring] = useState<RecurringReminder[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const allPaused = recurring.length > 0 && recurring.every((item) => item.paused);

  useEffect(() => {
    const loadPreferences = async () => {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { preference: Preference };
      setPreference(data.preference);
    };
    const loadReminders = async () => {
      const response = await fetch("/api/notifications/reminders");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { reminders: Reminder[] };
      setReminders(data.reminders);
    };
    const loadRecurring = async () => {
      const response = await fetch("/api/notifications/recurring");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {
        recurring: RecurringReminder[];
      };
      setRecurring(data.recurring);
    };
    loadPreferences();
    loadReminders();
    loadRecurring();
  }, []);

  const handleCreateReminder = async () => {
    if (!title || !scheduledFor) {
      setStatus("Add title and time");
      return;
    }

    const response = await fetch("/api/notifications/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, scheduledFor, channels: preference }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setStatus(body.error || "Failed to schedule reminder");
      return;
    }

    const data = (await response.json()) as { reminder: Reminder };
    setReminders((prev) => [data.reminder, ...prev]);
    setTitle("");
    setScheduledFor("");
    setStatus("Reminder scheduled");
  };

  const handleCreateRecurring = async () => {
    if (!recurringTitle || !recurringTime) {
      setStatus("Add title and time");
      return;
    }

    const response = await fetch("/api/notifications/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recurringTitle,
        time: recurringTime,
        frequency,
        daysOfWeek: frequency === "weekly" ? daysOfWeek : [],
        channels: preference,
      }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setStatus(body.error || "Failed to create recurring reminder");
      return;
    }

    const data = (await response.json()) as { recurring: RecurringReminder };
    setRecurring((prev) => [data.recurring, ...prev]);
    setRecurringTitle("");
    setRecurringTime("08:00");
    setDaysOfWeek([]);
    setStatus("Recurring reminder created");
  };

  const handleEditRecurring = (item: RecurringReminder) => {
    setEditingId(item._id);
    setRecurringTitle(item.title);
    setRecurringTime(item.time);
    setFrequency(item.frequency);
    setDaysOfWeek(item.daysOfWeek || []);
    setIsOpen(true);
  };

  const handleUpdateRecurring = async () => {
    if (!editingId) {
      return;
    }
    if (!recurringTitle || !recurringTime) {
      setStatus("Add title and time");
      return;
    }

    const response = await fetch("/api/notifications/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        title: recurringTitle,
        time: recurringTime,
        frequency,
        daysOfWeek: frequency === "weekly" ? daysOfWeek : [],
      }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setStatus(body.error || "Failed to update recurring reminder");
      return;
    }

    const data = (await response.json()) as { recurring: RecurringReminder };
    setRecurring((prev) =>
      prev.map((item) => (item._id === data.recurring._id ? data.recurring : item)),
    );
    setEditingId(null);
    setRecurringTitle("");
    setRecurringTime("08:00");
    setDaysOfWeek([]);
    setStatus("Recurring reminder updated");
  };

  const handleTogglePaused = async (item: RecurringReminder) => {
    const response = await fetch("/api/notifications/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item._id, paused: !item.paused }),
    });

    if (!response.ok) {
      setStatus("Failed to update pause state");
      return;
    }

    const data = (await response.json()) as { recurring: RecurringReminder };
    setRecurring((prev) =>
      prev.map((entry) => (entry._id === data.recurring._id ? data.recurring : entry)),
    );
  };

  const handlePauseAll = async () => {
    if (recurring.length === 0) {
      return;
    }
    const nextPaused = !allPaused;
    const updates = recurring.map((item) =>
      fetch("/api/notifications/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, paused: nextPaused }),
      }),
    );

    const results = await Promise.all(updates);
    if (results.some((res) => !res.ok)) {
      setStatus("Failed to update pause state");
      return;
    }

    setRecurring((prev) => prev.map((item) => ({ ...item, paused: nextPaused })));
  };

  const handleDeleteRecurring = async (id: string) => {
    const response = await fetch(`/api/notifications/recurring?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setStatus("Failed to delete recurring reminder");
      return;
    }

    setRecurring((prev) => prev.filter((item) => item._id !== id));
    setStatus("Recurring reminder deleted");
  };

  const preview = useMemo(() => {
    const result: { title: string; date: Date }[] = [];
    const base = new Date();
    const totalDays = 7;
    for (let offset = 0; offset < totalDays; offset += 1) {
      const date = new Date(base);
      date.setDate(base.getDate() + offset);
      const day = date.getDay();
      recurring.forEach((item) => {
        if (item.paused) {
          return;
        }
        const matches =
          item.frequency === "daily" ||
          (item.frequency === "weekly" && item.daysOfWeek.includes(day));
        if (!matches) {
          return;
        }
        const [hours, minutes] = item.time.split(":").map(Number);
        const scheduled = new Date(date);
        scheduled.setHours(hours || 0, minutes || 0, 0, 0);
        result.push({ title: item.title, date: scheduled });
      });
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [recurring]);

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-border bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Reminders
            </div>
            <div className="text-xs text-muted">
              {reminders.length} scheduled • {recurring.length} recurring
            </div>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card-strong text-lg text-foreground"
            onClick={() => setIsOpen(true)}
            aria-label="Add reminder"
          >
            +
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-3xl rounded-3xl border border-border bg-bg-elevated p-5 shadow-2xl"
              {...modalMotion}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-foreground">
                    All reminders
                  </div>
                  <div className="text-xs text-muted">
                    Review before adding new ones.
                  </div>
                </div>
                <button
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>

              {status ? (
                <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-2 text-xs text-muted">
                  {status}
                </div>
              ) : null}

              <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid gap-2">
                  <div className="text-xs text-muted">Scheduled</div>
                  {reminders.length === 0 ? (
                    <div className="text-xs text-muted">
                      No reminders scheduled.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {reminders.map((reminder) => (
                        <motion.div
                          key={reminder._id}
                          layout
                          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                        >
                          <div className="text-foreground">
                            {reminder.title}
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(reminder.scheduledFor).toLocaleString()} • {reminder.status}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Recurring</span>
                    <button
                      className="rounded-full border border-border px-2 py-1 text-[10px]"
                      onClick={handlePauseAll}
                    >
                      {allPaused ? "Resume all" : "Pause all"}
                    </button>
                  </div>
                  {recurring.length === 0 ? (
                    <div className="text-xs text-muted">
                      No recurring reminders.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {recurring.map((item) => (
                        <motion.div
                          key={item._id}
                          layout
                          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                        >
                          <div className="text-foreground">{item.title}</div>
                          <div className="text-xs text-muted">
                            {item.frequency} at {item.time}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              className="rounded-xl border border-border px-3 py-2 text-xs text-foreground"
                              onClick={() => handleEditRecurring(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-xl border border-border px-3 py-2 text-xs text-foreground"
                              onClick={() => handleTogglePaused(item)}
                            >
                              {item.paused ? "Resume" : "Pause"}
                            </button>
                            <button
                              className="rounded-xl border border-border px-3 py-2 text-xs text-muted"
                              onClick={() => handleDeleteRecurring(item._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-xs text-muted">Add reminder</div>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Reminder title"
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                  />
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(event) => setScheduledFor(event.target.value)}
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                  />
                  <button
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                    onClick={handleCreateReminder}
                  >
                    Schedule reminder
                  </button>
                </div>

                <div className="grid gap-2">
                  <div className="text-xs text-muted">Add recurring</div>
                  <input
                    value={recurringTitle}
                    onChange={(event) => setRecurringTitle(event.target.value)}
                    placeholder="Recurring title"
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                  />
                  <input
                    type="time"
                    value={recurringTime}
                    onChange={(event) => setRecurringTime(event.target.value)}
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                  />
                  <select
                    value={frequency}
                    onChange={(event) =>
                      setFrequency(event.target.value as "daily" | "weekly")
                    }
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  {frequency === "weekly" ? (
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        [0, "Sun"],
                        [1, "Mon"],
                        [2, "Tue"],
                        [3, "Wed"],
                        [4, "Thu"],
                        [5, "Fri"],
                        [6, "Sat"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          className={`rounded-2xl border px-3 py-2 text-xs ${
                            daysOfWeek.includes(value)
                              ? "border-accent bg-card-strong text-foreground"
                              : "border-border bg-card text-muted"
                          }`}
                          onClick={() =>
                            setDaysOfWeek((prev) =>
                              prev.includes(value)
                                ? prev.filter((day) => day !== value)
                                : [...prev, value],
                            )
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                    onClick={editingId ? handleUpdateRecurring : handleCreateRecurring}
                  >
                    {editingId
                      ? "Update recurring reminder"
                      : "Create recurring reminder"}
                  </button>
                </div>

                <div className="grid gap-2">
                  <div className="text-xs text-muted">Next 7 days</div>
                  {preview.length === 0 ? (
                    <div className="text-xs text-muted">
                      No upcoming recurring reminders.
                    </div>
                  ) : (
                    preview.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                      >
                        <div className="text-foreground">{item.title}</div>
                        <div className="text-xs text-muted">
                          {item.date.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}



