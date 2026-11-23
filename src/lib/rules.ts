import type { Source, VariantKind } from "./types";

/**
 * Testing-order rules by condition type. These are general genetics rules, not advice for one
 * person. Every rule links to a public source. Text is English and used as an i18n key, with
 * {{gene}} and {{name}} filled in at display time.
 */
export type Category =
  | "dmd" // Duchenne / Becker: most changes are missing or extra exons
  | "smn1" // SMA: missing SMN1 exon 7, look-alike SMN2 copy
  | "deldup_first" // other conditions where missing/extra pieces are the common cause
  | "repeat" // repeat expansion disorders
  | "methylation" // imprinting disorders
  | "fshd" // FSHD: special D4Z4 test
  | "mtdna" // mitochondrial DNA genes
  | "region" // chromosome region deletion or duplication syndromes
  | "nongene" // not usually caused by one gene change
  | "gene" // default single-gene / multi-gene condition
  | "undiagnosed";

export interface Step {
  title: string;
  why: string;
  /** Values for {{gene}}, {{genes}} placeholders in title/why */
  vars?: Record<string, string>;
}

export interface Note {
  text: string;
  vars?: Record<string, string>;
}

export interface Profile {
  category: Category;
  /** Kinds of change this condition needs a test to find. The first is the main one. */
  needed: VariantKind[];
  steps: Step[];
  /** Extra plain notes, for example look-alike gene copies */
  notes: Note[];
  sources: Source[];
  /** A special test group in public/data/gtr/special.json (for example FSHD1 D4Z4 sizing) */
  specialTests?: string;
  /** Genes to show tests for, when different from the condition's genes */
  genes?: string[];
}

export interface ConditionLike {
  label: string;
  genes: string[];
  /** g gene, rd/rp region deletion/duplication, m mitochondrial DNA, n not one gene */
  kind: string;
}

const CHECKED = "2026-11-23";
export const geneReviews = (gene: string): Source => ({
  url: `https://www.ncbi.nlm.nih.gov/books/NBK1116/?term=${encodeURIComponent(gene)}`,
  checked: CHECKED,
  label: `GeneReviews: ${gene}`,
});
const RESEARCH: Source = {
  url: "https://www.revvity.com/test/Whole-Exome-Sequencing-Proband-Only-D1000",
  checked: CHECKED,
  label: "Exome limits (Revvity D1000 test page)",
};
const ACMG_EXOME: Source = {
  url: "https://doi.org/10.1038/s41436-021-01242-6",
  checked: CHECKED,
  label: "ACMG guideline: exome and genome as a first test for children with developmental delay or birth differences (2021)",
};

/** Genes where a repeat expansion is the usual cause whatever the condition name. */
const REPEAT_GENES = new Set([
  "FMR1", "AFF2", "FXN", "DMPK", "CNBP", "HTT", "JPH3", "ATXN1", "ATXN2", "ATXN3", "ATXN7", "ATXN8OS",
  "ATXN10", "PPP2R2B", "TBP", "ATN1", "C9ORF72", "PABPN1", "NOTCH2NLC", "RFC1", "NOP56", "BEAN1",
  "DAB1", "FGF14", "CSTB", "PHOX2B",
]);
/** Genes that cause a repeat condition only for some condition names (they also cause other conditions). */
const REPEAT_BY_NAME: Array<{ gene: string; name: RegExp }> = [
  { gene: "CACNA1A", name: /spinocerebellar ataxia (type )?6|\bsca6\b/i },
  { gene: "AR", name: /spinal and bulbar|kennedy|\bsbma\b/i },
  { gene: "TCF4", name: /fuchs/i },
  { gene: "ARX", name: /partington/i },
];
const METHYLATION_NAMES = /angelman|prader|beckwith|silver.?russell|temple syndrome|kagami|pseudohypoparathyroidism (type )?1b|transient neonatal diabetes/i;
const FSHD_NAMES = /facioscapulohumeral|\bfshd/i;
/** Conditions where missing or extra pieces of a gene are a common cause (so test for them first). */
const DELDUP_FIRST: Array<{ gene: string; name?: RegExp; label: string }> = [
  { gene: "PMP22", label: "PMP22" },
  { gene: "HBA1", name: /alpha.?thal/i, label: "HBA1/HBA2" },
  { gene: "HBA2", name: /alpha.?thal/i, label: "HBA1/HBA2" },
];
/** Genes with look-alike copies (pseudogenes) that standard tests can misread. */
export const LOOKALIKE_GENES = new Set(["SMN1", "PKD1", "CYP21A2", "GBA1", "GBA", "NCF1", "STRC", "IKBKG", "PMS2", "CHEK2", "HBA1", "HBA2"]);

