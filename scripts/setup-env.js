/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const webpush = require("web-push");

const path = ".env.local";
const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

if (!resendKey) {
  console.error("Missing RESEND_API_KEY");
  process.exit(1);
}

const keys = webpush.generateVAPIDKeys();

const content = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const lines = content.split(/\r?\n/).filter(Boolean);
const map = new Map(
  lines.map((line) => {
    const index = line.indexOf("=");
    return index > -1
      ? [line.slice(0, index), line.slice(index + 1)]
      : [line, ""];
  }),
);

const upsert = (key, value) => {
  map.set(key, value);
};

upsert("RESEND_API_KEY", resendKey);
upsert("RESEND_FROM", resendFrom);
upsert("NEXT_PUBLIC_VAPID_PUBLIC_KEY", keys.publicKey);
upsert("VAPID_PRIVATE_KEY", keys.privateKey);
upsert("VAPID_SUBJECT", `mailto:${resendFrom}`);

const output = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("\n");
fs.writeFileSync(path, output);
