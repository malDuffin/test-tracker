# Private genetic test chooser: research

Read date for every source below: 23 Nov 2026 (Europe/London), unless a row says otherwise.
Machine-readable version with per-price sources: `data/labs.json`.
Nothing here is invented. Where a lab does not publish a price, the table says "quote" or names the secondary source.

## 1. Big picture (plain language)

- **Almost every clinical-grade lab needs a clinician to order the test**, even when the family pays. The family can usually pay directly ("patient pay" / "self-pay"), but a doctor, nurse or genetic counsellor has to sign the order.
- **Workarounds when you have no doctor:**
  - US: Genome Medical (telehealth) lets you self-refer, has a counselling visit (up to $250 self-pay), then orders from a lab. The lab bills separately. [genomemedical.com cost page, dated 28 Jan 2026]
  - Sponsored programmes such as Probably Genetic use their own clinician network, so a family can start online.
  - UK: private clinics (Northway Clinic London, The Genome Clinic Cardiff/online) accept self-referral and order from accredited labs.
- **Price published vs quote:** only a few labs publish cash prices on their own pages (Revvity: $900 exome; Invitae: $299 flat rare-disease panel for income-qualified patients). Most (GeneDx, Fulgent, Blueprint, Centogene, CeGaT) give a quote. The best cross-lab price snapshot is the UDNF "Clinical Genetic Testing Lab Comparison Guide" updated 25 Mar 2026 (a patient charity guide, secondary source).
- **Free sponsored programmes are strong in the US/Canada and almost absent in the UK/Ireland/EU** in what I found. They are usually condition-specific and paid for by drug companies, which receive de-identified data and clinician contact details.
- **Consumer tests are a different thing.** 23andMe/AncestryDNA genotype preset positions and say they are "not intended to diagnose any disease". Consumer whole genomes (Dante, Nebula DNA Complete, Sequencing.com) read the whole genome cheaply but are not a clinician-ordered, symptom-driven diagnostic analysis. Useful as raw data, not as an answer.

## 2. Typical price ranges (self-pay, with sources)

| Test type | Range found | Sources |
|---|---|---|
| Rare-disease gene panel | $299 (Invitae flat rate, income-qualified) to about $1,450-$1,750 (Blueprint); PreventionGenetics about $550; Variantyx $850 | invitae.com/new-programs-2025; UDNF guide 25 Mar 2026 |
| Exome, one person (US) | $900 (Revvity, lab page) to $2,500 (Blueprint, UDNF); GeneDx $1,200, Baylor/Variantyx $1,800 (UDNF); Ambry $800-$1,000 (UDNF); Invitae $1,250 (undated postcard copy) or $3,522 (UDNF): conflicting | revvity.com D1000; UDNF; MD Anderson-hosted Invitae postcard |
| Exome, trio (US) | $2,100 (Variantyx) to $4,000 (Blueprint); GeneDx $2,250 | UDNF |
| Genome, one person (US) | $2,000 (GeneDx) to $3,000 (Baylor); Variantyx $2,100 for proband, duo or trio | UDNF |
| Exome, UK private | £2,000 singleton / £3,500 trio (Northway, via Fulgent); £2,500 single / £4,000 trio (Genome Clinic) | northwayclinic.co.uk; genomeclinic.co.uk tariff from 1 Apr 2026 |
| Genome, UK private | £3,000 singleton / £4,500 trio (Northway); £3,500 / £5,000 (Genome Clinic) | same |
| Counselling / ordering visit | US $250 per visit (Genome Medical); UK £300 counselling, £350 consultation (Genome Clinic) | genomemedical.com; genomeclinic.co.uk |
| Consumer 30x genome (not diagnostic) | $199-$399 Dante; $595 Nebula 30x; Sequencing.com $329-$699 Black Friday sale | lab pages, sale prices on 23 Nov 2026 |

## 3. Comparison table: clinical labs and ordering routes

Key: Dr = clinician order needed. "UDNF" = secondary price from UDNF guide 25 Mar 2026. GTR = NIH Genetic Testing Registry, current public tests and median "last touched" date (from test_version.gz, FTP file dated 15 Nov 2026).

