"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useUiStyle } from "@/components/layout/ThemeProvider";
import { OpenHint } from "@/components/shared/DataSurfaces";
import {
  getUiStylesByGroup,
  UI_STYLES,
  type UiStyleId,
} from "@/lib/theme/styles";

type StylePickerProps = {
  /** Tighter trigger for settings list rows. */
  compact?: boolean;
};

const STYLE_GROUPS = getUiStylesByGroup();

export default function StylePicker({ compact = false }: StylePickerProps) {
  const { styleId, setStyle } = useUiStyle();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const listId = useId();

  const active =
    UI_STYLES.find((style) => style.id === styleId) ?? UI_STYLES[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Theme swaps restyle the list; keep the user's scroll spot.
  useLayoutEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = scrollTopRef.current;
  }, [open, styleId]);

  const selectStyle = (nextId: UiStyleId) => {
    if (listRef.current) {
      scrollTopRef.current = listRef.current.scrollTop;
    }
    setStyle(nextId);
  };

  return (
    <div ref={rootRef} className="grid gap-1.5">
      <button
        type="button"
        className={`openable flex w-full items-center gap-3 text-left ${
          compact ? "rounded-xl px-2 py-2" : "soft-tile px-3 py-2.5"
        }`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className={`relative shrink-0 overflow-hidden rounded-lg ${
            compact ? "h-8 w-11" : "h-10 w-14"
          }`}
          style={{ background: active.preview.bg }}
          aria-hidden
        >
          <span
            className="absolute inset-x-1.5 top-1.5 h-3 rounded-sm"
            style={{ background: active.preview.card }}
          />
          <span
            className="absolute bottom-1.5 left-1.5 h-1.5 w-3.5 rounded-sm"
            style={{ background: active.preview.accent }}
          />
          <span
            className="absolute bottom-1.5 left-5 h-1.5 w-2.5 rounded-sm"
            style={{ background: active.preview.accent2 }}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="type-heading block truncate">{active.label}</span>
          {!compact ? (
            <span className="type-meta mt-0.5 block truncate">
              {active.description}
            </span>
          ) : (
            <span className="type-meta mt-0.5 block truncate">
              {STYLE_GROUPS.find((group) => group.id === active.group)?.label}
            </span>
          )}
        </span>

        <OpenHint kind="expand" />
      </button>

      <div
        id={listId}
        ref={listRef}
        hidden={!open}
        className="themed-scroll grid max-h-[min(48vh,380px)] gap-3 overflow-y-auto rounded-xl bg-card-strong/25 p-2"
        role="listbox"
        aria-label="UI style"
        onScroll={(event) => {
          scrollTopRef.current = event.currentTarget.scrollTop;
        }}
      >
        {STYLE_GROUPS.map((group) => (
          <div key={group.id} className="grid gap-1.5">
            <div className="type-meta px-0.5">{group.label}</div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {group.styles.map((style) => {
                const selected = style.id === styleId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      selectStyle(style.id as UiStyleId);
                    }}
                    className={`grid gap-1.5 rounded-[var(--radius)] p-1.5 text-left transition ${
                      selected
                        ? "bg-accent/10 ring-1 ring-accent/40"
                        : "bg-card-strong/30 hover:bg-card-strong/55"
                    }`}
                  >
                    <span
                      className="relative block h-10 overflow-hidden rounded-md"
                      style={{ background: style.preview.bg }}
                      aria-hidden
                    >
                      <span
                        className="absolute inset-x-1.5 top-1.5 h-4 rounded-sm"
                        style={{ background: style.preview.card }}
                      />
                      <span
                        className="absolute bottom-1.5 left-1.5 h-1.5 w-4 rounded-sm"
                        style={{ background: style.preview.accent }}
                      />
                      <span
                        className="absolute bottom-1.5 left-6 h-1.5 w-3 rounded-sm"
                        style={{ background: style.preview.accent2 }}
                      />
                    </span>
                    <span className="type-meta truncate px-0.5 text-[10px] text-foreground">
                      {style.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
