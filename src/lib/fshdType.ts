/**
 * FSHD type picker: shared ids, display format, parsing and link params.
 *
 * Families pick one of eight types (Unknown by default) or Other. The choice
 * is stored in the existing variant text, as a readable string:
 *
 *   FSHD1: 6 RU                   FSHD2 (SMCHD1): c.1876A>G
 *   FSHD1 + FSHD2: 9 RU, SMCHD1 c.1876A>G
 *   Mosaic FSHD1: 4 RU            Custom: EcoRI/BlnI fragment 24 kb
 *   FSHD1 with a 4q deletion: 3 RU
 *
 * "FSHD1 with a 4q deletion" covers deletions at 4q35 that remove DNA just
 * before (proximal to) the D4Z4 region, sometimes with part of it, known as
 * D4Z4 proximally extended deletions (DPED). They can remove the usual
 * Southern blot probe site (p13E-11), so a standard EcoRI test can miss them
 * or give no readable size; optical genome mapping, molecular combing or
 * long-read testing show them better (Sasaki-Honda et al., J Hum Genet 2025).
 *
 * Unknown stores nothing (blank). Other keeps exactly what the family typed
 * after "Custom: " (only trimmed), so it can be sorted into a new type later.
 * Older free text is read at display time only; nothing stored is rewritten.
 * Text that does not clearly match one type is shown as Other (Custom).
 *
 * Kept in step with the same file in Rare Disease Planet (src/lib/fshd-type.ts).
 * Test Tracker copy: from Variant Visual main (src/lib/fshdType.ts, commit b411bbd). Do not edit
 * here only; change all three apps together.
 * This file has no imports so any module can use it without a cycle.
 */

export const FSHD_TYPE_IDS = [
  "unknown",
  "fshd1",
  "fshd2-smchd1",
  "fshd2-dnmt3b",
  "fshd2-lrif1",
  "fshd1-fshd2",
  "fshd1-mosaic",
  "fshd1-4q-deletion",
  "custom",
] as const;
export type FshdTypeId = (typeof FSHD_TYPE_IDS)[number];

export type FshdHaplotype = "4qA" | "4qB" | "4A166";

export type FshdVariant = {
  type: FshdTypeId;
  /** D4Z4 repeat units, when given. */
  ru: number | null;
  /** 4q haplotype, when the stored text names one. */
  hap: FshdHaplotype | null;
  /** Gene change wording for FSHD2 types and the combined type (e.g. "c.1876A>G"). */
  change: string | null;
  /** Other: exactly what the family typed (trimmed), without the "Custom: " prefix. */
  custom: string | null;
};

export const EMPTY_FSHD_VARIANT: FshdVariant = { type: "unknown", ru: null, hap: null, change: null, custom: null };

export function isFshdTypeId(v: unknown): v is FshdTypeId {
  return typeof v === "string" && (FSHD_TYPE_IDS as readonly string[]).includes(v);
}

/** Modifier gene for each FSHD2 type (the combined type is usually SMCHD1). */
export const FSHD_TYPE_GENE: Partial<Record<FshdTypeId, "SMCHD1" | "DNMT3B" | "LRIF1">> = {
  "fshd2-smchd1": "SMCHD1",
  "fshd2-dnmt3b": "DNMT3B",
  "fshd2-lrif1": "LRIF1",
  "fshd1-fshd2": "SMCHD1",
};

/** Types that use the repeat-units box. */
export function fshdTypeUsesRepeats(type: FshdTypeId): boolean {
  return type === "fshd1" || type === "fshd1-fshd2" || type === "fshd1-mosaic" || type === "fshd1-4q-deletion";
}

/** Types that use the gene change box. */
export function fshdTypeUsesChange(type: FshdTypeId): boolean {
  return type === "fshd2-smchd1" || type === "fshd2-dnmt3b" || type === "fshd2-lrif1" || type === "fshd1-fshd2";
}

/** Canonical English prefix stored for each type. */
const PREFIX: Record<Exclude<FshdTypeId, "unknown" | "custom">, string> = {
  fshd1: "FSHD1",
  "fshd2-smchd1": "FSHD2 (SMCHD1)",
  "fshd2-dnmt3b": "FSHD2 (DNMT3B)",
  "fshd2-lrif1": "FSHD2 (LRIF1)",
  "fshd1-fshd2": "FSHD1 + FSHD2",
  "fshd1-mosaic": "Mosaic FSHD1",
  "fshd1-4q-deletion": "FSHD1 with a 4q deletion",
};

