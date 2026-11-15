export const UI_STYLE_IDS = [
  "minimalism",
  "maximalism",
  "swiss",
  "brutalism",
  "surrealism",
  "neo-brutalism",
  "neo-classical",
  "neumorphism",
  "scrapbook",
  "glassmorphism",
  "claymorphism",
  "bento-grid",
  "pixel-art",
  "conceptual-sketch",
  "luxury-typography",
  "editorial",
  "y2k",
  "ethereal",
  "bohemian",
  "dark-mode",
  "cyberpunk",
  "anthropomorphic",
  "victorian",
  "cybercore",
  "synthwave",
  "graffiti",
  "gothic",
  "mixed-media",
  "wabi-sabi",
] as const;

export type UiStyleId = (typeof UI_STYLE_IDS)[number];

export const DEFAULT_UI_STYLE: UiStyleId = "glassmorphism";
export const UI_STYLE_STORAGE_KEY = "ef-ui-style";
export const LEGACY_THEME_STORAGE_KEY = "ef-theme";

export const UI_STYLE_GROUPS = [
  "clean",
  "soft",
  "bold",
  "neon",
  "classic",
  "organic",
] as const;

export type UiStyleGroupId = (typeof UI_STYLE_GROUPS)[number];

export const UI_STYLE_GROUP_LABELS: Record<UiStyleGroupId, string> = {
  clean: "Clean",
  soft: "Soft",
  bold: "Bold",
  neon: "Neon",
  classic: "Classic",
  organic: "Organic",
};

export type UiStyleMeta = {
  id: UiStyleId;
  label: string;
  description: string;
  group: UiStyleGroupId;
  preview: {
    bg: string;
    card: string;
    accent: string;
    accent2: string;
    text: string;
  };
};