const gene0 = (c: ConditionLike) => (c.genes[0] ?? "").toUpperCase();

export function profileFor(c: ConditionLike | null): Profile {
  if (!c) return undiagnosedProfile();
  const genes = c.genes.map((g) => g.toUpperCase());
  const notes: Note[] = [];
  const sources: Source[] = genes.slice(0, 3).map(geneReviews);
  const lookalike = genes.find((g) => LOOKALIKE_GENES.has(g));
  if (lookalike) notes.push({ text: "{{gene}} has a look-alike copy elsewhere in our DNA. Some tests cannot read it well. Ask the lab how they test {{gene}}.", vars: { gene: lookalike } });

  if (c.kind === "n") {
    return { category: "nongene", needed: [], notes: [], sources: [], steps: [
      { title: "A genetic test may not help", why: "This condition is not usually caused by one gene change. Talk to your doctor about what tests make sense." },
    ] };
  }
  if (c.kind === "rd" || c.kind === "rp") {
    return { category: "region", needed: ["large_cnv"], notes, sources: [ACMG_EXOME], steps: [
      { title: "First: a chromosome microarray (CMA)", why: "This condition is usually caused by a missing or extra piece of a chromosome. A microarray looks for these. Some exomes and genomes can find them too." },
      { title: "If that is clear: an exome or genome", why: "These read most genes and can find other causes." },
    ] };
  }
  if (c.kind === "m" || genes.some((g) => /^MT-/.test(g))) {
    return { category: "mtdna", needed: ["mtdna"], notes, sources, steps: [
      { title: "A test that reads the mitochondrial DNA", why: "Mitochondria have their own small piece of DNA. Not every exome includes it, so check the test says it reads mitochondrial DNA (mtDNA)." },
      { title: "Ask which sample is best", why: "Some mitochondrial changes are easier to find in urine or muscle than in blood. A genetics clinic can advise." },
    ] };
  }
  if (genes.includes("DMD")) {
    return { category: "dmd", needed: ["exon_cnv", "snv", "indel"], notes, sources: [geneReviews("DMD"), { url: "https://www.parentprojectmd.org/about-duchenne/decode-duchenne/diagnostic-testing/", checked: CHECKED, label: "Parent Project Muscular Dystrophy: Decode Duchenne" }], steps: [
      { title: "First: a test for missing or extra exons (MLPA or similar)", why: "Most changes that cause Duchenne and Becker are missing or extra exons. This test finds them." },
      { title: "If that is clear: full sequencing of the DMD gene", why: "This reads every letter of the gene's exons and finds small changes." },
      { title: "If still no answer: ask about RNA or muscle testing", why: "A few changes hide deep inside the gene. A specialist can say if more testing helps." },
    ] };
  }
  if (genes.includes("SMN1")) {
    return { category: "smn1", needed: ["exon_cnv", "snv"], notes, sources, steps: [
      { title: "First: an SMN1 copy number test", why: "Most people with SMA are missing part of both SMN1 copies (exon 7). A special test counts SMN1 copies. Many exomes cannot do this because SMN1 has a look-alike copy, SMN2." },
      { title: "If only one copy is missing: SMN1 sequencing", why: "Some people have one missing copy and a small change in the other copy." },
    ] };
  }
  if (FSHD_NAMES.test(c.label) || genes.includes("DUX4")) {
    // Same as the "Unknown" option in src/data/subtypes.ts (FSHD type toggles).
    return { category: "fshd", needed: ["d4z4"], notes, specialTests: "fshd-d4z4", genes: ["SMCHD1", "DNMT3B", "LRIF1", "DUX4"], sources: [{ url: "https://www.ncbi.nlm.nih.gov/books/NBK1443/", checked: CHECKED, label: "GeneReviews: Facioscapulohumeral Muscular Dystrophy" }], steps: [
      { title: "First: a D4Z4 sizing test (optical genome mapping, Southern blot or molecular combing)", why: "FSHD1 is caused by a shortened D4Z4 region on chromosome 4 (4q35). Only these special tests can measure it. Standard gene panels, exomes, genomes and consumer DNA kits cannot measure D4Z4." },
      { title: "If the D4Z4 size is normal: testing for FSHD2", why: "FSHD2 is usually caused by a change in SMCHD1, and more rarely DNMT3B or LRIF1. It also needs a permissive 4qA version of chromosome 4 and low D4Z4 methylation, so ask the lab about 4qA and D4Z4 methylation testing too." },
    ] };
  }
  const repeatGene = genes.find((g) => REPEAT_GENES.has(g)) ?? REPEAT_BY_NAME.find((r) => genes.includes(r.gene) && r.name.test(c.label))?.gene;
  if (repeatGene) {
    return { category: "repeat", needed: repeatGene === "FMR1" ? ["repeat", "methylation"] : ["repeat"], notes, sources: [geneReviews(repeatGene), RESEARCH], steps: [
      { title: "A repeat test for {{gene}}", why: "This condition is usually caused by a short piece of DNA repeated too many times. Exomes and most panels cannot measure repeats, so you need a test made for this.", vars: { gene: repeatGene } },
      { title: "If the repeat test is normal: ask about sequencing {{gene}}", why: "A few people have a different kind of change in the same gene.", vars: { gene: repeatGene } },
    ] };
  }
  if (METHYLATION_NAMES.test(c.label)) {
    return { category: "methylation", needed: ["methylation", "large_cnv", "snv"], notes, sources, steps: [
      { title: "First: a methylation test for this region", why: "These conditions change how genes are switched on (imprinting). A methylation test finds most causes. Exomes do not." },
      { title: "Then, if needed: tests for missing pieces or single gene changes", why: "The methylation result tells the clinic which test to do next." },
    ] };
  }
  const dd = DELDUP_FIRST.find((r) => genes.includes(r.gene) && (!r.name || r.name.test(c.label)));
  if (dd) {
    return { category: "deldup_first", needed: ["exon_cnv", "snv", "indel"], notes, sources, steps: [
      { title: "First: a test for missing or extra copies of {{gene}}", why: "For this condition, missing or extra pieces of the gene are a common cause.", vars: { gene: dd.label } },
      { title: "If that is clear: sequencing of the gene", why: "This finds small changes." },
    ] };
  }
  const many = genes.length > 1;
  return { category: "gene", needed: ["snv", "indel", "exon_cnv"], notes, sources, steps: [
    many
      ? { title: "A gene panel that includes all of these genes: {{genes}}", why: "More than one gene can cause this condition. A panel checks them together.", vars: { genes: genes.slice(0, 8).join(", ") + (genes.length > 8 ? " …" : "") } }
      : { title: "A test that reads the whole {{gene}} gene", why: "Most changes are small spelling mistakes in the gene. Single gene tests, panels and exomes can find these.", vars: { gene: gene0(c) } },
    { title: "Check it also looks for missing or extra exons", why: "Some people have a missing or extra piece of the gene. Not every test looks for this. It may be called deletion/duplication or CNV analysis." },
    { title: "If still no answer: an exome or genome", why: "These read most genes at once, and can be checked again later as science learns more." },
  ] };
}

export function undiagnosedProfile(): Profile {
  return { category: "undiagnosed", needed: ["snv", "indel", "exon_cnv", "large_cnv"], notes: [], sources: [ACMG_EXOME], steps: [
    { title: "Ask about an exome or genome", why: "For children with developmental delay or differences from birth, doctors' guidelines suggest an exome or genome as an early test. These read most genes at once." },
    { title: "Testing parents too (trio) can help", why: "Testing both parents with the child makes it easier to understand the result. It costs more." },
    { title: "A panel can be quicker or cheaper", why: "If the symptoms point to one body system, a panel for that system may be enough to start." },
  ] };
}

/** Plain name for each kind of change. Used as i18n keys. */
export const KIND_LABEL: Record<VariantKind, string> = {
  snv: "a single-letter change",
  indel: "a small missing or extra piece (a few letters)",
  exon_cnv: "missing or extra exons",
  large_cnv: "a big missing or extra piece of a chromosome",
  repeat: "a repeat that is too long",
  mtdna: "a change in the mitochondrial DNA",
  methylation: "a methylation (imprinting) change",
  d4z4: "a shortened D4Z4 region on chromosome 4 (FSHD1)",
  unknown: "a change we could not work out",
};
