import type { Abilities, Price, Source } from "@/lib/types";

/**
 * Hand-checked labs, clinics and ordering services. Every price has a source and the date it
 * was read. Never add a price, ability or country without a source. Research notes:
 * docs/RESEARCH.md. Rows older than 90 days show "may be out of date" in the app.
 */
export const CHECKED = "2026-11-23";
const at = (url: string, label?: string): Source => ({ url, checked: CHECKED, label });
export const UDNF: Source = at(
  "https://udnf.org/download/4625/?tmstv=1780428553",
  "Undiagnosed Diseases Network Foundation (UDNF) Clinical Genetic Testing Lab Comparison Guide, updated 25 Mar 2026",
);
const udnf = (what: string, amount: string, note?: string): Price => ({ what, amount, currency: "USD", badge: "charity", source: UDNF, note });

export type Countries = { codes: string[] | "international"; text: string };
export type DoctorRule = "required" | "clinic" | "self";

export interface Lab {
  id: string;
  name: string;
  base: string;
  kind: "lab" | "clinic" | "orderer";
  countries: Countries;
  doctor: DoctorRule;
  doctorNote?: string;
  samples?: string;
  counselling?: string;
  rawData?: string;
  url: string;
  /** Prices for gene panels at this lab (used on gene-specific cards) */
  panelPrices?: Price[];
  notes?: string[];
  sources: Source[];
}

export interface Offer {
  id: string;
  labId: string;
  name: string;
  type: "exome" | "genome" | "cma" | "panel" | "single" | "visit";
  prices: Price[];
  abilities: Abilities;
  /** Plain notes on what it can and cannot find, with the source on the lab */
  abilityNotes?: string[];
  turnaround?: string;
  rawData?: string;
  url: string;
}

