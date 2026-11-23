import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { LABS, OFFERS } from "../src/data/labs";
import { PROGRAMMES, matchProgrammes } from "../src/data/programmes";
import { PUBLIC_ROUTES } from "../src/data/publicRoutes";
import { KITS } from "../src/data/consumer";
import { Catalogue } from "../src/lib/catalogue";

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isUrl = (s: string) => /^https:\/\//.test(s);

describe("data: every row has a source and a date", () => {
  it("prices", () => {
    const prices = [...OFFERS.flatMap((o) => o.prices), ...LABS.flatMap((l) => l.panelPrices ?? []), ...KITS.flatMap((k) => k.prices)];
    expect(prices.length).toBeGreaterThan(30);
    for (const p of prices) {
      expect(isUrl(p.source.url), p.what).toBe(true);
      expect(isDate(p.source.checked)).toBe(true);
      if (p.badge !== "request") expect(p.amount, p.what).toBeTruthy();
    }
  });
  it("programmes and public routes", () => {
    for (const p of PROGRAMMES) expect(isUrl(p.source.url)).toBe(true);
    for (const r of PUBLIC_ROUTES) expect(r.sources.every((s) => isUrl(s.url) && isDate(s.checked))).toBe(true);
  });
  it("every offer points at a known lab", () => {
    for (const o of OFFERS) expect(LABS.some((l) => l.id === o.labId), o.id).toBe(true);
  });
});

describe("programme matching", () => {
  it("Decode Duchenne for DMD in the US, flagged for the UK", () => {
    expect(matchProgrammes({ genes: ["DMD"], name: "Duchenne muscular dystrophy", symptoms: [], country: "US" })[0].programme.id).toBe("decode-duchenne");
    const gb = matchProgrammes({ genes: ["DMD"], name: "Duchenne muscular dystrophy", symptoms: [], country: "GB" }).find((m) => m.programme.id === "decode-duchenne");
    expect(gb?.inCountry).toBe(false);
  });
  it("Detect MD excludes FSHD", () => {
    const m = matchProgrammes({ genes: ["DUX4"], name: "Facioscapulohumeral muscular dystrophy", symptoms: [], country: "US" });
    expect(m.some((x) => x.programme.id === "detect-mdys")).toBe(false);
  });
  it("Behind the Seizure for early seizures", () => {
    expect(matchProgrammes({ genes: [], name: null, symptoms: ["seizures"], country: "US" }).some((x) => x.programme.id === "behind-the-seizure")).toBe(true);
  });
});

describe("generated data", () => {
  const root = path.resolve(__dirname, "..");
  const cat = JSON.parse(readFileSync(path.join(root, "public/data/catalogue.json"), "utf8"));
  const c = new Catalogue(cat.c);
  it("catalogue resolves names, aliases and genes", () => {
    expect(c.resolve("Duchenne muscular dystrophy", null)?.genes).toContain("DMD");
    expect(c.resolve(null, "KDM5B")?.genes).toContain("KDM5B");
    expect(c.search("duch")[0].c.label).toMatch(/Duchenne/i);
    expect(c.search("DMD").length).toBeGreaterThan(0);
  });
  it("GTR index covers almost all catalogue genes and stays small", () => {
    const meta = JSON.parse(readFileSync(path.join(root, "public/data/gtr/meta.json"), "utf8"));
    expect(meta.genes_with_tests / meta.catalogueGenes).toBeGreaterThan(0.98);
    expect(meta.genes.DMD).toBeTruthy();
    const dir = path.join(root, "public/data/gtr");
    const total = readdirSync(dir).reduce((s, f) => s + statSync(path.join(dir, f)).size, 0);
    expect(total).toBeLessThan(6 * 1024 * 1024);
  });
});

describe("copy rules", () => {
  it("no em dashes in UI source or data", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
    const files = [...walk(path.resolve(__dirname, "../src")), path.resolve(__dirname, "../index.html")];
    for (const f of files) expect(readFileSync(f, "utf8").includes("\u2014"), f).toBe(false);
  });
  it("never uses the personal address", () => {
    const app = readFileSync(path.resolve(__dirname, "../src/App.tsx"), "utf8");
    expect(app).toContain("team@rarediseaseplanet.com");
    expect(app.includes("malachyduffin")).toBe(false);
  });
});
