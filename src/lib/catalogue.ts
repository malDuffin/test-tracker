import type { ConditionLike } from "./rules";

/** Row in public/data/catalogue.json: [label, genes, aliases, kind] */
export type CatRow = [string, string[], string[], string];
export interface Condition extends ConditionLike {
  aliases: string[];
}

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export class Catalogue {
  readonly conditions: Condition[];
  private index: Array<{ key: string; c: Condition; alias: boolean }> = [];
  private byGene = new Map<string, Condition[]>();

  constructor(rows: CatRow[]) {
    this.conditions = rows.map(([label, genes, aliases, kind]) => ({ label, genes, aliases, kind }));
    for (const c of this.conditions) {
      this.index.push({ key: norm(c.label), c, alias: false });
      for (const a of c.aliases) this.index.push({ key: norm(a), c, alias: true });
      for (const g of c.genes) {
        const list = this.byGene.get(g.toUpperCase()) ?? [];
        list.push(c);
        this.byGene.set(g.toUpperCase(), list);
      }
    }
  }

  /** Exact name or alias match first, then gene symbol. */
  resolve(name: string | null, gene: string | null): Condition | null {
    if (name) {
      const k = norm(name);
      const hit = this.index.find((e) => e.key === k && !e.alias) ?? this.index.find((e) => e.key === k);
      if (hit) {
        if (gene && !hit.c.genes.includes(gene.toUpperCase()) && hit.c.genes.length) {
          // Name and gene disagree: prefer a row with both, else keep the name's row
          const both = this.forGene(gene).find((c) => norm(c.label) === k || c.aliases.some((a) => norm(a) === k));
          return both ?? hit.c;
        }
        return hit.c;
      }
    }
    if (gene) {
      const list = this.forGene(gene);
      if (list.length) return list[0];
    }
    return null;
  }

  forGene(gene: string): Condition[] {
    return this.byGene.get(gene.toUpperCase()) ?? [];
  }

  isKnownGene(gene: string): boolean {
    return this.byGene.has(gene.toUpperCase());
  }

  /** Search box: prefix and word matches on names, aliases and gene symbols. */
  search(q: string, limit = 12): Array<{ c: Condition; matched: string }> {
    const k = norm(q);
    if (k.length < 2) return [];
    const out: Array<{ c: Condition; matched: string; score: number }> = [];
    const seen = new Set<Condition>();
    const G = q.trim().toUpperCase();
    for (const c of this.byGene.get(G) ?? []) {
      seen.add(c);
      out.push({ c, matched: G, score: 0 });
    }
    for (const e of this.index) {
      if (seen.has(e.c)) continue;
      let score = -1;
      if (e.key === k) score = e.alias ? 2 : 1;
      else if (e.key.startsWith(k)) score = e.alias ? 4 : 3;
      else if (e.key.includes(` ${k}`)) score = e.alias ? 6 : 5;
      else if (k.length >= 4 && e.key.includes(k)) score = 7;
      if (score < 0) continue;
      seen.add(e.c);
      out.push({ c: e.c, matched: e.alias ? e.key : e.c.label, score });
    }
    return out.sort((a, b) => a.score - b.score || a.c.label.length - b.c.label.length).slice(0, limit);
  }
}

const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");
let loading: Promise<Catalogue> | null = null;
export function loadCatalogue(): Promise<Catalogue> {
  loading ??= fetch(`${BASE}data/catalogue.json`)
    .then((r) => r.json())
    .then((d: { c: CatRow[] }) => new Catalogue(d.c));
  return loading;
}
