"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUiStyle } from "@/components/layout/ThemeProvider";
import { UI_STYLES, type UiStyleId } from "@/lib/theme/styles";

export default function SketchbookThemeOrb() {
  const { styleId, setStyle, meta } = useUiStyle();
  const [open, setOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<UiStyleId>(styleId);

  useEffect(() => {
    if (!open) {
      setFocusedId(styleId);
    }
  }, [styleId, open]);

  const commitTheme = (id: UiStyleId) => {
    setFocusedId(id);
    setStyle(id);
  };

  return (
    <div className="pointer-events-auto absolute right-5 top-6 z-40 sm:right-6 sm:top-8">
      <motion.button
        type="button"
        aria-label={open ? "Close theme sketchbook" : "Open theme sketchbook"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border shadow-[var(--shadow)]"
        style={{
          background: `conic-gradient(from 210deg, ${meta.preview.accent}, ${meta.preview.accent2}, ${meta.preview.card}, ${meta.preview.accent})`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
      >
        <span
          className="absolute inset-[3px] rounded-full border border-border/60"
          style={{ background: meta.preview.bg }}
        />
        <span
          className="relative h-2.5 w-2.5 rounded-full"
          style={{ background: meta.preview.accent }}
        />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Dismiss theme sketchbook"
              className="fixed inset-0 z-40 cursor-default bg-[var(--scrim)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <div
              className="absolute right-0 top-14 z-50 w-[min(90vw,340px)]"
              style={{ perspective: "1400px" }}
            >
              <motion.div
                className="relative origin-left"
                initial={{ rotateY: -88, opacity: 0, x: 24 }}
                animate={{ rotateY: 0, opacity: 1, x: 0 }}
                exit={{ rotateY: -72, opacity: 0, x: 16 }}
                transition={{ type: "spring", stiffness: 160, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="relative overflow-hidden rounded-r-[1.4rem] rounded-l-[0.4rem] border border-[color-mix(in_srgb,var(--border)_70%,#8b7355)] shadow-[var(--shadow)]"
                  style={{
                    background:
                      "linear-gradient(125deg, color-mix(in srgb, var(--card) 82%, #f4ead8), color-mix(in srgb, var(--bg-elevated) 78%, #e6d7c0))",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-y-3 left-1.5 flex flex-col justify-between py-2"
                    aria-hidden
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span
                        key={index}
                        className="h-2.5 w-2.5 rounded-full border border-[#8b7355]/50 bg-[#d7c4a3] shadow-sm"
                      />
                    ))}
                  </div>

                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-4"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(139,115,85,0.35), transparent)",
                    }}
                    aria-hidden
                  />

                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(180deg, transparent 0 26px, rgba(139,115,85,0.18) 26px 27px)",
                      backgroundPosition: "0 52px",
                    }}
                    aria-hidden
                  />

                  <div className="relative border-b border-[#8b7355]/25 px-5 py-3 pl-8">
                    <div className="font-display text-sm font-semibold text-foreground">
                      Theme sketchbook
                    </div>
                    <div className="text-[10px] text-muted">
                      Tap a style to apply · tap outside to close
                    </div>
                  </div>

                  <div className="themed-scroll relative max-h-[min(54vh,400px)] space-y-1 overflow-y-auto px-3 py-3 pl-7">
                    {UI_STYLES.map((style) => {
                      const active = focusedId === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          data-style-id={style.id}
                          onClick={() => commitTheme(style.id)}
                          className={`flex w-full items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left transition duration-300 ${
                            active
                              ? "border-accent bg-card/85 shadow-[var(--shadow)]"
                              : "border-transparent hover:border-border hover:bg-card/45"
                          }`}
                        >
                          <span
                            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border"
                            style={{ background: style.preview.bg }}
                            aria-hidden
                          >
                            <span
                              className="absolute inset-x-1.5 top-1.5 h-3 rounded-sm"
                              style={{ background: style.preview.card }}
                            />
                            <span
                              className="absolute bottom-1.5 left-1.5 h-2 w-2 rounded-full"
                              style={{ background: style.preview.accent }}
                            />
                            <span
                              className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full"
                              style={{ background: style.preview.accent2 }}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-foreground">
                              {style.label}
                            </span>
                            <span className="line-clamp-1 text-[10px] text-muted">
                              {style.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
