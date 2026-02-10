"use client";

import { useEffect, useState } from "react";

const storageKey = "health-plan";

type Supplement = {
  id: string;
  label: string;
  checked: boolean;
};

type HealthPlanState = {
  morning: string;
  breakfast: string;
  lunch: string;
  preWorkout: string;
  postWorkout: string;
  dinner: string;
  night: string;
  supplements: Supplement[];
};

const defaultState: HealthPlanState = {
  morning: "Warm water + lemon + soaked nuts",
  breakfast: "Veggie oats + eggs/paneer",
  lunch: "Brown rice + dal + greens + salad",
  preWorkout: "Banana + peanut butter",
  postWorkout: "Whey isolate or paneer + fruit",
  dinner: "Lean protein + vegetables",
  night: "Turmeric milk or chamomile tea",
  supplements: [
    { id: "zinc", label: "Zinc", checked: false },
    { id: "vitd", label: "Vitamin D", checked: false },
    { id: "omega", label: "Omega-3", checked: false },
  ],
};

export default function HealthPlanEditor() {
  const [state, setState] = useState<HealthPlanState>(defaultState);
  const [newSupplement, setNewSupplement] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as HealthPlanState;
      setState({ ...defaultState, ...parsed });
    } catch {
      setState(defaultState);
    }
  }, []);

  const handleChange = (key: keyof HealthPlanState, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (id: string) => {
    setState((prev) => ({
      ...prev,
      supplements: prev.supplements.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  const handleAddSupplement = () => {
    const label = newSupplement.trim();
    if (!label) {
      return;
    }
    setState((prev) => ({
      ...prev,
      supplements: [
        { id: `sup-${Date.now()}`, label, checked: false },
        ...prev.supplements,
      ],
    }));
    setNewSupplement("");
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    setStatus("Health plan saved");
    setTimeout(() => setStatus(null), 2000);
  };

  return (
    <div className="grid gap-4">
      {(
        [
          ["Morning", "morning"],
          ["Breakfast", "breakfast"],
          ["Lunch", "lunch"],
          ["Pre-workout", "preWorkout"],
          ["Post-workout", "postWorkout"],
          ["Dinner", "dinner"],
          ["Night", "night"],
        ] as const
      ).map(([label, key]) => (
        <div key={key} className="grid gap-2">
          <label className="text-xs text-[color:var(--muted)]">{label}</label>
          <textarea
            value={state[key]}
            onChange={(event) => handleChange(key, event.target.value)}
            rows={2}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          />
        </div>
      ))}

      <div className="grid gap-2">
        <label className="text-xs text-[color:var(--muted)]">Supplements</label>
        <div className="grid gap-2">
          {state.supplements.map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm"
            >
              <span className="text-[color:var(--text)]">{item.label}</span>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item.id)}
                className="h-5 w-5 accent-[color:var(--accent)]"
              />
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSupplement}
            onChange={(event) => setNewSupplement(event.target.value)}
            placeholder="Add supplement"
            className="flex-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)]"
          />
          <button
            className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
            onClick={handleAddSupplement}
          >
            Add
          </button>
        </div>
      </div>

      {status ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs text-[color:var(--muted)]">
          {status}
        </div>
      ) : null}

      <button
        className="rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--accent)]"
        onClick={handleSave}
      >
        Save plan
      </button>
    </div>
  );
}
