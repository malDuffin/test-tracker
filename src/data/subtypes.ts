import type { Profile, Note } from "@/lib/rules";
import type { Source } from "@/lib/types";
import { estimateRuFromKb, formatFshdVariant, isFshdTypeId, parseFshdVariant as parseShared, type FshdHaplotype } from "@/lib/fshdType";

/**
 * Conditions with known subtypes. When a condition matches a SubtypeSet, the variant box is
 * replaced by toggle buttons: "Unknown" (default) plus one button per subtype, and optionally an
 * "Other" button with free text (kept as "Custom: <text>", never rewritten). The chosen option
 * replaces the testing order, the kinds of change to look for, the genes shown and any special
 * test group (from public/data/gtr/special.json, built from GTR by explicit method only).
 *
 * Option ids are stable and shared with Rare Disease Planet and Variant Visual. Do not rename them.
 *
 * To add another condition: add a SubtypeSet with a `matches` rule, options and, if useful, a
 * `parseVariant` that reads the formats other apps pass in ?variant=. Keep every claim sourced.
 * Option labels, helpers and step text are English i18n keys.
 */
export interface SubtypeOption {
  id: string;
  label: string;
  helper?: string;
  /** Words in a pasted variant that point to this option (used only by the default parser) */
  hint?: RegExp;
  /** Show the optional "number of repeat units" box (with the EcoRI kb helper) */
  repeats?: boolean;
  /** Show the haplotype toggles (Unknown, 4qA, 4qB, 4A166) */
  haplotype?: boolean;
  /** Free text option. Shown back as "Custom: <text>" */
  custom?: boolean;
  /** Only show special tests whose GTR methods match (for example optical mapping) */
  specialMethods?: RegExp;
  /** Profile for this option. Missing fields come from the condition's normal profile. */
  profile: Pick<Profile, "needed" | "steps"> & Partial<Pick<Profile, "notes" | "sources" | "specialTests" | "genes">>;
}

/** What the person picked. Lives in memory only. */
export interface SubtypeChoice {
  id: string;
  /** Repeat units, if given */
  ru?: number | null;
  /** The person's own words for the "Other" option, trimmed but otherwise unchanged */
  custom?: string | null;
  /** 4q haplotype, if given */
  hap?: FshdHaplotype | null;
  /** Gene change text for FSHD2 style options (for example "SMCHD1 c.1876A>G"), shown back only */
  change?: string | null;
}

export interface SubtypeSet {
  id: string;
  question: string;
  matches: (c: { label: string; genes: string[] }) => boolean;
  options: SubtypeOption[]; // the first option is the default ("Unknown")
  /** Read a ?variant= value written in this condition's usual formats */
  parseVariant?: (text: string) => SubtypeChoice | null;
  /** Notes that depend on the repeat units (for example the 8 to 10 borderline range) */
  repeatNotes?: (ru: number) => Note[];
  /** Notes that depend on the haplotype */
  hapNotes?: (hap: string) => Note[];
  /** Short display string, for example "FSHD1: 5 RU" or "Custom: EcoRI 24 kb" */
  display?: (choice: SubtypeChoice, opt: SubtypeOption) => string;
}

