/** Loader for the compact GTR index in public/data/gtr (built by scripts/build_gtr_index.py). */
export interface GtrMeta {
  built: string;
  gtrFileDate: string | null;
  currentTestsInGtr: number;
  catalogueGenes: number;
  genes_with_tests: number;
  /** [name, country, curatedLabId | null] */
  labs: Array<[string, string, string | null]>;
  genes: Record<string, string>;
}
/** [accession, labIndex, testName, methodFlags, geneCount, lastTouchDate] */
export type GtrTest = [string, number, string, number, number, string];
export interface GtrGene {
  n: number;
  l: number;
  c: string[];
  cap: Record<string, number>;
  t: GtrTest[];
}

const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");
let meta: Promise<GtrMeta> | null = null;
const shards = new Map<string, Promise<Record<string, GtrGene>>>();

export function loadGtrMeta(): Promise<GtrMeta> {
  meta ??= fetch(`${BASE}data/gtr/meta.json`).then((r) => r.json());
  return meta;
}

export async function loadGtrGene(gene: string): Promise<GtrGene | null> {
  const m = await loadGtrMeta();
  const G = gene.toUpperCase();
  const shard = m.genes[G];
  if (!shard) return null;
  let p = shards.get(shard);
  if (!p) {
    p = fetch(`${BASE}data/gtr/${shard}.json`).then((r) => r.json());
    shards.set(shard, p);
  }
  return (await p)[G] ?? null;
}

/** [accession, lab index, test name, methods, last updated] */
export type GtrSpecialTest = [string, number, string, string, string];
export interface GtrSpecial { label: string; badge: string; t: GtrSpecialTest[] }
let specialCache: Promise<Record<string, GtrSpecial>> | null = null;
export function loadGtrSpecial(): Promise<Record<string, GtrSpecial>> {
  specialCache ??= fetch(`${import.meta.env.BASE_URL}data/gtr/special.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return specialCache;
}

export const gtrTestUrl = (accession: string) => `https://www.ncbi.nlm.nih.gov/gtr/tests/${encodeURIComponent(accession)}/`;