/** True for the FSHD umbrella and its numbered / acronym names. */
export function isFshdName(name: string | null | undefined): boolean {
  const n = (name ?? "").trim().toLowerCase().replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, " ");
  if (!n) return false;
  return (
    /^facioscapulohumeral(?: muscular)? dystrophy(?:,? (?:type )?[1-4])?$/.test(n) ||
    /^fshd(?: ?-? ?(?:type )?[1-4])?$/.test(n) ||
    /^landouzy[- ]d[eé]j[eé]rine(?: (?:disease|syndrome|dystrophy))?$/.test(n)
  );
}

function cleanRu(n: number | null | undefined): number | null {
  return n != null && Number.isFinite(n) && n >= 1 && n <= 999 ? Math.round(n) : null;
}

/** Stored string for a picker value. Unknown (and empty Other) store nothing. */
export function formatFshdVariant(v: FshdVariant): string | null {
  if (v.type === "unknown") return null;
  if (v.type === "custom") {
    const text = (v.custom ?? "").trim();
    return text ? `Custom: ${text}` : null;
  }
  const prefix = PREFIX[v.type];
  const parts: string[] = [];
  const ru = fshdTypeUsesRepeats(v.type) ? cleanRu(v.ru) : null;
  if (ru != null) parts.push(`${ru} RU`);
  if (v.hap) parts.push(v.hap);
  const change = fshdTypeUsesChange(v.type) ? (v.change ?? "").trim() : "";
  if (change) parts.push(change);
  return parts.length ? `${prefix}: ${parts.join(", ")}` : prefix;
}

/**
 * Estimate D4Z4 repeat units from an EcoRI fragment size in kb, using the
 * common rule (kb - 5) / 3.3, rounded. Only an estimate. Null when the size
 * cannot be read or gives less than one unit.
 */
export function estimateRuFromKb(kb: number | string | null | undefined): number | null {
  const n = typeof kb === "string" ? Number.parseFloat(kb.replace(",", ".")) : kb;
  if (n == null || !Number.isFinite(n) || n <= 0 || n > 400) return null;
  const ru = Math.round((n - 5) / 3.3);
  return ru >= 1 ? ru : null;
}

const HAP_RE = /\b(4qA|4qB|4A166)\b/i;
function readHap(text: string): FshdHaplotype | null {
  const m = HAP_RE.exec(text);
  if (!m) return null;
  const v = m[1]!.toLowerCase();
  return v === "4qa" ? "4qA" : v === "4qb" ? "4qB" : "4A166";
}

const GENE_RE = /\b(SMCHD1|DNMT3B|LRIF1)\b/i;
const HGVS_RE = /\b[cgp]\.\(?[0-9*_+\-?A-Za-z>()=]+\)?/;

/** The short c. / g. / p. change inside a line of text, or null. */
export function fshdChangeFromText(text: string | null | undefined): string | null {
  return HGVS_RE.exec(text ?? "")?.[0] ?? null;
}

/** SMCHD1 / DNMT3B / LRIF1 named in a line of text, or null. */
export function fshdGeneFromText(text: string | null | undefined): "SMCHD1" | "DNMT3B" | "LRIF1" | null {
  return (GENE_RE.exec(text ?? "")?.[1]?.toUpperCase() as "SMCHD1" | "DNMT3B" | "LRIF1" | undefined) ?? null;
}