const CHECKED = "2026-11-23";
const FSHD_GR: Source = { url: "https://www.ncbi.nlm.nih.gov/books/NBK1443/", checked: CHECKED, label: "GeneReviews: Facioscapulohumeral Muscular Dystrophy" };
const FSHD_GUIDE: Source = { url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11147721/", checked: CHECKED, label: "Best practice guidelines on genetic diagnostics of FSHD (2024)" };
const FSHD_REVIEW: Source = { url: "https://www.nature.com/articles/s10038-025-01401-6", checked: CHECKED, label: "Review: diversity in FSHD genetics (J Hum Genet, 2025)" };
export const FSHD_SOCIETY: Source = { url: "https://www.fshdsociety.org/living-with-fshd/understanding-fshd/genetic-testing/", checked: CHECKED, label: "FSHD Society: Genetic testing" };
const FSHD_DPED: Source = { url: "https://doi.org/10.1093/hmg/ddab250", checked: CHECKED, label: "Lemmers et al. 2022: proximally extended D4Z4 deletions (Hum Mol Genet)" };
const FSHD_SOURCES = [FSHD_GR, FSHD_GUIDE];

const D4Z4_FIRST = {
  title: "First: a D4Z4 sizing test (optical genome mapping, Southern blot or molecular combing)",
  why: "FSHD1 is caused by a shortened D4Z4 region on chromosome 4 (4q35). Only these special tests can measure it. Standard gene panels, exomes, genomes and consumer DNA kits cannot measure D4Z4.",
};
const FSHD2_THEN = {
  title: "If the D4Z4 size is normal: testing for FSHD2",
  why: "FSHD2 is usually caused by a change in SMCHD1, and more rarely DNMT3B or LRIF1. It also needs a permissive 4qA version of chromosome 4 and low D4Z4 methylation, so ask the lab about 4qA and D4Z4 methylation testing too.",
};
const GENE_TESTS_LATER: Note[] = [{ text: "Gene tests (SMCHD1, DNMT3B, LRIF1) are for FSHD2, the second step. On their own they cannot find FSHD1." }];

const fshd2 = (gene: string, label: string, helper: string, hint: RegExp): SubtypeOption => ({
  id: `fshd2-${gene.toLowerCase()}`,
  haplotype: true,
  label,
  helper,
  hint,
  profile: {
    needed: ["snv", "indel", "exon_cnv"],
    genes: [gene],
    steps: [
      { title: "A gene panel or single gene test that includes {{gene}}", why: "Check it reads the whole gene and also looks for missing or extra exons.", vars: { gene } },
      { title: "Also ask about 4qA and D4Z4 methylation testing", why: "A change in {{gene}} causes FSHD2 only together with a permissive 4qA version of chromosome 4 and low D4Z4 methylation. These need special tests that panels and exomes do not do.", vars: { gene } },
    ],
    notes: [{ text: "Standard panels, exomes and genomes can read {{gene}}, but they cannot check 4qA or D4Z4 methylation.", vars: { gene } }],
    sources: FSHD_SOURCES,
  },
});

/** Estimate D4Z4 repeat units from an EcoRI fragment size in kb ((kb - 5) / 3.3, FSHD Society), rounded. */
export const unitsFromEcoRIkb = (kb: number): number | null => estimateRuFromKb(kb);

/** Reads ?variant= with the parser shared with RDP and VV (src/lib/fshdType.ts). Blank or "Unknown" gives Unknown. */
export function parseFshdVariant(raw: string): SubtypeChoice | null {
  if (!raw.trim()) return null;
  const v = parseShared(raw);
  return { id: v.type, ru: v.ru, hap: v.hap, change: v.change, custom: v.custom };
}

export const SUBTYPE_SETS: SubtypeSet[] = [
  {
    id: "fshd",
    question: "Which type of FSHD?",
    matches: (c) => /facioscapulohumeral|fascioscapulohumeral|\bfshd/i.test(c.label) || c.genes.some((g) => g.toUpperCase() === "DUX4"),
    parseVariant: parseFshdVariant,
    repeatNotes: (ru) =>
      ru <= 3 ? [{ text: "1 to 3 repeat units is often linked with earlier onset, but this varies a lot." }]
      : ru <= 7 ? [{ text: "1 to 7 repeat units is the usual FSHD1 range." }]
      : ru <= 10 ? [{ text: "8 to 10 repeat units is a borderline range: some people have symptoms and some do not. A methylation test and FSHD2 gene testing are often suggested as well." }]
      : [{ text: "11 or more repeat units is not the usual FSHD1 shortening. FSHD2 testing may still be relevant." }],
    // Same strings RDP and VV store, for example "FSHD1: 6 RU, 4qA" or "Custom: EcoRI/BlnI fragment 24 kb".
    display: (c, o) => (isFshdTypeId(o.id) ? formatFshdVariant({ type: o.id, ru: c.ru ?? null, hap: c.hap ?? null, change: c.change ?? null, custom: c.custom ?? null }) : null) ?? "Unknown",
    hapNotes: (hap) =>
      hap === "4qA" ? [{ text: "4qA is the permissive version of chromosome 4 that FSHD needs." }]
      : [{ text: "4qB and 4A166 are usually non-permissive: a shortened D4Z4 region on them does not cause FSHD on its own. Ask a genetics clinic to look at the whole result." }],
    options: [
      { id: "unknown", label: "Unknown", helper: "Pick this if you have not had a genetic test, or you are not sure what type it showed. We suggest the usual testing order, starting with a special test that measures the D4Z4 region. Ordinary gene panels and home DNA kits cannot do that test.",
        profile: { needed: ["d4z4"], steps: [D4Z4_FIRST, FSHD2_THEN], specialTests: "fshd-d4z4", genes: ["SMCHD1", "DNMT3B", "LRIF1", "DUX4"], notes: GENE_TESTS_LATER, sources: FSHD_SOURCES } },
      { id: "fshd1", haplotype: true, label: "FSHD1 (a shortened D4Z4 region)", repeats: true, hint: /\bfshd1\b|d4z4|4q35|contraction/i,
        helper: "This is the usual type, about 19 in 20 people with FSHD. A stretch of DNA called D4Z4 on chromosome 4 is shorter than usual, on a permissive (4qA) version of that chromosome. Your report may say FSHD1, D4Z4 contraction, a number of repeat units, or a size in kilobases (kb).",
        profile: { needed: ["d4z4"], steps: [D4Z4_FIRST, FSHD2_THEN], specialTests: "fshd-d4z4", genes: ["DUX4"], notes: GENE_TESTS_LATER, sources: FSHD_SOURCES } },
      fshd2("SMCHD1", "FSHD2: SMCHD1 change", "A change in the SMCHD1 gene, together with a permissive (4qA) chromosome 4 and low methylation of D4Z4. This is the usual cause of FSHD2. A gene panel can read SMCHD1, but you still need the special 4qA and methylation tests.", /\bsmchd1\b/i),
      fshd2("DNMT3B", "FSHD2: DNMT3B change (sometimes called FSHD4)", "A rare cause of FSHD2. A change in one copy of DNMT3B, together with 4qA and low D4Z4 methylation. Some catalogues call this FSHD4.", /\bdnmt3b\b|\bfshd4\b/i),
      fshd2("LRIF1", "FSHD2: LRIF1 change (sometimes called FSHD3)", "A very rare cause of FSHD2. Changes in both copies of LRIF1, together with 4qA and low D4Z4 methylation. Some catalogues call this FSHD3.", /\blrif1\b|\bfshd3\b/i),
      { id: "fshd1-fshd2", haplotype: true, label: "FSHD1 and FSHD2 together", repeats: true,
        helper: "Some people have a shortened or borderline D4Z4 region and a change in a gene such as SMCHD1. Your report may say FSHD1+FSHD2.",
        profile: { needed: ["d4z4", "snv", "indel", "exon_cnv"], specialTests: "fshd-d4z4", genes: ["SMCHD1", "DNMT3B", "LRIF1"], sources: [...FSHD_SOURCES, FSHD_REVIEW],
          notes: [{ text: "This needs two kinds of test. A gene panel alone is not enough, and a D4Z4 sizing test alone is not enough." }],
          steps: [
            D4Z4_FIRST,
            { title: "And: a gene test for SMCHD1 (and DNMT3B and LRIF1 if offered)", why: "Ask for a test that reads the whole gene and looks for missing or extra exons, plus 4qA and D4Z4 methylation testing." },
          ] } },
      { id: "fshd1-mosaic", haplotype: true, label: "Mosaic FSHD1 (only in some cells)", repeats: true,
        helper: "The shortened D4Z4 region is in some cells and not others. This is often how a new change in a family shows up. Symptoms can be milder, or a parent can have no symptoms.",
        profile: { needed: ["d4z4"], specialTests: "fshd-d4z4", genes: ["DUX4"], sources: [...FSHD_SOURCES, FSHD_REVIEW],
          notes: [{ text: "Some older tests can miss mosaicism. Ask the lab whether its method can detect it." }],
          steps: [
            { title: "A D4Z4 sizing test that can detect mosaicism, such as optical genome mapping or a pulsed-field Southern blot", why: "Mosaic changes are only in some cells, so a basic blot can miss them. Standard gene panels, exomes, genomes and consumer DNA kits cannot measure D4Z4 at all." },
            FSHD2_THEN,
          ] } },
      { id: "fshd1-4q-deletion", haplotype: true, repeats: true, label: "FSHD1 with a 4q deletion", specialMethods: /optical|combing/i,
        helper: "Some DNA next to the D4Z4 region on chromosome 4 (4q35) is missing, and part or all of D4Z4 can be missing too. This means the usual repeat count may not be readable, so leave the number as Unknown if the report does not give one. Your report may say proximal extended deletion, DPED, D4F104S1 deletion or p13E-11 deletion.",
        profile: { needed: ["d4z4"], specialTests: "fshd-d4z4", genes: ["DUX4"], sources: [FSHD_GR, FSHD_GUIDE, FSHD_DPED],
          notes: [
            { text: "Standard gene panels, exomes, genomes and consumer DNA kits cannot detect a 4q deletion." },
            { text: "Ask the lab whether its method can detect a 4q deletion (sometimes called DPED). Below we show only labs that list optical mapping or molecular combing." },
          ],
          steps: [
            { title: "A D4Z4 test that can see deletions next to D4Z4, such as optical genome mapping or molecular combing", why: "These tests look at the whole region around D4Z4, not just its length, so they can show a missing piece." },
            { title: "Or: an extended Southern blot with extra probes", why: "A basic Southern blot uses one probe (p13E-11) next to D4Z4. A 4q deletion can remove that spot, so the result can look normal. Ask for the extended test that also uses the D4Z4 and 4qA probes." },
          ] } },
      { id: "custom", label: "Other (I will type what my report says)", custom: true,
        helper: "Use this if your report does not match the types above. Type what it says, for example a 4q-10q rearrangement or a size in kb. Please do not type your name, date of birth, address or the lab's report number. Nothing is saved.",
        profile: { needed: ["d4z4"], steps: [D4Z4_FIRST, FSHD2_THEN], specialTests: "fshd-d4z4", genes: ["SMCHD1", "DNMT3B", "LRIF1", "DUX4"], notes: GENE_TESTS_LATER, sources: FSHD_SOURCES } },
    ],
  },
];

export function subtypeSetFor(c: { label: string; genes: string[] } | null): SubtypeSet | null {
  if (!c) return null;
  return SUBTYPE_SETS.find((s) => s.matches(c)) ?? null;
}

export function subtypeOption(set: SubtypeSet | null, id: string | null): SubtypeOption | null {
  if (!set) return null;
  return set.options.find((o) => o.id === id) ?? set.options[0];
}

/** Work out the starting choice from ?subtype, ?variant and ?d4z4_ru. Nothing is stored. */
export function choiceFromParams(set: SubtypeSet | null, subtype: string | null, variant: string | null, ru: number | null = null, hap: FshdHaplotype | null = null): SubtypeChoice | null {
  if (!set) return null;
  let choice: SubtypeChoice | null = null;
  if (variant) {
    choice = set.parseVariant ? set.parseVariant(variant) : (() => { const hit = set.options.find((o) => o.hint?.test(variant)); return hit ? { id: hit.id } : null; })();
  }
  if (subtype) {
    const id = subtype === "fshd1-plus-fshd2" ? "fshd1-fshd2" : subtype === "mosaic-fshd1" ? "fshd1-mosaic" : subtype;
    if (set.options.some((o) => o.id === id)) choice = { ...(choice?.id === id ? choice : {}), id };
  }
  choice ??= { id: set.options[0].id };
  if (ru != null) choice = { ...choice, ru };
  if (hap) choice = { ...choice, hap };
  return choice;
}

/** Kept for simple callers: just the option id. */
export function subtypeFromParams(set: SubtypeSet | null, subtype: string | null, variant: string | null): string | null {
  return choiceFromParams(set, subtype, variant)?.id ?? null;
}

/** Merge a chosen subtype into the condition's normal profile. */
export function applySubtype(base: Profile, opt: SubtypeOption | null, choice?: SubtypeChoice | null, set?: SubtypeSet | null): Profile {
  if (!opt) return base;
  const ruNotes = [
    ...(opt.repeats && choice?.ru != null && set?.repeatNotes ? set.repeatNotes(choice.ru) : []),
    ...(opt.haplotype && choice?.hap && set?.hapNotes ? set.hapNotes(choice.hap) : []),
  ];
  // The option decides the special tests and genes, so they never leak from the base profile.
  return { ...base, ...opt.profile, specialTests: opt.profile.specialTests, genes: opt.profile.genes,
    notes: [...ruNotes, ...(opt.profile.notes ?? base.notes)], sources: opt.profile.sources ?? base.sources };
}
