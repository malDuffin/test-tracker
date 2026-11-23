import type { Source } from "@/lib/types";

const at = (url: string, label?: string): Source => ({ url, checked: "2026-11-23", label });

/** Free public (state) routes. Only countries we have checked get a named route. */
export interface PublicRoute {
  id: string;
  /** ISO2 country code, plus UK nation where needed */
  country: string;
  nation?: "eng" | "sct" | "wls" | "nir";
  name: string;
  /** Plain steps, English (i18n keys) */
  how: string[];
  caution?: string;
  sources: Source[];
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    id: "nhs-england", country: "GB", nation: "eng", name: "NHS Genomic Medicine Service (England)",
    how: [
      "NHS testing is free when your situation matches the National Genomic Test Directory.",
      "A specialist asks for the test, for example clinical genetics, a children's doctor (paediatrician) or a children's neurologist.",
      "Ask your GP or specialist about a referral to clinical genetics.",
    ],
    sources: [
      at("https://www.england.nhs.uk/publication/national-genomic-test-directories/", "NHS England: National Genomic Test Directories"),
      at("https://www.eastgenomics.nhs.uk/for-healthcare-professionals/genomic-tests/referral-forms-index/rare-disease-whole-genome-sequencing-wgs/", "East Genomics: rare disease whole genome sequencing"),
    ],
  },
  {
    id: "nhs-scotland", country: "GB", nation: "sct", name: "NHS Scotland clinical genetics services",
    how: [
      "Scotland has its own genomic test directory listing the tests NHS Scotland offers.",
      "Ask your GP or specialist about a referral to your regional clinical genetics service.",
      "Not every referral gets an appointment, and some clinics have long waits.",
    ],
    caution: "One Glasgow page says some clinics have waits of 1 to 2 years.",
    sources: [
      at("https://www.genomics.nhs.scot/test-directories/", "Scottish Strategic Network for Genomic Medicine: test directories"),
      at("https://services.nhslothian.scot/geneticservice/referrals/", "South East Scotland Genetic Service: referrals"),
      at("https://www.nhsggc.scot/staff-recruitment/staff-resources/laboratory-medicine/clinical-genetics/information-for-clinicians/", "NHS Greater Glasgow and Clyde: clinical genetics"),
    ],
  },
  {
    id: "nhs-wales", country: "GB", nation: "wls", name: "All Wales Medical Genomics Service (AWMGS)",
    how: [
      "AWMGS sees people with a known or suspected genetic condition.",
      "Your GP or another health professional refers you.",
      "Wales uses the NHS England test directory rules for most rare disease tests.",
    ],
    sources: [
      at("https://medicalgenomicswales.co.uk/index.php/en/patient-information/what-do-we-do", "AWMGS: what do we do?"),
      at("https://jcc.nhs.wales/policies-resources/policies/genomics/genomic-services-service-specification-cp99-june-2022-pdf/", "NHS Wales: Genomic Services specification CP99"),
    ],
  },
  {
    id: "hscni", country: "GB", nation: "nir", name: "Northern Ireland Regional Genetics Service (Belfast City Hospital)",
    how: [
      "The service sees adults and children with a known or suspected genetic condition.",
      "A health professional refers you. Exome and genome tests are asked for by clinical genetics.",
      "Ask your GP or specialist about a referral.",
    ],
    sources: [
      at("https://belfasttrust.hscni.net/service/laboratory-services/clinical-genetics/", "Belfast Trust: Clinical Genetics Service"),
      at("https://belfasttrust.hscni.net/service/laboratory-services/clinical-genetics/requesting-genetic-testing/", "Belfast Trust: requesting genetic testing"),
    ],
  },
  {
    id: "ireland-hse", country: "IE", name: "HSE and Children's Health Ireland clinical genetics",
    how: [
      "Children's Health Ireland runs clinical genetics at Crumlin and Temple Street, for children and adults.",
      "Your GP or consultant must write a referral letter. You cannot refer yourself.",
      "The HSE National Genomic Test Directory (from Feb 2026) lists which tests are offered and who can ask for them.",
    ],
    caution: "Families report long waits. We have not checked current waiting times.",
    sources: [
      at("https://www.childrenshealthireland.ie/list-of-services/clinical-genetics/", "Children's Health Ireland: clinical genetics"),
      at("https://assets.hse.ie/media/documents/National_Genomic_Test_Directory_-_Rare_and_Inherited_Disease.pdf", "HSE National Genomic Test Directory, Rare and Inherited Disease, v1.1 (13 Feb 2026)"),
    ],
  },
];

export function routesFor(country: string | null, nation: string | null): PublicRoute[] {
  if (!country) return [];
  const all = PUBLIC_ROUTES.filter((r) => r.country === country);
  if (country === "GB" && nation) return all.filter((r) => r.nation === nation);
  return all;
}

/** Countries with a named public route in this version. */
export const COUNTRIES_WITH_ROUTES = [...new Set(PUBLIC_ROUTES.map((r) => r.country))];
