/** Kinds of genetic change. Each needs the right kind of test to find it. */
export type VariantKind =
  | "snv" // single-letter change (spelling mistake)
  | "indel" // small missing or extra letters
  | "exon_cnv" // missing or extra exons (deletion/duplication)
  | "large_cnv" // big missing or extra piece of a chromosome (microdeletion etc.)
  | "repeat" // repeat expansion
  | "mtdna" // change in the mitochondrial DNA
  | "methylation" // imprinting / methylation change
  | "unknown";

/** What a test can do for one kind of change. */
export type Ability = "yes" | "partial" | "no" | "unknown";
export type Abilities = Partial<Record<Exclude<VariantKind, "unknown">, Ability>>;

export type Verdict = "yes" | "partly" | "no" | "unknown";

export interface Source {
  url: string;
  /** ISO date the page was read */
  checked: string;
  label?: string;
}

export type PriceBadge = "lab" | "charity" | "clinic" | "sale" | "income" | "request";

export interface Price {
  /** Plain description, for example "One person" */
  what: string;
  /** Amount text as published, for example "900" or "800 to 1,000" (no currency symbol) */
  amount?: string;
  currency?: "USD" | "GBP" | "EUR";
  badge: PriceBadge;
  source: Source;
  note?: string;
}
