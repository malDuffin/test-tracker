import type { Abilities, Ability, VariantKind, Verdict } from "./types";

export interface CoverageResult {
  verdict: Verdict;
  /** Needed kinds the test can find */
  found: VariantKind[];
  /** Needed kinds the test cannot find */
  missing: VariantKind[];
  /** Needed kinds where it is unclear or only partly covered */
  unclear: VariantKind[];
  /** Why, as a short i18n key */
  reason: string;
}

/**
 * Coverage verdict, judged by gene AND kind of change.
 * - geneIncluded false: No. null: Unknown (ask the lab).
 * - Yes: the test finds every needed kind.
 * - No: the test cannot find the main kind (the first in `needed`) and finds none of the others.
 * - Unknown: nothing is clearly found or clearly missing.
 * - Partly: anything in between.
 */
export function judgeCoverage(abilities: Abilities, geneIncluded: boolean | null, needed: VariantKind[]): CoverageResult {
  const base = { found: [] as VariantKind[], missing: [] as VariantKind[], unclear: [] as VariantKind[] };
  if (geneIncluded === false) return { ...base, verdict: "no", reason: "This test does not include the gene." };
  if (geneIncluded === null) return { ...base, verdict: "unknown", reason: "We could not check if this test includes the gene. Ask the lab." };
  const kinds = needed.filter((k) => k !== "unknown");
  if (kinds.length === 0) return { ...base, verdict: "unknown", reason: "We do not know what kind of change to look for." };
  for (const k of kinds) {
    const a: Ability = (abilities as Record<string, Ability | undefined>)[k] ?? "unknown";
    if (a === "yes") base.found.push(k);
    else if (a === "no") base.missing.push(k);
    else base.unclear.push(k);
  }
  if (base.found.length === kinds.length) return { ...base, verdict: "yes", reason: "Includes the gene and looks for the kinds of change that matter here." };
  if (base.missing.includes(kinds[0]) && base.found.length === 0) {
    return { ...base, verdict: "no", reason: "Includes the gene, but cannot find the main kind of change for this condition." };
  }
  if (base.found.length === 0 && base.missing.length === 0) {
    return { ...base, verdict: "unknown", reason: "Includes the gene, but we could not check which kinds of change it finds. Ask the lab." };
  }
  return { ...base, verdict: "partly", reason: "Includes the gene, but may miss some kinds of change." };
}

// GTR method flags (must match scripts/build_gtr_index.py)
export const F_SEQ = 1, F_SEQ_PART = 2, F_DELDUP = 4, F_REPEAT = 8, F_METH = 16, F_TARGETED = 32, F_CYTO = 64, F_RNA = 128, F_UPD = 256;

/**
 * Turn a GTR test's listed methods into abilities for one gene.
 * GTR lists methods per test, not per gene. For focused tests (3 genes or fewer) an unlisted
 * repeat or methylation method means the test does not do it. For bigger panels it is unclear.
 */
export function abilitiesFromGtr(flags: number, geneCount: number, gene: string): Abilities {
  const focused = geneCount <= 3;
  const a: Abilities = {};
  if (flags & F_SEQ) { a.snv = "yes"; a.indel = "yes"; }
  else if (flags & (F_SEQ_PART | F_TARGETED)) { a.snv = "partial"; a.indel = "partial"; }
  a.exon_cnv = flags & F_DELDUP ? "yes" : "unknown";
  a.large_cnv = flags & F_CYTO ? "yes" : "unknown";
  if (flags & F_REPEAT) a.repeat = focused ? "yes" : "unknown";
  else a.repeat = focused ? "no" : "unknown";
  if (flags & (F_METH | F_UPD)) a.methylation = focused ? "yes" : "unknown";
  else a.methylation = focused ? "no" : "unknown";
  if (/^MT-/i.test(gene)) a.mtdna = flags & (F_SEQ | F_SEQ_PART | F_TARGETED) ? (flags & F_SEQ ? "yes" : "partial") : "unknown";
  return a;
}
