#!/usr/bin/env node
/**
 * Collects every English UI string (i18n key) into public/i18n/en.json.
 * Sources: t("...") calls in src, plus plain-language strings in data files that the UI passes
 * through t() (rules, symptoms, public routes, consumer kit lines, coverage reasons, labels).
 * Lab, test and programme details are not collected: they stay in English on purpose.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const walk = (d) => fs.readdirSync(d).flatMap((f) => (fs.statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
const files = walk(path.join(ROOT, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const keys = new Set();
const lit = /"((?:[^"\\]|\\.)*)"/g;
const unescape = (s) => JSON.parse(`"${s}"`);

for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(unescape(m[1]));
}
// Data files whose plain strings are shown through t()
const DATA = ["src/lib/rules.ts", "src/lib/coverage.ts", "src/data/symptoms.ts", "src/data/publicRoutes.ts", "src/lib/format.ts"];
const SKIP_PROP = /\b(url|label|id|name|country|nation|checked)\s*:\s*$/;
for (const rel of DATA) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  for (const m of src.matchAll(lit)) {
    const s = unescape(m[1]);
    const before = src.slice(Math.max(0, m.index - 40), m.index);
    if (!/[a-z]/i.test(s) || !/\s/.test(s) || /^https?:/.test(s) || s.startsWith("@/") || s.startsWith("./")) continue;
    if (SKIP_PROP.test(before)) continue;
    keys.add(s);
  }
}
// consumer kitLine texts and parts
const consumer = fs.readFileSync(path.join(ROOT, "src/data/consumer.ts"), "utf8");
for (const m of consumer.matchAll(/text: "((?:[^"\\]|\\.)*)"/g)) keys.add(unescape(m[1]));
for (const s of ["repeats", "methylation", "missing or extra pieces"]) keys.add(s);
// Short labels passed through t() from arrays
for (const s of ["Yes", "No", "Not sure", "Partly", "Unknown", "I know the condition or gene", "No diagnosis yet"]) keys.add(s);
// Programme sponsor note
keys.add("Free sponsored programmes are paid for by drug companies. They usually receive anonymised (de-identified) results and your clinician's contact details.");
// Symptom label/panel (label: is skipped above)
const sym = fs.readFileSync(path.join(ROOT, "src/data/symptoms.ts"), "utf8");
for (const m of sym.matchAll(/label: "((?:[^"\\]|\\.)*)"/g)) keys.add(unescape(m[1]));

const sorted = [...keys].filter((k) => k.trim()).sort();
const out = Object.fromEntries(sorted.map((k) => [k, k]));
fs.writeFileSync(path.join(ROOT, "public/i18n/en.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`${sorted.length} strings, ${sorted.join(" ").split(/\s+/).length} words`);