export const UI_STYLES: UiStyleMeta[] = [
  {
    id: "minimalism",
    label: "Minimalism",
    description: "Clean layouts, whitespace, limited color, essentials only.",
    group: "clean",
    preview: { bg: "#f7f7f5", card: "#ffffff", accent: "#111111", accent2: "#555555", text: "#111111" },
  },
  {
    id: "swiss",
    label: "Swiss Design",
    description: "Grid-based clarity, asymmetric balance, sans-serif type.",
    group: "clean",
    preview: { bg: "#f2f2f2", card: "#ffffff", accent: "#e30613", accent2: "#111111", text: "#111111" },
  },
  {
    id: "editorial",
    label: "Editorial Design",
    description: "Magazine layouts: strong headlines and dramatic type.",
    group: "clean",
    preview: { bg: "#faf8f5", card: "#ffffff", accent: "#111111", accent2: "#c41230", text: "#111111" },
  },
  {
    id: "bento-grid",
    label: "Bento Grid",
    description: "Modular card grid with mixed-size content tiles.",
    group: "clean",
    preview: { bg: "#0f1115", card: "#1a1d24", accent: "#30d158", accent2: "#64d2ff", text: "#f2f4f8" },
  },
  {
    id: "conceptual-sketch",
    label: "Conceptual Sketch",
    description: "Hand-drawn wireframe aesthetic — ideas over polish.",
    group: "clean",
    preview: { bg: "#f5f1e8", card: "#fffdf8", accent: "#333333", accent2: "#888888", text: "#222222" },
  },
  {
    id: "glassmorphism",
    label: "Glassmorphism",
    description: "Frosted translucent panels, blur, soft refraction.",
    group: "soft",
    preview: { bg: "#0b0d13", card: "#121827", accent: "#62d2ff", accent2: "#7c6cff", text: "#e6ebf5" },
  },
  {
    id: "neumorphism",
    label: "Neumorphism",
    description: "Soft extruded UI — pressed into or raised from the surface.",
    group: "soft",
    preview: { bg: "#e6ebf2", card: "#e6ebf2", accent: "#5b7cfa", accent2: "#8b9bb4", text: "#2d3748" },
  },
  {
    id: "claymorphism",
    label: "Claymorphism",
    description: "Soft 3D clay shapes, rounded forms, playful pastel depth.",
    group: "soft",
    preview: { bg: "#efe8ff", card: "#ffffff", accent: "#7c6cff", accent2: "#ff8fab", text: "#2d2450" },
  },
  {
    id: "ethereal",
    label: "Ethereal",
    description: "Soft, airy, dreamy translucent layers and calm gradients.",
    group: "soft",
    preview: { bg: "#f4f6fb", card: "#ffffff", accent: "#1f6fff", accent2: "#7d4cff", text: "#121526" },
  },
  {
    id: "brutalism",
    label: "Brutalism",
    description: "Raw, unpolished, stark contrast — ugly on purpose.",
    group: "bold",
    preview: { bg: "#ffff00", card: "#ffffff", accent: "#0000ff", accent2: "#ff0000", text: "#000000" },
  },
  {
    id: "neo-brutalism",
    label: "Neo-Brutalism",
    description: "Hard borders, flat colors, chunky type — still usable.",
    group: "bold",
    preview: { bg: "#fff7e8", card: "#ffffff", accent: "#111111", accent2: "#ff5c5c", text: "#111111" },
  },
  {
    id: "maximalism",
    label: "Maximalism",
    description: "Dense, bold, layered visuals — more is more.",
    group: "bold",
    preview: { bg: "#1a0a2e", card: "#2d1b4e", accent: "#ff2e97", accent2: "#ffe566", text: "#fff5fb" },
  },
  {
    id: "graffiti",
    label: "Graffiti",
    description: "Street-art energy: spray textures and bold lettering.",
    group: "bold",
    preview: { bg: "#121212", card: "#1e1e1e", accent: "#ffee00", accent2: "#ff2d55", text: "#ffffff" },
  },
  {
    id: "dark-mode",
    label: "Dark Mode UI",
    description: "Dark backgrounds, muted surfaces, high-contrast accents.",
    group: "neon",
    preview: { bg: "#09090b", card: "#18181b", accent: "#a1a1aa", accent2: "#fafafa", text: "#fafafa" },
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Neon on dark, glitch energy, dystopian futurism.",
    group: "neon",
    preview: { bg: "#05010a", card: "#12061f", accent: "#00f0ff", accent2: "#ff00a8", text: "#e8fbff" },
  },
  {
    id: "cybercore",
    label: "Cybercore",
    description: "HUD grids, system-terminal energy, hard digital core.",
    group: "neon",
    preview: { bg: "#020403", card: "#0a140f", accent: "#39ff14", accent2: "#00c2ff", text: "#d7ffe0" },
  },
  {
    id: "synthwave",
    label: "Synthwave",
    description: "80s retro-futurism: neon grids, sunset, chrome.",
    group: "neon",
    preview: { bg: "#14001f", card: "#240033", accent: "#ff2bd6", accent2: "#00e5ff", text: "#ffe9ff" },
  },
  {
    id: "y2k",
    label: "Y2K Aesthetic",
    description: "Chrome, bubbles, glitter, neon, early-2000s tech.",
    group: "neon",
    preview: { bg: "#120024", card: "#2a0050", accent: "#ff66cc", accent2: "#66ffff", text: "#ffffff" },
  },
  {
    id: "pixel-art",
    label: "Pixel Art",
    description: "Retro low-res sprites, blocky fonts, 8-bit nostalgia.",
    group: "neon",
    preview: { bg: "#1a1c2c", card: "#2b2f44", accent: "#ffcc00", accent2: "#e43b44", text: "#f4f4f4" },
  },
  {
    id: "neo-classical",
    label: "Neo-classical",
    description: "Classical proportions, serif elegance, refined symmetry.",
    group: "classic",
    preview: { bg: "#f6f1e7", card: "#fffdf8", accent: "#6b4f2c", accent2: "#2c241b", text: "#2c241b" },
  },
  {
    id: "luxury-typography",
    label: "Luxury Typography",
    description: "Type-led luxury: refined serifs, generous spacing.",
    group: "classic",
    preview: { bg: "#0c0c0c", card: "#161616", accent: "#d4af37", accent2: "#f5e6c8", text: "#f5f0e6" },
  },
  {
    id: "victorian",
    label: "Victorian",
    description: "Ornate flourishes, decorative borders, vintage serifs.",
    group: "classic",
    preview: { bg: "#1a1210", card: "#2a1c18", accent: "#c9a227", accent2: "#8b1e1e", text: "#f3e6c8" },
  },
  {
    id: "gothic",
    label: "Gothic",
    description: "Dark romanticism: dramatic contrast and pointed forms.",
    group: "classic",
    preview: { bg: "#0a0708", card: "#160e12", accent: "#9b1c1c", accent2: "#c4b5a0", text: "#efe6dc" },
  },
  {
    id: "wabi-sabi",
    label: "Wabi Sabi",
    description: "Imperfect beauty: asymmetry, natural quiet elegance.",
    group: "organic",
    preview: { bg: "#ebe4d8", card: "#f7f1e6", accent: "#6f6558", accent2: "#a89880", text: "#3f3830" },
  },
  {
    id: "bohemian",
    label: "Bohemian",
    description: "Earthy textures, artisan patterns, warm organic feel.",
    group: "organic",
    preview: { bg: "#2b1d14", card: "#3c2a1d", accent: "#e0a45a", accent2: "#9c6b3c", text: "#f6e7d2" },
  },
  {
    id: "scrapbook",
    label: "Scrapbook",
    description: "Collage feel: stickers, torn paper, handwritten notes.",
    group: "organic",
    preview: { bg: "#f3e6d4", card: "#fff8ee", accent: "#d45d3d", accent2: "#5b7c5a", text: "#3b2f2f" },
  },
  {
    id: "surrealism",
    label: "Surrealism",
    description: "Dreamlike juxtapositions and fantastical UI elements.",
    group: "organic",
    preview: { bg: "#1b1433", card: "#2a2150", accent: "#c4f5ff", accent2: "#ff9ad5", text: "#f4ecff" },
  },
  {
    id: "anthropomorphic",
    label: "Anthropomorphic",
    description: "Characterful UI that feels playful and alive.",
    group: "organic",
    preview: { bg: "#fff4e8", card: "#ffffff", accent: "#ff7a59", accent2: "#5b8def", text: "#2b2118" },
  },
  {
    id: "mixed-media",
    label: "Mixed Media",
    description: "Blend of photo, illustration, texture, and type.",
    group: "organic",
    preview: { bg: "#1c1a17", card: "#2a2620", accent: "#ff8a3d", accent2: "#6ec1e4", text: "#f5efe6" },
  },
];

export function getUiStylesByGroup(): Array<{
  id: UiStyleGroupId;
  label: string;
  styles: UiStyleMeta[];
}> {
  return UI_STYLE_GROUPS.map((groupId) => ({
    id: groupId,
    label: UI_STYLE_GROUP_LABELS[groupId],
    styles: UI_STYLES.filter((style) => style.group === groupId),
  }));
}

export function isUiStyleId(value: string | null | undefined): value is UiStyleId {
  return Boolean(value && (UI_STYLE_IDS as readonly string[]).includes(value));
}

/** Migrate legacy light/dark storage into a UI style id. */
export function resolveStoredUiStyle(): UiStyleId {
  if (typeof window === "undefined") {
    return DEFAULT_UI_STYLE;
  }

  const stored = localStorage.getItem(UI_STYLE_STORAGE_KEY);
  if (isUiStyleId(stored)) {
    return stored;
  }

  const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (legacy === "light") {
    return "ethereal";
  }
  if (legacy === "dark") {
    return "glassmorphism";
  }

  return DEFAULT_UI_STYLE;
}

export function getUiStyleMeta(id: UiStyleId): UiStyleMeta {
  return UI_STYLES.find((style) => style.id === id) ?? UI_STYLES[0];
}
