import type { VariantKind } from "./types";

export interface VariantInfo {
  kind: VariantKind;
  /** The text we classified (trimmed) */
  input: string;
  /** Extra hints, for example deep intronic or splice */
  hints: string[];
}

const EXON = /\bex(?:on)?s?(?:\b|(?=\d))|Δ\s*\d/i;

/**
 * Classify a variant written as HGVS (c./p./g./m.) or in plain words.
 * Order matters: mitochondrial and repeat words win over generic deletion words.
 */
export function classifyVariant(raw: string | null | undefined): VariantInfo {
  const input = (raw ?? "").trim();
  const s = input.toLowerCase();
  const hints: string[] = [];
  const out = (kind: VariantKind): VariantInfo => ({ kind, input, hints });
  if (!s) return out("unknown");

  // Mitochondrial DNA: m.3243A>G, MT-ND1, "mtDNA deletion"
  if (/(^|[\s:(])m\.\d/.test(s) || /\bmt-[a-z0-9]+/.test(s) || /\bmtdna\b|mitochondrial dna/.test(s)) return out("mtdna");

  // Repeat expansions: "(CGG)n", "CAG repeat", "expansion", "repeats", "GAA x 600"
  if (/repeat|expan|\((?:[acgt]{2,6})\)\s*(?:n|\d)|\b(cgg|cag|ctg|gaa|ccg|cctg|ggggcc|gcn|gcg)\b\s*(x|×|\d|n\b)/.test(s) || /\[\d{2,}\]/.test(s)) {
    return out("repeat");
  }

  // Methylation / imprinting / UPD
  if (/methylat|imprint|\bupd\b|uniparental|epimutation/.test(s)) return out("methylation");

  // Big chromosome changes: cytobands, microdeletion, arr[...], whole gene deletion, Mb sizes
  if (/\barr\[|microdel|microdup|\b\d{1,2}[pq]\d{1,2}(\.\d+)?\b|\bmb\b|megabase|whole[- ]gene|entire gene|contiguous|copy number|\bcnv\b|chromosom|trisomy|monosomy|translocation/.test(s)) {
    return out("large_cnv");
  }

  // Exon-level deletion or duplication: "deletion of exons 45-50", "del ex45-52", "exon 2 dup",
  // "Δ45-50", HGVS with uncertain breakpoints c.(6438+1_6439-1)_(7098+1_7099-1)del
  const delDupWord = /\bdel(etion|eted)?s?\b|\bdup(lication|licated)?s?\b|\bmissing\b|\bextra\b|\bdel\d|\bdup\d/;
  if ((EXON.test(input) && (delDupWord.test(s) || /Δ/.test(input))) || /c\.\([^)]*\)_\([^)]*\)(del|dup)/.test(s)) {
    return out("exon_cnv");
  }

  // HGVS-style sequence changes
  if (/(^|[\s:(])[cgnr]\.|(^|[\s:(])p\./.test(s)) {
    if (/[+-]\d{3,}/.test(s)) hints.push("deep_intronic");
    else if (/\d[+-]\d{1,2}[acgt]?(>|del|dup|ins)/.test(s)) hints.push("splice");
    if (/delins|del|dup|ins|fs\b|fs\*|frameshift/.test(s)) return out("indel");
    if (/>|\b[a-z]{3}\d+[a-z]{3}\b|\b[a-z]\d+[a-z*]\b|ter\b|\*|=/.test(s)) return out("snv");
    return out("unknown");
  }

  // Plain words for small changes
  if (/frameshift|small (deletion|insertion|duplication)|indel|insertion/.test(s)) return out("indel");
  if (/missense|nonsense|stop[- ]gain|point|single[- ](letter|base|nucleotide)|\bsnv\b|substitution|splice|spelling/.test(s)) {
    if (/splice/.test(s)) hints.push("splice");
    return out("snv");
  }
  // Legacy protein shorthand like R553X, G542X, F508del
  if (/^[a-z]\d+([a-z]|x|\*)$/i.test(input.replace(/\s/g, ""))) return out("snv");
  if (/^[a-z]\d+del$/i.test(input.replace(/\s/g, ""))) return out("indel");
  // Bare "deletion"/"duplication" without exon or size: most likely missing or extra exons in a gene
  if (delDupWord.test(s)) return out("exon_cnv");
  return out("unknown");
}
