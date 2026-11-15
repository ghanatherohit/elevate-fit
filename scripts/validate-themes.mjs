import fs from "node:fs";

const css = fs.readFileSync("styles/themes.css", "utf8");
const stylesTs = fs.readFileSync("lib/theme/styles.ts", "utf8");
const idsMatch = stylesTs.match(
  /export const UI_STYLE_IDS = \[([\s\S]*?)\] as const/,
);
if (!idsMatch) {
  console.error("Could not parse UI_STYLE_IDS from lib/theme/styles.ts");
  process.exit(1);
}
const ids = [...idsMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
if (!ids.length) {
  console.error("UI_STYLE_IDS parsed empty");
  process.exit(1);
}

const required = [
  "--bg",
  "--card",
  "--text",
  "--muted",
  "--border",
  "--accent",
  "--accent-2",
  "--scrim",
  "--radius",
  "--radius-lg",
  "--glass-blur",
  "--glass-bg",
  "--ambient-1",
  "--ambient-2",
  "--chart-grid",
  "--mesh-bg",
  "--font-sans-stack",
  "--font-display-stack",
];

const missing = [];
for (const id of ids) {
  const marker = `[data-theme="${id}"]`;
  const start = css.indexOf(marker);
  if (start < 0) {
    missing.push(`${id}:BLOCK`);
    continue;
  }
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  const block = css.slice(open, close);
  for (const variable of required) {
    if (!block.includes(`${variable}:`)) {
      missing.push(`${id}:${variable}`);
    }
  }
}

if (missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}

console.log(`OK ${ids.length} packs`);