export const LABS: Lab[] = [
  {
    id: "invitae", name: "Invitae (Labcorp)", base: "US", kind: "lab",
    countries: { codes: "international", text: "US. Patient pay also possible from outside the US (non-US insurance not accepted)." },
    doctor: "required", doctorNote: "A clinician must order. In the US, Genome Medical can order after a video visit.",
    samples: "Blood, saliva or cheek swab", counselling: "Free counselling after results in sponsored programmes",
    url: "https://www.invitae.com/individual-faqs/billing",
    panelPrices: [
      { what: "Rare disease panel, flat rate for people who qualify on income", amount: "299", currency: "USD", badge: "income", source: at("https://www.invitae.com/new-programs-2025") },
      udnf("Panels (range)", "2,500 to 4,000", "The charity guide range is much higher than Invitae's own flat rate. Ask the lab for a written quote."),
    ],
    sources: [at("https://www.invitae.com/individual-faqs/billing"), at("https://www.invitae.com/new-programs-2025"), UDNF],
  },
  {
    id: "genedx", name: "GeneDx", base: "US", kind: "lab",
    countries: { codes: ["US"], text: "US. Orders from other countries not checked." },
    doctor: "required", doctorNote: "A clinician must order. Genome Medical can order after a video visit.",
    samples: "Blood or saliva", counselling: "Through Genome Medical",
    url: "https://www.genedx.com/patients/resources/billing-and-insurance",
    panelPrices: [udnf("Panels (range)", "300 to 2,000")],
    notes: ["GeneDx does not publish cash prices. It says self-pay prices, payment plans and financial help exist."],
    sources: [at("https://www.genedx.com/patients/resources/billing-and-insurance"), UDNF],
  },
  {
    id: "fulgent", name: "Fulgent Genetics", base: "US", kind: "lab",
    countries: { codes: "international", text: "US. In the UK through Northway Clinic, London." },
    doctor: "required", doctorNote: "A clinician must order.",
    counselling: "A Fulgent genetic counsellor reviews exome orders before testing",
    url: "https://web.fulgentgenetics.com/resources/billing",
    panelPrices: [{ what: "Self-pay price (Good Faith Estimate by phone)", badge: "request", source: at("https://web.fulgentgenetics.com/resources/billing") }],
    sources: [at("https://www.fulgentgenetics.com/whole-exome"), at("https://web.fulgentgenetics.com/genomic-testing/exome"), at("https://web.fulgentgenetics.com/resources/billing")],
  },
  {
    id: "preventiongenetics", name: "PreventionGenetics (Exact Sciences)", base: "US", kind: "lab",
    countries: { codes: ["US"], text: "US. Orders from other countries not checked." },
    doctor: "required", doctorNote: "A clinician must order.",
    samples: "Blood, cheek swab, saliva or tissue",
    url: "https://www.preventiongenetics.com/coverage",
    panelPrices: [udnf("Typical panel", "550")],
    notes: ["The lab says it has prompt-pay prices for all tests. The charity guide says 25% off exome and genome for paying before testing."],
    sources: [at("https://www.preventiongenetics.com/coverage"), at("https://www.preventiongenetics.com/tests/pgxome-whole-exome-test"), UDNF],
  },
  {
    id: "revvity", name: "Revvity Omics", base: "US", kind: "lab",
    countries: { codes: "international", text: "US and other countries (the lab says it varies by country)." },
    doctor: "required", doctorNote: "A clinician must order.",
    samples: "Blood (preferred), saliva, dried blood spot or DNA", rawData: "Included",
    url: "https://www.revvity.com/test/Whole-Exome-Sequencing-Proband-Only-D1000",
    sources: [at("https://www.revvity.com/test/Whole-Exome-Sequencing-Proband-Only-D1000")],
  },
  {
    id: "ambry", name: "Ambry Genetics", base: "US", kind: "lab",
    countries: { codes: ["US"], text: "US" },
    doctor: "required", doctorNote: "A clinician must order. Genome Medical can order after a video visit.",
    samples: "Blood, saliva or cheek swab", url: "https://www.ambrygen.com/",
    sources: [UDNF],
  },
  {
    id: "baylor", name: "Baylor Genetics", base: "US", kind: "lab",
    countries: { codes: ["US"], text: "US" },
    doctor: "required", doctorNote: "A clinician must order.",
    samples: "Blood, saliva or tissue", counselling: "After results only (no counselling before the test)",
    url: "https://www.baylorgenetics.com/", sources: [UDNF],
  },
  {
    id: "variantyx", name: "Variantyx", base: "US", kind: "lab",
    countries: { codes: ["US"], text: "US" },
    doctor: "required", doctorNote: "A clinician must order.",
    samples: "Blood or saliva", counselling: "No in-house counsellors. Connects you to outside genetic counsellors.",
    url: "https://www.variantyx.com/", panelPrices: [udnf("Rare disease panels", "850")], sources: [UDNF],
  },
  {
    id: "blueprint", name: "Blueprint Genetics (Quest)", base: "Finland", kind: "lab",
    countries: { codes: "international", text: "Many countries. Patients can pay by card or bank transfer. Exact country list not checked." },
    doctor: "required", doctorNote: "A healthcare provider orders and chooses patient payment. You then get a payment link.",
    samples: "Blood or saliva", url: "https://www.blueprintgenetics.com/patients/",
    panelPrices: [udnf("Panels (range)", "1,450 to 1,750")],
    sources: [at("https://www.blueprintgenetics.com/patients/"), UDNF],
  },
  {
    id: "centogene", name: "CENTOGENE", base: "Germany", kind: "lab",
    countries: { codes: "international", text: "Many countries" },
    doctor: "required", doctorNote: "A doctor orders online (CentoPortal). A self-pay option for patients exists.",
    url: "https://www.centogene.com/diagnostics/how-to-order-ship/billing-options/",
    panelPrices: [{ what: "Price on request", badge: "request", source: at("https://www.centogene.com/diagnostics/how-to-order-ship/billing-options/") }],
    sources: [at("https://www.centogene.com/diagnostics/how-to-order-ship/billing-options/")],
  },
  {
    id: "cegat", name: "CeGaT", base: "Germany", kind: "lab",
    countries: { codes: "international", text: "Many countries" },
    doctor: "required", doctorNote: "A doctor must order.",
    counselling: "Free re-check of an unsolved exome or genome 12 months to 5 years after the report",
    url: "https://cegat.com/diagnostics/diagnostic-methods/exome-diagnostics/",
    panelPrices: [{ what: "Price on request", badge: "request", source: at("https://cegat.com/diagnostics/diagnostic-methods/exome-diagnostics/") }],
    sources: [at("https://cegat.com/diagnostics/diagnostic-methods/exome-diagnostics/")],
  },
  {
    id: "genome-medical", name: "Genome Medical", base: "US", kind: "orderer",
    countries: { codes: ["US"], text: "US" },
    doctor: "self", doctorNote: "You can book yourself. A genetic counsellor can order a test after a video visit. The lab bills you separately.",
    url: "https://www.genomemedical.com/genetics-care/cost-of-genetic-counseling-and-testing/",
    notes: ["Does not accept Medicare, Medicaid or Tricare for counselling (page dated 28 Jan 2026)."],
    sources: [at("https://www.genomemedical.com/genetics-care/cost-of-genetic-counseling-and-testing/")],
  },
  {
    id: "northway", name: "Northway Clinic (London)", base: "UK", kind: "clinic",
    countries: { codes: ["GB"], text: "UK (in person, London)" },
    doctor: "clinic", doctorNote: "A clinic appointment replaces a GP or NHS referral. Tests go to Fulgent.",
    url: "https://northwayclinic.co.uk/services/comprehensive-genomic-testing-exome-genome/",
    notes: ["RNA testing (RISE) is included with exome and genome. The consultation fee is not shown on the page."],
    sources: [at("https://northwayclinic.co.uk/services/comprehensive-genomic-testing-exome-genome/")],
  },
  {
    id: "genome-clinic", name: "The Genome Clinic (Cardiff or online)", base: "UK", kind: "clinic",
    countries: { codes: ["GB"], text: "UK (Spire Cardiff or video)" },
    doctor: "clinic", doctorNote: "You can refer yourself. A consultant clinical geneticist sees you and orders from accredited labs.",
    url: "https://www.genomeclinic.co.uk/professional-fees-and-tariff/",
    notes: ["The tariff says the lab cost with report is 'advised separately'. Check if the test prices include everything."],
    sources: [at("https://www.genomeclinic.co.uk/professional-fees-and-tariff/")],
  },
];