/** Read the canonical strings written by formatFshdVariant. */
function parseCanonical(text: string): FshdVariant | null {
  const custom = /^custom\s*:\s*([\s\S]*)$/i.exec(text);
  if (custom) return { ...EMPTY_FSHD_VARIANT, type: "custom", custom: custom[1]!.trim() || null };
  const entries = (Object.entries(PREFIX) as [Exclude<FshdTypeId, "unknown" | "custom">, string][])
    // Longest first, so "FSHD1 + FSHD2" wins over "FSHD1".
    .sort((a, b) => b[1].length - a[1].length);
  for (const [type, prefix] of entries) {
    const lower = text.toLowerCase();
    const p = prefix.toLowerCase();
    if (lower === p) return { ...EMPTY_FSHD_VARIANT, type };
    if (!lower.startsWith(`${p}:`)) continue;
    let rest = text.slice(prefix.length + 1).trim();
    let ru: number | null = null;
    let hap: FshdHaplotype | null = null;
    if (fshdTypeUsesRepeats(type)) {
      const m = /^(\d{1,3})\s*RU\b\s*,?\s*/i.exec(rest);
      if (m) {
        ru = cleanRu(Number(m[1]));
        rest = rest.slice(m[0].length);
      }
    }
    const h = /^(4qA|4qB|4A166)\b\s*,?\s*/i.exec(rest);
    if (h) {
      hap = readHap(h[1]!);
      rest = rest.slice(h[0].length);
    }
    rest = rest.trim();
    if (rest && !fshdTypeUsesChange(type)) return null;
    return { type, ru, hap, change: rest || null, custom: null };
  }
  return null;
}

/** Words that carry no extra meaning once the type, units and change are read. */
const FILLER =
  /\b(?:fshd|type|types|d4z4|contraction|contracted|shortened|short|reduced|array|allele|region|repeat|repeats|units?|ru|eu|copies|on|with|and|plus|change|variant|variants|mutation|mutations|pathogenic|likely|heterozygous|het|het\.|gene|in|of|the|a|an|chromosome|chr|4q35|permissive|haplotype|digenic|confirmed|positive|diagnosed|diagnosis|mosaic|mosaicism|both)\b/gi;

/**
 * Read stored variant text into a picker value. Canonical strings first; then
 * older free text, only where it clearly names one type with nothing left
 * over; anything else non-empty is Other (Custom) with the text kept as is.
 */
