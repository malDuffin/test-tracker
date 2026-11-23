/**
 * Builds public/data/catalogue.json from the suite's existing catalogues, so condition
 * search in Test Tracker uses the same names and aliases as Variant Visual and
 * Rare Disease Planet. Run with bun (it understands the TypeScript sources):
 *
 *   VV_REPO=../ee-repo RDP_REPO=../rdp-repo bun scripts/sync-catalogue.ts
 *
 * Output (compact): { generated, sources, c: [[label, genes[], aliases[], kind]] }
 * kind: "g" gene, "rd"/"rp" region deletion/duplication, "m" mitochondrial DNA,
 *       "n" not usually caused by one gene change.
 */
import { writeFileSync } from "fs";
import path from "path";

const VV = path.resolve(process.env.VV_REPO ?? path.join(import.meta.dir, "../../ee-repo"));
const RDP = path.resolve(process.env.RDP_REPO ?? path.join(import.meta.dir, "../../rdp-repo"));

const vv = await import(path.join(VV, "src/data/diseaseGenes.ts"));
const rdpGenes = await import(path.join(RDP, "src/lib/catalogue/data/genes/gene-by-disease.ts"));
const rdpMulti = await import(path.join(RDP, "src/lib/catalogue/data/genes/genes-by-disease.ts"));
const rdpNon = await import(path.join(RDP, "src/lib/catalogue/data/genes/non-genetic-diseases.ts"));

type Row = [string, string[], string[], string];
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const canon = (g: string): string => (vv.canonicaliseGeneSymbol ? vv.canonicaliseGeneSymbol(g) : g).toUpperCase();

const rows: Row[] = [];
const byName = new Map<string, Row>();

for (const e of vv.DISEASE_GENES as any[]) {
  const genes = [...new Set((e.genes ?? []).map((g: string) => canon(g)).filter(Boolean))] as string[];
  let kind = "g";
  if (e.nonGeneContext) kind = "n";
  else if (e.regionContext) kind = e.regionContext.kind === "region-duplication" ? "rp" : "rd";
  else if (genes.length && genes.every((g) => vv.isMitochondrialGeneSymbol?.(g) || /^MT-/i.test(g))) kind = "m";
  const aliases = [...new Set((e.aliases ?? []).map((a: string) => a.trim()).filter((a: string) => a && norm(a) !== norm(e.label)))].slice(0, 40) as string[];
  const row: Row = [e.label, kind === "n" ? [] : genes, aliases, kind];
  const key = norm(e.label);
  if (byName.has(key)) continue;
  byName.set(key, row);
  rows.push(row);
}

let rdpAdded = 0;
const addRdp = (label: string, genes: string[], kind: string) => {
  const key = norm(label);
  if (byName.has(key)) return;
  // Already reachable as an alias of a VV row?
  for (const r of rows) if (r[2].some((a) => norm(a) === key)) return;
  const row: Row = [label, genes.map(canon), [], kind];
  byName.set(key, row);
  rows.push(row);
  rdpAdded++;
};
for (const [label, gene] of Object.entries(rdpGenes.GENE_BY_DISEASE_SOURCE as Record<string, string>)) addRdp(label, [gene], /^MT-/i.test(gene) ? "m" : "g");
for (const [label, genes] of Object.entries(rdpMulti.GENES_BY_DISEASE_SOURCE as Record<string, string[]>)) addRdp(label, genes, "g");
for (const label of rdpNon.NON_GENETIC_DISEASE_NAMES as string[]) addRdp(label, [], "n");

const vvHead = Bun.spawnSync(["git", "-C", VV, "rev-parse", "--short", "HEAD"]).stdout.toString().trim();
const rdpHead = Bun.spawnSync(["git", "-C", RDP, "rev-parse", "--short", "HEAD"]).stdout.toString().trim();
const out = {
  generated: new Date().toISOString().slice(0, 10),
  sources: { variantVisual: `malDuffin/exon-switch-dystrophin-click@${vvHead}`, rareDiseasePlanet: `malDuffin/rare-disease-planet-4c36e611@${rdpHead}` },
  c: rows,
};
const file = path.join(import.meta.dir, "../public/data/catalogue.json");
writeFileSync(file, JSON.stringify(out));
const genes = new Set(rows.flatMap((r) => r[1]));
console.log(`conditions=${rows.length} (rdp-only ${rdpAdded}) genes=${genes.size} kinds=`, rows.reduce((m: any, r) => ((m[r[3]] = (m[r[3]] ?? 0) + 1), m), {}));
writeFileSync(path.join(import.meta.dir, "../scripts/.catalogue-genes.txt"), [...genes].sort().join("\n"));