const EXOME_LIMITS = "Exomes are not made to measure repeat expansions or methylation, and miss most changes deep inside genes.";
const REVVITY_LIMITS = "The lab says it does not test long repeats, methylation or balanced rearrangements, and is not designed for mosaicism.";
const gc = at("https://www.genomeclinic.co.uk/professional-fees-and-tariff/");
const nw = at("https://northwayclinic.co.uk/services/comprehensive-genomic-testing-exome-genome/");
// D4Z4 (FSHD1) cannot be measured by panels, exomes, genomes or microarrays.
const exomeBase: Abilities = { snv: "yes", indel: "yes", repeat: "no", methylation: "no", d4z4: "no" };
const genomeBase: Abilities = { snv: "yes", indel: "yes", exon_cnv: "unknown", large_cnv: "unknown", repeat: "unknown", methylation: "no", mtdna: "unknown", d4z4: "no" };

/** Broad tests (exome, genome, microarray) and ordering visits. */
export const OFFERS: Offer[] = [
  {
    id: "revvity-exome", labId: "revvity", name: "Whole exome, one person (D1000)", type: "exome",
    prices: [{ what: "One person", amount: "900", currency: "USD", badge: "lab", source: at("https://www.revvity.com/test/Whole-Exome-Sequencing-Proband-Only-D1000") }],
    abilities: { ...exomeBase, exon_cnv: "yes", mtdna: "yes" }, abilityNotes: ["Includes mitochondrial DNA and missing or extra exons (exon-level CNV).", REVVITY_LIMITS],
    turnaround: "4 weeks", rawData: "Included", url: "https://www.revvity.com/test/Whole-Exome-Sequencing-Proband-Only-D1000",
  },
  {
    id: "genedx-exome", labId: "genedx", name: "Exome", type: "exome",
    prices: [udnf("One person", "1,200"), udnf("Two people (duo)", "1,750"), udnf("Child and both parents (trio)", "2,250")],
    abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: "https://www.genedx.com/patients/resources/billing-and-insurance",
  },
  {
    id: "genedx-genome", labId: "genedx", name: "Genome", type: "genome",
    prices: [udnf("One person", "2,000"), udnf("Two people (duo)", "2,500"), udnf("Child and both parents (trio)", "3,250")],
    abilities: { ...genomeBase }, url: "https://www.genedx.com/patients/resources/billing-and-insurance",
  },
  {
    id: "invitae-exome", labId: "invitae", name: "Exome", type: "exome",
    prices: [udnf("One person", "3,522", "An older, undated Invitae billing card (third-party copy) lists 1,250 USD for one person and 2,500 USD for 2 or 3 family members. Ask the lab.")],
    abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: "https://www.invitae.com/individual-faqs/billing",
  },
  {
    id: "fulgent-exome", labId: "fulgent", name: "Whole exome", type: "exome",
    prices: [{ what: "Self-pay price", badge: "request", source: at("https://www.fulgentgenetics.com/whole-exome"), note: "Fulgent says to call for details and gives a Good Faith Estimate." }],
    abilities: { ...exomeBase, exon_cnv: "partial", mtdna: "yes" },
    abilityNotes: ["Includes mitochondrial DNA. Missing or extra exons are an option you may need to ask for.", "Testing parents too (duo or trio) at no extra cost, says the lab."],
    turnaround: "3 to 5 weeks on one lab page, 5 to 7 weeks on another", url: "https://www.fulgentgenetics.com/whole-exome",
  },
  {
    id: "pg-exome", labId: "preventiongenetics", name: "PGxome (exome)", type: "exome",
    prices: [{ what: "Prompt-pay price", badge: "request", source: at("https://www.preventiongenetics.com/coverage"), note: "The charity guide says 25% off exome and genome for paying before testing." }],
    abilities: { ...exomeBase, exon_cnv: "yes", mtdna: "yes" }, abilityNotes: ["Includes missing or extra pieces (CNV) and mitochondrial DNA.", EXOME_LIMITS],
    turnaround: "3 to 5 weeks", url: "https://www.preventiongenetics.com/tests/pgxome-whole-exome-test",
  },
  {
    id: "ambry-exome", labId: "ambry", name: "Exome", type: "exome",
    prices: [udnf("One person (range)", "800 to 1,000")], abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: "https://www.ambrygen.com/",
  },
  {
    id: "baylor-exome", labId: "baylor", name: "Exome", type: "exome",
    prices: [udnf("One person", "1,800")], abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: "https://www.baylorgenetics.com/",
  },
  {
    id: "baylor-genome", labId: "baylor", name: "Genome", type: "genome",
    prices: [udnf("One person", "3,000")], abilities: { ...genomeBase }, url: "https://www.baylorgenetics.com/",
  },
  {
    id: "baylor-cma", labId: "baylor", name: "Chromosome microarray (CMA)", type: "cma",
    prices: [udnf("One person", "1,200")], abilities: { large_cnv: "yes", exon_cnv: "partial", snv: "no", indel: "no", repeat: "no", methylation: "no", d4z4: "no" },
    abilityNotes: ["A microarray finds big missing or extra pieces of chromosomes. It does not read single letters."], url: "https://www.baylorgenetics.com/",
  },
  {
    id: "variantyx-exome", labId: "variantyx", name: "Exome", type: "exome",
    prices: [udnf("One person", "1,800"), udnf("Two or three people (duo or trio)", "2,100")], abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: "https://www.variantyx.com/",
  },
  {
    id: "variantyx-genome", labId: "variantyx", name: "Genome (Genomic Unity)", type: "genome",
    prices: [udnf("One, two or three people", "2,100")], abilities: { ...genomeBase }, url: "https://www.variantyx.com/",
  },
  {
    id: "variantyx-cma", labId: "variantyx", name: "Chromosome microarray (CMA)", type: "cma",
    prices: [udnf("One person", "850")], abilities: { large_cnv: "yes", exon_cnv: "partial", snv: "no", indel: "no", repeat: "no", methylation: "no", d4z4: "no" },
    abilityNotes: ["A microarray finds big missing or extra pieces of chromosomes. It does not read single letters."], url: "https://www.variantyx.com/",
  },
  {
    id: "blueprint-exome", labId: "blueprint", name: "Exome", type: "exome",
    prices: [udnf("One person", "2,500"), udnf("Two people (duo)", "3,250"), udnf("Child and both parents (trio)", "4,000")],
    abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: "https://www.blueprintgenetics.com/patients/",
  },
  {
    id: "centogene-exome", labId: "centogene", name: "CentoXome (exome) or CentoGenome (genome)", type: "exome",
    prices: [{ what: "Price on request", badge: "request", source: at("https://www.centogene.com/diagnostics/how-to-order-ship/billing-options/") }],
    abilities: { snv: "yes", indel: "yes", d4z4: "no" }, url: "https://www.centogene.com/diagnostics/how-to-order-ship/billing-options/",
  },
  {
    id: "cegat-exome", labId: "cegat", name: "ExomeXtra (exome with extra CNV coverage)", type: "exome",
    prices: [{ what: "Price on request", badge: "request", source: at("https://cegat.com/diagnostics/diagnostic-methods/exome-diagnostics/") }],
    abilities: { ...exomeBase, exon_cnv: "yes", large_cnv: "yes" }, abilityNotes: ["The lab says ExomeXtra adds a genome backbone and array-level CNV detection.", EXOME_LIMITS],
    url: "https://cegat.com/diagnostics/diagnostic-methods/exome-diagnostics/",
  },
  {
    id: "northway-exome", labId: "northway", name: "Clinical or whole exome (Fulgent)", type: "exome",
    prices: [
      { what: "One person", amount: "2,000", currency: "GBP", badge: "clinic", source: nw },
      { what: "Two people (duo)", amount: "3,000", currency: "GBP", badge: "clinic", source: nw },
      { what: "Child and both parents (trio)", amount: "3,500", currency: "GBP", badge: "clinic", source: nw },
    ],
    abilities: { ...exomeBase }, abilityNotes: [EXOME_LIMITS], url: nw.url,
  },
  {
    id: "northway-genome", labId: "northway", name: "FulGenome (genome)", type: "genome",
    prices: [
      { what: "One person", amount: "3,000", currency: "GBP", badge: "clinic", source: nw },
      { what: "Two people (duo)", amount: "4,000", currency: "GBP", badge: "clinic", source: nw },
      { what: "Child and both parents (trio)", amount: "4,500", currency: "GBP", badge: "clinic", source: nw },
    ],
    abilities: { ...genomeBase }, url: nw.url,
  },
  {
    id: "genomeclinic-exome", labId: "genome-clinic", name: "Clinical or whole exome, including CNVs", type: "exome",
    prices: [
      { what: "One person", amount: "2,500", currency: "GBP", badge: "clinic", source: gc },
      { what: "Child and both parents (trio)", amount: "4,000", currency: "GBP", badge: "clinic", source: gc },
    ],
    abilities: { ...exomeBase, exon_cnv: "yes" }, abilityNotes: ["The tariff says this includes CNVs (missing or extra pieces).", EXOME_LIMITS], url: gc.url,
  },
  {
    id: "genomeclinic-genome", labId: "genome-clinic", name: "Whole genome", type: "genome",
    prices: [
      { what: "One person", amount: "3,500", currency: "GBP", badge: "clinic", source: gc },
      { what: "Child and both parents (trio)", amount: "5,000", currency: "GBP", badge: "clinic", source: gc },
    ],
    abilities: { ...genomeBase }, url: gc.url,
  },
  {
    id: "genomeclinic-panel", labId: "genome-clinic", name: "Single condition test or gene panel", type: "panel",
    prices: [
      { what: "Single condition DNA test", amount: "950", currency: "GBP", badge: "clinic", source: gc },
      { what: "Targeted panel", amount: "1,500", currency: "GBP", badge: "clinic", source: gc },
      { what: "Comprehensive panel", amount: "2,000", currency: "GBP", badge: "clinic", source: gc },
    ],
    abilities: { d4z4: "no" }, abilityNotes: ["Which lab and which genes depends on your condition. Ask the clinic which kinds of change the test finds."], url: gc.url,
  },
  {
    id: "genomeclinic-cma", labId: "genome-clinic", name: "Microarray (aCGH)", type: "cma",
    prices: [{ what: "One person", amount: "750", currency: "GBP", badge: "clinic", source: gc }],
    abilities: { large_cnv: "yes", exon_cnv: "partial", snv: "no", indel: "no", repeat: "no", methylation: "no", d4z4: "no" },
    abilityNotes: ["A microarray finds big missing or extra pieces of chromosomes. It does not read single letters."], url: gc.url,
  },
  {
    id: "genomeclinic-visit", labId: "genome-clinic", name: "Consultation or genetic counselling", type: "visit",
    prices: [
      { what: "Consultation", amount: "350", currency: "GBP", badge: "clinic", source: gc },
      { what: "Genetic counselling", amount: "300", currency: "GBP", badge: "clinic", source: gc },
    ],
    abilities: {}, url: gc.url,
  },
  {
    id: "genome-medical-visit", labId: "genome-medical", name: "Genetic counselling video visit (can order a test)", type: "visit",
    prices: [{ what: "Each visit, before or after the test", amount: "up to 250", currency: "USD", badge: "lab", source: at("https://www.genomemedical.com/genetics-care/cost-of-genetic-counseling-and-testing/") }],
    abilities: {}, url: "https://www.genomemedical.com/genetics-care/cost-of-genetic-counseling-and-testing/",
  },
];

export const labById = (id: string) => LABS.find((l) => l.id === id);

/** Does this lab take orders from people in this country? null = not checked. */
export function servesCountry(lab: Lab, country: string | null): boolean | null {
  if (!country) return null;
  if (lab.countries.codes === "international") return true;
  return lab.countries.codes.includes(country) ? true : false;
}
