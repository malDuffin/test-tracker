import type { Source } from "@/lib/types";

const at = (url: string): Source => ({ url, checked: "2026-11-23" });

/**
 * Free sponsored testing programmes. Paid for by drug companies or charities. Sponsors usually
 * receive de-identified results and the clinician's contact details (Invitae says so on its
 * access programmes page). Matching is by gene, by words in the condition name, or by symptom.
 */
export interface Programme {
  id: string;
  name: string;
  lab: string;
  /** For the family, in plain words */
  forWho: string;
  eligibility: string;
  /** ISO2 codes where it is open, or empty when not clearly stated */
  countries: string[];
  countriesText: string;
  doctor: string;
  cost: string;
  sponsors?: string;
  covers?: string;
  caution?: string;
  genes?: string[];
  names?: RegExp;
  excludeNames?: RegExp;
  symptoms?: string[];
  /** Shown for every condition and symptom (general programmes) */
  general?: boolean;
  source: Source;
}

export const SPONSOR_DATA_NOTE =
  "Free sponsored programmes are paid for by drug companies. They usually receive anonymised (de-identified) results and your clinician's contact details.";
export const SPONSOR_DATA_SOURCE = at("https://www.invitae.com/us/genetic-testing-access-programs");

export const PROGRAMMES: Programme[] = [
  {
    id: "decode-duchenne", name: "Decode Duchenne (Parent Project Muscular Dystrophy)", lab: "Revvity Omics",
    forWho: "Duchenne or Becker muscular dystrophy, confirmed or suspected",
    eligibility: "Citizens or legal residents of the US or Canada. No application needed for diagnostic testing.",
    countries: ["US", "CA"], countriesText: "US and Canada", doctor: "A clinician orders", cost: "Free",
    sponsors: "Sarepta (founding), NS Pharma, ITF Therapeutics",
    covers: "Missing or extra DMD exons and small changes. A 133-gene muscle panel if that is clear. Carrier testing for relatives (approval needed). RNA testing on request.",
    genes: ["DMD"], names: /duchenne|becker/i, symptoms: ["muscle"],
    source: at("https://www.parentprojectmd.org/about-duchenne/decode-duchenne/diagnostic-testing/"),
  },
  {
    id: "detect-mdys", name: "Detect Muscular Dystrophy (Invitae / Labcorp)", lab: "Invitae",
    forWho: "Muscular dystrophies, including Duchenne and limb-girdle",
    eligibility: "US. Family history, or suspected muscular dystrophy with signs such as high CK, getting weaker over time, a muscle biopsy result, large calves, or heart or breathing problems. Not for carrier screening.",
    countries: ["US"], countriesText: "US", doctor: "A clinician orders", cost: "Free, with free counselling after results",
    caution: "Does not test FSHD type 1, OPMD, or myotonic dystrophy types 1 and 2.",
    genes: ["DMD"], names: /muscular dystroph|limb.girdle|\blgmd/i, excludeNames: /facioscapulohumeral|fshd|oculopharyngeal|myotonic/i, symptoms: ["muscle"],
    source: at("https://www.invitae.com/us/sponsored-testing/detect-mdys"),
  },
  {
    id: "behind-the-seizure", name: "Behind the Seizure (Invitae / Labcorp, BioMarin)", lab: "Invitae",
    forWho: "Children with epilepsy",
    eligibility: "A child under 10 whose first seizure (not caused by something else) was between age 2 and 5. Other children may fit Invitae's Unlock Epilepsy programme.",
    countries: ["US", "CA"], countriesText: "US (the page footer also says Canada)", doctor: "A clinician orders", cost: "Free, with free counselling after results",
    names: /epilep|seizure|dravet|lennox|batten|cln2/i, symptoms: ["seizures"],
    source: at("https://www.invitae.com/us/sponsored-testing/behind-the-seizure"),
  },
  {
    id: "genedx-programmes", name: "GeneDx Accelerating Answers programmes", lab: "GeneDx",
    forWho: "Epilepsy, SHANK3 autism, Niemann-Pick type C, Fabry disease, cholestasis, early cataracts, Zellweger spectrum (PBD-ZSD), alpha-mannosidosis",
    eligibility: "Rules differ for each programme. Many give a full exome.",
    countries: [], countriesText: "Probably US only (not stated clearly; check each programme)", doctor: "A clinician orders", cost: "Free or financially supported, depending on the programme",
    genes: ["SHANK3", "NPC1", "NPC2", "GLA", "MAN2B1"], names: /epilep|seizure|phelan|shank3|niemann.pick.*c|fabry|cholesta|cataract|zellweger|peroxisom|alpha.mannosidosis/i, symptoms: ["seizures", "liver", "eyes"],
    source: at("https://www.genedx.com/providers/genetic-testing-programs"),
  },
  {
    id: "pg-programmes", name: "PreventionGenetics sponsored programmes", lab: "PreventionGenetics",
    forWho: "More than 15 areas, including hearing loss, inherited retinal disease, Friedreich ataxia (16 and over), hATTR amyloidosis, acute hepatic porphyria, primary hyperoxaluria type 1, hypoparathyroidism, cholestasis, early cataracts, rare genetic obesity, TK2 deficiency and periodic paralysis",
    eligibility: "Rules differ for each programme.",
    countries: ["US"], countriesText: "Mostly US. Some also Canada. Hearing loss also Brazil and Mexico.", doctor: "A clinician orders", cost: "No charge for eligible patients",
    genes: ["FXN", "TTR", "AGXT", "TK2", "MC4R", "LEPR", "POMC"], names: /hearing loss|deaf|retin|leber congenital|friedreich|transthyretin|hattr|porphyria|hyperoxaluria|hypoparathyroid|cholesta|cataract|obesity|tk2|periodic paralysis|auditory neuropathy|chylomicron|zellweger|peroxisom/i,
    symptoms: ["hearing", "eyes", "liver", "growth", "movement"],
    source: at("https://www.preventiongenetics.com/sponsored-testing"),
  },
  {
    id: "ambry-programmes", name: "AmbryLink sponsored programmes", lab: "Ambry Genetics",
    forWho: "Familial chylomicronemia syndrome (FCS), homozygous familial hypercholesterolaemia (HoFH), Danon disease (under 40)",
    eligibility: "Rules differ for each programme.",
    countries: ["US"], countriesText: "US", doctor: "A clinician orders", cost: "No cost for eligible patients",
    genes: ["LAMP2", "LPL"], names: /chylomicron|hypercholesterol|danon/i, symptoms: ["heart"],
    source: at("https://www.ambrygen.com/partners/sponsored-testing"),
  },
  {
    id: "probably-genetic", name: "Probably Genetic free testing programmes", lab: "A CLIA/CAP partner lab",
    forWho: "A changing list of conditions, with limited places",
    eligibility: "Fill in an online check. If accepted, you get a home saliva or cheek kit. Their own clinicians order the test, and you get a counselling appointment for results.",
    countries: [], countriesText: "Countries not clearly stated. Check on their site.", doctor: "Their own clinicians order, so you do not need your own doctor", cost: "Free if eligible",
    general: true, source: at("https://www.probablygenetic.com/faq"),
  },
  {
    id: "ptc-pinpoint", name: "PTC Pinpoint Direct: CP Spectrum", lab: "Invitae, with Genome Medical counselling",
    forWho: "Cerebral palsy-like symptoms without a brain injury (for example AADC deficiency)",
    eligibility: "US, all ages. You can start it yourself.",
    countries: ["US"], countriesText: "US", doctor: "Ordered through Genome Medical", cost: "Free when it started in April 2021",
    caution: "We found the launch news from 14 Apr 2021 only. Check it is still running.",
    genes: ["DDC"], names: /cerebral palsy|aadc|aromatic l.amino/i, symptoms: ["movement"],
    source: at("https://ir.ptcbio.com/news-releases/news-release-details/ptc-therapeutics-launches-ptc-pinpoint-directtm-program-patient"),
  },
];

export interface ProgrammeMatch {
  programme: Programme;
  /** true: open in the chosen country. false: not open there. null: not clearly stated. */
  inCountry: boolean | null;
}

export function matchProgrammes(opts: { genes: string[]; name: string | null; symptoms: string[]; country: string | null }): ProgrammeMatch[] {
  const genes = opts.genes.map((g) => g.toUpperCase());
  const out: ProgrammeMatch[] = [];
  for (const p of PROGRAMMES) {
    const byName = !!(opts.name && p.names?.test(opts.name) && !(p.excludeNames?.test(opts.name)));
    const byGene = !!p.genes?.some((g) => genes.includes(g)) && !(opts.name && p.excludeNames?.test(opts.name));
    const bySymptom = !!p.symptoms?.some((s) => opts.symptoms.includes(s));
    if (!(byName || byGene || bySymptom || p.general)) continue;
    const inCountry = p.countries.length === 0 || !opts.country ? null : p.countries.includes(opts.country);
    out.push({ programme: p, inCountry });
  }
  const rank = (m: ProgrammeMatch) => (m.programme.general ? 3 : m.inCountry === true ? 0 : m.inCountry === null ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b));
}
