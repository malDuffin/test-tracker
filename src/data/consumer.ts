import type { Price, Source, VariantKind } from "@/lib/types";

const at = (url: string): Source => ({ url, checked: "2026-11-23" });

/** Consumer DNA kits. Not a diagnosis. Useful as a clue, never to rule a condition out. */
export interface Kit {
  id: string;
  name: string;
  kind: "chip" | "genome";
  prices: Price[];
  rawData?: string;
  countries?: string;
  claims?: string;
  /** Low depth genomes (1x) are not reliable for single changes */
  lowDepth?: string;
  url: string;
  sources: Source[];
}

export const KITS: Kit[] = [
  {
    id: "23andme", name: "23andMe", kind: "chip", prices: [],
    claims: "23andMe says its test is not intended to diagnose any disease, and a report may look at only some variants, so a clear result does not rule a condition out.",
    url: "https://support.23andme.org/hc/en-us/articles/42965747794199-How-Accurate-Is-23andMe",
    sources: [at("https://support.23andme.org/hc/en-us/articles/42965747794199-How-Accurate-Is-23andMe")],
  },
  {
    id: "ancestry", name: "AncestryDNA", kind: "chip", prices: [],
    claims: "Works the same way as 23andMe (a chip that reads set spots). We have not checked Ancestry's own wording yet.",
    url: "https://www.ancestry.com/dna/", sources: [],
  },
  {
    id: "dante", name: "Dante Labs whole genome (30x)", kind: "genome",
    prices: [
      { what: "Core (sale, was 449)", amount: "199", currency: "USD", badge: "sale", source: at("https://dantelabs.com/whole-genome-sequencing") },
      { what: "Premium, first year (sale)", amount: "298", currency: "USD", badge: "sale", source: at("https://dantelabs.com/whole-genome-sequencing") },
      { what: "Premium + AI, first year (sale)", amount: "399", currency: "USD", badge: "sale", source: at("https://dantelabs.com/whole-genome-sequencing") },
    ],
    rawData: "FASTQ, BAM and VCF files", countries: "Ships worldwide",
    claims: "Dante says it has CLIA, CAP and ISO 15189 accreditation and gives reports a doctor can use. It is still not a test chosen by a doctor for one person's symptoms.",
    url: "https://dantelabs.com/whole-genome-sequencing", sources: [at("https://dantelabs.com/whole-genome-sequencing")],
  },
  {
    id: "nebula", name: "DNA Complete (Nebula Genomics)", kind: "genome",
    prices: [
      { what: "Essential, 1x (sale)", amount: "245", currency: "USD", badge: "sale", source: at("https://dnacomplete.com/") },
      { what: "Pro, 30x (sale)", amount: "595", currency: "USD", badge: "sale", source: at("https://dnacomplete.com/") },
      { what: "Elite, 100x (sale)", amount: "1,295", currency: "USD", badge: "sale", source: at("https://dnacomplete.com/") },
    ],
    rawData: "CRAM and VCF files", countries: "Free shipping to the US. Other countries not checked.",
    claims: "Wellness and ancestry reports with a membership.",
    lowDepth: "The 1x option reads each spot only about once, so it is not reliable for finding one changed letter.",
    url: "https://dnacomplete.com/", sources: [at("https://dnacomplete.com/")],
  },
  {
    id: "sequencing-com", name: "Sequencing.com whole genome (30x)", kind: "genome",
    prices: [{ what: "Kits (Black Friday sale, was 559 / 898 / 1,748)", amount: "329 / 449 / 699", currency: "USD", badge: "sale", source: at("https://sequencing.com/") }],
    rawData: "FASTQ, BAM and VCF files", countries: "Worldwide (says the site)",
    claims: "Consumer reports. Sale prices change often.",
    url: "https://sequencing.com/", sources: [at("https://sequencing.com/")],
  },
];

/** A plain line on what this kit can and cannot tell you for the chosen condition. English i18n key; parts are i18n keys joined into {{what}}. */
export function kitLine(kit: Kit, needed: VariantKind[], known: VariantKind | null): { text: string; parts?: string[] } {
  const kinds = known && known !== "unknown" ? [known] : needed;
  if (kinds.includes("d4z4"))
    return { text: "Cannot measure the D4Z4 region that causes FSHD1. A clear result tells you nothing about FSHD." };
  if (kit.kind === "chip") {
    if (kinds.includes("exon_cnv") || kinds.includes("repeat") || kinds.includes("large_cnv") || kinds.includes("methylation"))
      return { text: "Cannot see the kind of change that matters here (missing or extra pieces, repeats or methylation). A clear result tells you nothing about this condition." };
    return { text: "Reads only a set list of spots. It is very unlikely to check the change behind this condition. A clear result does not rule it out." };
  }
  const misses: string[] = [];
  if (kinds.includes("repeat")) misses.push("repeats");
  if (kinds.includes("methylation")) misses.push("methylation");
  if (kinds.includes("exon_cnv") || kinds.includes("large_cnv")) misses.push("missing or extra pieces");
  if (misses.length)
    return { text: "The raw data may miss what matters here ({{what}}), and nobody checks it against symptoms. Any finding needs a clinical test to confirm.", parts: misses };
  return { text: "The raw data may contain small changes in the gene, but nobody checks them against symptoms. Any finding needs a clinical test to confirm." };
}