| Lab / route | Base | Tests | Dr? | Self-pay price | Turnaround | Sample | Raw data | Counselling | GTR tests (median last update) |
|---|---|---|---|---|---|---|---|---|---|
| Invitae (Labcorp) | US | gene, panels, exome | Yes | $299 flat panel (income-qualified); exome $1,250 (undated); UDNF lists panels $2,500-4,000, WES $3,522 | not found | blood, saliva, buccal | not found | Free post-test in sponsored programmes; Genome Medical | 333 (2021-07) |
| GeneDx | US | panels, exome, genome | Yes | Quote; UDNF: WES $1,200 / trio $2,250, WGS $2,000 / trio $3,250 | not found | blood, saliva | not found | Via Genome Medical ($250 + $250) | 137 (2025-10) |
| Fulgent | US | gene, panels, exome (20,579 genes, mtDNA, del/dup), genome, RNA | Yes | "Call for details"; Good Faith Estimate | 3-5 wk (one page) / 5-7 wk (another) | not checked | not found | Fulgent GC reviews exome orders | 19,299 (2019-04) |
| PreventionGenetics (Exact) | US | gene, panels, PGxome (CNV + mtDNA), PGnome | Yes | Prompt-pay rates for all tests; UDNF: panels $550, 25% off exome/genome | PGxome 3-5 wk | blood, buccal, saliva, tissue | not found | not found | 756 (2025-11) |
| Revvity Omics | US | panels, exome + mtDNA + CNV | Yes | **$900 exome proband (lab page)** | 4 wk | blood, saliva, DBS, DNA | **Yes, included** | not found | 3 (+513 legacy PerkinElmer) |
| Ambry | US | panels, exome | Yes | UDNF: WES $800-1,000 | not found | blood, saliva, buccal | not found | Genome Medical | 93 (2023-03) |
| Baylor Genetics | US | panels, exome, genome, CMA | Yes | UDNF: WES $1,800, WGS $3,000, CMA $1,200 | not found | blood, saliva, tissue | not found | Post-test only | 2,628 (2019-07) |
| Variantyx | US | panels, exome, genome, CMA | Yes | UDNF: WGS $2,100 (proband, duo or trio) | not found | blood, saliva | not found | Third-party GCs | 45 (2025-12) |
| Blueprint Genetics (Quest) | Finland | panels, exome | Yes | Quote; UDNF: panels $1,450-1,750, WES $2,500 | not found | blood, saliva | not found | Clinical team for providers | 228 (2019-03) |
| CENTOGENE | Germany | panels, exome, genome | Yes (CentoPortal) | Quote; self-pay billing option exists | to verify | not checked | not found | not found | 2 (2022-08) |
| CeGaT | Germany | panels, ExomeXtra, genome (second line) | Yes | Quote (relative tiers only) | not found | not checked | not found | Free reassessment 12 mo-5 yr | 960 (2015-10) |
| Genome Medical | US telehealth | orders from labs | No (self-referral) | Visit up to $250 each | n/a | n/a | n/a | Yes | n/a |
| Northway Clinic | London | Fulgent exome/genome | No (clinic consult) | £2,000 exome, £3,000 genome singleton | not stated | not stated | not stated | Yes (extra) | n/a |
| The Genome Clinic | Cardiff/online | outsourced | No (self-referral) | £950 single gene; £2,500 exome; £3,500 genome | not stated | not stated | not stated | £300 | n/a |

Not yet researched (left out rather than guessed): MNG Laboratories, Igenomix/Synlab and other EU labs, Irish private clinics, data/privacy policies per lab. These go in the next pass.

## 4. Free and sponsored programmes (best ones)

| Programme | For | Who / where | Notes | Source |
|---|---|---|---|---|
| **Decode Duchenne** (PPMD, lab Revvity) | Duchenne/Becker | Confirmed or suspected; US or Canada citizens/residents; no application needed | Covers DMD deletions, duplications and small variants; reflex 133-gene neuromuscular panel; carrier testing for relatives; RNA on request | parentprojectmd.org |
| **Detect Muscular Dystrophy** (Invitae) | MDs incl. DMD, LGMD | US, clinical criteria (CK, weakness, biopsy, calf hypertrophy...) | Excludes FSHD1, OPMD, DM1/DM2. Free post-test counselling | invitae.com/us/sponsored-testing/detect-mdys |
| **Behind the Seizure** (Invitae, BioMarin) | Childhood epilepsy | Under 10, first seizure age 2-5; US (footer also says Canada) | Others go to Invitae Unlock Epilepsy | invitae.com/us/sponsored-testing/behind-the-seizure |
| **GeneDx Accelerating Answers** | Epilepsy, SHANK3 autism, NPC (genome), Fabry, cholestasis, cataracts, PBD-ZSD, alpha-mannosidosis | Eligibility per programme | Many give a full exome | genedx.com/providers/genetic-testing-programs |
| **PreventionGenetics sponsored** | 15+ incl. hearing loss (also Brazil/Mexico), retina (My Retina Tracker), Friedreich ataxia, hATTR, porphyria, TK2, obesity | Mostly US, some Canada | No charge | preventiongenetics.com/sponsored-testing |
| **Ambry AmbryLink** | FCS, HoFH, Danon | US | | ambrygen.com/partners/sponsored-testing |
| **Probably Genetic** | Changing list, limited slots | Online assessment, home saliva kit, its own clinicians order | Good "no doctor" route where eligible | probablygenetic.com/faq |
| **PTC Pinpoint Direct CP Spectrum** | CP-like symptoms without brain injury | US, patient-initiated | Launch release from 2021, current status unverified | ir.ptcbio.com |