export function parseFshdVariant(
  variant: string | null | undefined,
  variantCode?: string | null,
): FshdVariant {
  const text = (variant ?? "").replace(/\s+/g, " ").trim() || (variantCode ?? "").replace(/\s+/g, " ").trim();
  if (!text) return { ...EMPTY_FSHD_VARIANT };
  if (/^(?:unknown|not sure|unsure|don'?t know|do not know|n\/?a|undiagnosed|not tested|untested|-|\?)$/i.test(text)) {
    return { ...EMPTY_FSHD_VARIANT };
  }
  const canonical = parseCanonical(text);
  if (canonical) return canonical;

  const t = text.replace(/[\u2010-\u2015\u2212]/g, "-");
  const lower = t.toLowerCase();
  const asCustom: FshdVariant = { ...EMPTY_FSHD_VARIANT, type: "custom", custom: text };

  // Bare number: a D4Z4 repeat count for FSHD (never an exon).
  const bare = /^(\d{1,3})$/.exec(lower);
  if (bare) return { ...EMPTY_FSHD_VARIANT, type: "fshd1", ru: cleanRu(Number(bare[1])) };

  const ruMatch =
    /\b(\d{1,3})\s*(?:d4z4\s*)?(?:ru|eu|repeat units?|units?|repeats?|copies)\b/i.exec(t) ??
    /\bd4z4\s*(?:repeats?|units?|ru)?\s*[:=]?\s*(\d{1,3})\b/i.exec(t);
  const ru = ruMatch ? cleanRu(Number(ruMatch[1])) : null;
  const hap = readHap(t);
  const hgvs = HGVS_RE.exec(t)?.[0] ?? null;
  const geneMatch = GENE_RE.exec(t)?.[1]?.toUpperCase() ?? null;
  const fshd3 = /\bfshd\s*-?\s*(?:type\s*)?(?:3|iii)\b/i.test(t);
  const fshd4 = /\bfshd\s*-?\s*(?:type\s*)?(?:4|iv)\b/i.test(t);
  const gene = geneMatch ?? (fshd3 ? "LRIF1" : fshd4 ? "DNMT3B" : null);
  const combined =
    /\bfshd\s*-?\s*(?:type\s*)?(?:1|i)\s*(?:\+|&|\/|and|plus)\s*(?:fshd\s*-?\s*)?(?:type\s*)?(?:2|ii)\b/i.test(t);
  const type1 = combined || /\bfshd\s*-?\s*(?:type\s*)?(?:1|i)\b/i.test(t) || /\bd4z4\b|\bcontract|\bshorten/i.test(lower) || ru != null;
  const type2 = combined || /\bfshd\s*-?\s*(?:type\s*)?(?:2|ii)\b/i.test(t) || gene != null;
  const mosaic = /\bmosai/i.test(lower);

  // 4q35 deletions next to D4Z4 (DPED): "4q del", "4q35 deletion",
  // "proximal deletion", "proximally extended deletion", "p13E-11 deletion".
  const fourQDeletion =
    /\b4q(?:35(?:\.\d)?)?\s*-?\s*(?:del|dels|deletion|deleted)\b|\bdel\s*\(?\s*4\s*\)?\s*\(?\s*q35/i.test(t) ||
    /\bproximal(?:ly)?\s+(?:extended\s+)?(?:d4z4\s+)?(?:del|deletion)\b|\bdped\b|\bp13e-?11\s+(?:del|deletion)\b/i.test(t);
  if (fourQDeletion) {
    // A named FSHD2 gene or change, mosaicism, or any other detail (a kb
    // size, a methylation level) means more than one thing was reported:
    // keep the text as Custom.
    if (gene || hgvs || mosaic || /\bfshd\s*-?\s*(?:type\s*)?(?:2|ii)\b/i.test(t)) return asCustom;
    const left = t
      .replace(/\bfshd\s*-?\s*(?:type\s*)?(?:1|i)\b/gi, " ")
      .replace(/\bdel\s*\(?\s*4\s*\)?\s*\(?\s*q35(?:\.\d)?\s*\)?/gi, " ")
      .replace(/\b4q(?:35(?:\.\d)?)?\b/gi, " ")
      .replace(/\bp13e-?11\b/gi, " ")
      .replace(/\b(?:del|dels|deletion|deleted|proximal|proximally|extended|dped|d4z4|partial|complete|whole|large|small)\b/gi, " ")
      .replace(HAP_RE, " ")
      .replace(/\b\d{1,3}\s*(?:d4z4\s*)?(?:ru|eu|repeat units?|units?|repeats?|copies)\b/gi, " ")
      .replace(FILLER, " ")
      .replace(/[\s,;:.+&/()-]+/g, " ")
      .trim();
    if (left) return asCustom;
    return { type: "fshd1-4q-deletion", ru, hap, change: null, custom: null };
  }

  // Anything meaningful left after the parts we read means the family said
  // more than one type can hold: keep it as Custom.
  let rest = t
    .replace(/\bfshd\s*-?\s*(?:type\s*)?(?:1|2|3|4|i{1,3}|iv)\b(?:\s*(?:\+|&|\/|and|plus)\s*(?:fshd\s*-?\s*)?(?:type\s*)?(?:2|ii)\b)?/gi, " ")
    .replace(/\bfacioscapulohumeral(?: muscular)? dystrophy\b/gi, " ")
    .replace(HGVS_RE, " ")
    .replace(GENE_RE, " ")
    .replace(HAP_RE, " ")
    .replace(/\bd4z4\b/gi, " ")
    .replace(/\d{1,3}/g, " ")
    .replace(FILLER, " ");
  rest = rest.replace(/[\s,;:.+&/()-]+/g, " ").trim();
  if (rest) return asCustom;

  if (mosaic) {
    // Only a clear mosaic FSHD1 (no FSHD2 gene named) maps to a button.
    return type1 && !type2 ? { type: "fshd1-mosaic", ru, hap, change: null, custom: null } : asCustom;
  }
  if (type1 && type2) {
    const change = hgvs ? `${gene ?? "SMCHD1"} ${hgvs}` : null;
    if (!combined && !gene) return asCustom;
    return { type: "fshd1-fshd2", ru, hap, change, custom: null };
  }
  if (type2) {
    if (!gene) return asCustom; // "FSHD2" alone does not say which gene.
    const type = gene === "SMCHD1" ? "fshd2-smchd1" : gene === "DNMT3B" ? "fshd2-dnmt3b" : "fshd2-lrif1";
    return { type, ru: null, hap, change: hgvs, custom: null };
  }
  if (type1) {
    if (hgvs) return asCustom;
    return { type: "fshd1", ru, hap, change: null, custom: null };
  }
  return asCustom;
}

/** True when the stored text was written by the picker (or is blank). */
export function isCanonicalFshdVariant(variant: string | null | undefined): boolean {
  const text = (variant ?? "").replace(/\s+/g, " ").trim();
  return !text || parseCanonical(text) !== null;
}

/** Plain-language label for a type, in English (UI translates by id). */
export const FSHD_TYPE_LABEL: Record<FshdTypeId, string> = {
  unknown: "Unknown",
  fshd1: "FSHD1",
  "fshd2-smchd1": "FSHD2, SMCHD1 change",
  "fshd2-dnmt3b": "FSHD2, DNMT3B change",
  "fshd2-lrif1": "FSHD2, LRIF1 change",
  "fshd1-fshd2": "FSHD1 and FSHD2 together",
  "fshd1-mosaic": "Mosaic FSHD1",
  "fshd1-4q-deletion": "FSHD1 with a 4q deletion",
  custom: "Other",
};

/**
 * Variant Visual link params for a picker value. Never includes Custom text
 * or a long report: only the type id, units, haplotype and a short change.
 */
export function fshdLinkParams(v: FshdVariant): {
  fshd_type: FshdTypeId | null;
  d4z4_ru: number | null;
  d4z4_hap: FshdHaplotype | null;
  gene: "SMCHD1" | "DNMT3B" | "LRIF1" | null;
  hgvs: string | null;
} {
  const gene = (() => {
    if (v.type === "fshd1-fshd2") {
      const named = GENE_RE.exec(v.change ?? "")?.[1]?.toUpperCase();
      return (named as "SMCHD1" | "DNMT3B" | "LRIF1" | undefined) ?? "SMCHD1";
    }
    return FSHD_TYPE_GENE[v.type] ?? null;
  })();
  const hgvs = fshdTypeUsesChange(v.type) ? HGVS_RE.exec(v.change ?? "")?.[0] ?? null : null;
  return {
    fshd_type: v.type === "unknown" || v.type === "custom" ? null : v.type,
    d4z4_ru: fshdTypeUsesRepeats(v.type) ? cleanRu(v.ru) : null,
    d4z4_hap: v.hap,
    gene,
    hgvs,
  };
}

/**
 * Generic per-condition subtype fields stored on a disease entry, separate
 * from the variant wording and code. For FSHD: condition_subtype is a type id
 * above, condition_subtype_text is the Other wording (kept exactly), and
 * repeat_units / haplotype are the D4Z4 details. Hidden on the public globe
 * whenever the member's variant is private (database migration 20261123210000).
 */
export type SubtypeFields = {
  condition_subtype?: string | null;
  condition_subtype_text?: string | null;
  repeat_units?: number | null;
  haplotype?: string | null;
};

/** Picker value from the stored subtype fields, or null when none is stored. */
export function fshdFromSubtypeFields(f: SubtypeFields | null | undefined): FshdVariant | null {
  const id = (f?.condition_subtype ?? "").trim().toLowerCase();
  if (!isFshdTypeId(id)) return null;
  const hap = readHap(f?.haplotype ?? "");
  return {
    type: id,
    ru: fshdTypeUsesRepeats(id) ? cleanRu(f?.repeat_units ?? null) : null,
    hap: id === "custom" || id === "unknown" ? null : hap,
    change: null,
    custom: id === "custom" ? (f?.condition_subtype_text ?? "").trim() || null : null,
  };
}

/** Subtype fields to store for a picker value. Unknown clears them all. */
export function subtypeFieldsFromFshd(v: FshdVariant): Required<SubtypeFields> {
  if (v.type === "unknown") return { condition_subtype: null, condition_subtype_text: null, repeat_units: null, haplotype: null };
  return {
    condition_subtype: v.type,
    condition_subtype_text: v.type === "custom" ? (v.custom ?? "").trim() || null : null,
    repeat_units: fshdTypeUsesRepeats(v.type) ? cleanRu(v.ru) : null,
    haplotype: v.type === "custom" ? null : v.hap,
  };
}