Data note for families: Invitae says sponsored-programme sponsors get de-identified (pseudonymised) data and clinician contact details. The app should say this plainly next to every sponsored option.

## 5. UK, Ireland and EU

- **England:** the NHS Genomic Medicine Service tests for free when a clinical indication in the National Genomic Test Directory is met, requested by an eligible specialist (for example clinical genetics, paediatrics, paediatric neurology). Rare disease WGS is ordered through Genomic Laboratory Hubs. [england.nhs.uk national genomic test directories; East Genomics WGS ordering pages]. The app should always show "Ask about NHS testing first" for UK users.
- **UK private:** Northway Clinic (Fulgent) and The Genome Clinic publish prices (section 2). Both accept self-referral.
- **Ireland:** public route via Children's Health Ireland clinical genetics; Rare Diseases Ireland reports describe long waits (figures not yet verified from the PDF). No Irish private price list found yet.
- **EU labs:** CENTOGENE and CeGaT (Germany) and Blueprint (Finland) take international self-pay orders through a clinician, prices on quote.

## 6. Consumer tests (not diagnostic)

- **23andMe / AncestryDNA:** genotyping chips read a preset list of positions. 23andMe's own support page says its test "is not intended to diagnose any disease" and that a report "may only look at a subset of those variants", so a clear result does not rule out a condition. [support.23andme.org, How Accurate Is 23andMe]
- **Consumer whole genome (Dante, Nebula DNA Complete, Sequencing.com):** cheaper (about $199-$699 on sale) and give raw data (FASTQ/BAM/VCF), but analysis is not ordered for a specific person's symptoms by a clinician and is not a substitute for a clinical exome/genome report. Dante claims CLIA/CAP/ISO 15189 and "physician-ready" reports, which the app should describe neutrally and not endorse.
- **Plain-language line for the app:** "Ancestry and wellness DNA kits are not designed to find the cause of a rare disease. A clear result does not mean your family member does not have a genetic condition."

## 7. GTR (NIH Genetic Testing Registry) as the coverage data source

What I checked (read-only, public domain files, 23 Nov 2026):
- FTP `https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/`: `test_condition_gene.txt` (daily), `test_version.gz` (tests, labs, methods, genes, last-touch date), `gtr_ftp.xml.gz` (full XML, 176 MB, dated 22 Nov 2026), plus E-utilities (`db=gtr`, 63,475 records, last update 22 Nov 2026).
- **Licence:** NLM public domain; please attribute GTR (link to ncbi.nlm.nih.gov/gtr). NIH does not verify submissions and does not endorse labs. [GTR data README]
- **Fields we can use:** lab name, country, CLIA number, test name, conditions, genes, method categories (for example "Deletion/duplication analysis", "Sequence analysis of the entire coding region", "Methylation analysis"), methods (for example "Trinucleotide repeat by PCR or Southern Blot"), OrderableBy and Specimen (XML), last-touch date.
- **Fields GTR does not have:** price, turnaround, direct-to-patient availability, sponsored eligibility. (No price or turnaround element in GTRPublicData.xsd.)
- **Scale:** 63,423 current public tests from 342 labs in 39 countries; 209 labs in the US, 5 in the UK, 0 listed for Ireland.
- **Freshness problem:** median last update is 2019 for Fulgent, Blueprint and Baylor, 2021 for Invitae, 2015 for CeGaT; GeneDx (2025) and PreventionGenetics (2025) are fresh. CENTOGENE has only 2 tests listed.
- **Exome/genome problem:** only 2 current tests list 4,000+ genes. Most labs register exomes without a full gene list, so GTR cannot answer "does exome X cover gene Y" by gene list.
- **Good news for our catalogue:** 1,386 of 1,389 gene symbols in the Variant Visual catalogue appear in at least one current GTR test, and 1,381 have at least one test listing deletion/duplication analysis. The 3 misses are case only (C9orf72, C19orf12) plus H1-8.

**Verdict:** use GTR as the backbone for *panels and single-gene tests* (which genes, which variant types, which labs), always showing the GTR "last updated" date and a link to the lab page. Do not use GTR alone for exomes/genomes, prices, turnaround or who can order. Those come from our own curated `labs.json`, checked by hand against each lab's page. Lab-published gene lists (most labs have a downloadable panel gene list) are the tie-breaker when GTR is stale.

PanelApp (Genomics England) has a public API, but its terms forbid diagnostic use, medical decision-making or providing a healthcare service without a separate agreement, so it is only safe as background reading unless Mal gets an agreement. [PanelApp Terms of Use, Dec 2019 PDF]

## 8. Variant types: why "covers the gene" is not enough

Plain-language caveats the app must show, by variant type:
- **Small changes (spelling mistakes in the gene):** found by sequencing panels, exomes and genomes.
- **Missing or extra exons (deletions/duplications):** need del/dup or CNV analysis. Example: most Duchenne changes are exon deletions or duplications, so a DMD test must say it includes del/dup. GTR shows only 147 of 308 current DMD tests list a del/dup method.
- **Repeat expansions** (for example Fragile X, Friedreich ataxia, myotonic dystrophy, Huntington's): standard exomes do not size these. Revvity's exome page says it cannot detect "areas containing large numbers of tandem repeats". Needs a specific repeat test.
- **Methylation / imprinting** (for example Angelman, Prader-Willi, Beckwith-Wiedemann): needs methylation testing.
- **Mitochondrial DNA:** only some exomes include the mitochondrial genome (Revvity, Fulgent, PreventionGenetics say they do).
- **Deep intronic and regulatory changes:** usually missed by exomes; genomes and RNA tests do better.
- **Genes with look-alike copies** (pseudogenes, for example SMN1, PKD1, CYP21A2): often need special methods; Revvity says such regions "are not analyzed".
- **Mosaicism and balanced rearrangements:** often missed.

## Sources (all read 23 Nov 2026)

- https://www.invitae.com/new-programs-2025
- https://www.invitae.com/individual-faqs/billing
- https://www.invitae.com/us/genetic-testing-access-programs
- https://www.invitae.com/us/sponsored-testing/detect-mdys
- https://www.invitae.com/us/sponsored-testing/behind-the-seizure
- https://mdanderson.cloud-cme.com/assets/mdanderson/pdf/6th%20Hereditary/BI%20Exception%20Billing%20Postcard%20(PC123)%20(1).PDF (undated)
- https://www.genedx.com/patients/resources/billing-and-insurance
- https://www.genedx.com/providers/genetic-testing-programs
- https://www.fulgentgenetics.com/whole-exome
- https://web.fulgentgenetics.com/genomic-testing/exome
- https://web.fulgentgenetics.com/resources/billing
- https://www.preventiongenetics.com/tests/pgxome-whole-exome-test
- https://www.preventiongenetics.com/articles/pgxome-next-gen (dated 5 Oct 2026)
- https://www.preventiongenetics.com/coverage
- https://www.preventiongenetics.com/sponsored-testing
- https://www.revvity.com/test/Whole-Exome-Sequencing-Proband-Only-D1000
- https://www.blueprintgenetics.com/patients/
- https://www.ambrygen.com/partners/sponsored-testing
- https://www.centogene.com/diagnostics/how-to-order-ship/billing-options/
- https://cegat.com/diagnostics/diagnostic-methods/exome-diagnostics/
- https://www.genomemedical.com/genetics-care/cost-of-genetic-counseling-and-testing/ (dated 28 Jan 2026)
- https://udnf.org/download/4625/?tmstv=1780428553 (UDNF Clinical Genetic Testing Lab Comparison Guide, updated 25 Mar 2026; text copy in sources/)
- https://www.parentprojectmd.org/about-duchenne/decode-duchenne/diagnostic-testing/
- https://www.probablygenetic.com/ and https://www.probablygenetic.com/faq
- https://ir.ptcbio.com/news-releases/news-release-details/ptc-therapeutics-launches-ptc-pinpoint-directtm-program-patient (dated 14 Apr 2021)
- https://northwayclinic.co.uk/services/comprehensive-genomic-testing-exome-genome/
- https://www.genomeclinic.co.uk/professional-fees-and-tariff/ (tariff from 1 Apr 2026)
- https://www.england.nhs.uk/publication/national-genomic-test-directories/
- https://www.eastgenomics.nhs.uk/for-healthcare-professionals/genomic-tests/referral-forms-index/rare-disease-whole-genome-sequencing-wgs/
- https://dantelabs.com/whole-genome-sequencing
- https://dnacomplete.com/
- https://sequencing.com/
- https://support.23andme.org/hc/en-us/articles/42965747794199-How-Accurate-Is-23andMe
- https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/ and its _README.html; https://ftp.ncbi.nlm.nih.gov/pub/GTR/documentation/GTRPublicData.xsd
- https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=gtr
- https://prod-media-panelapp.genomicsengland.co.uk/media/files/GEL_-_PanelApp_Terms_of_Use_December_2019.pdf
