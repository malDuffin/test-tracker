# Private genetic test chooser: plan (draft for Mal)

Status: research and plan only. No project, repo or deploy created. No company contacted.

## 1. Who it is for and the promise

For families who cannot get a genetic test through their doctor or health service (or face a long wait) and want to understand their private and free options. The promise, in plain words:

> "Tell us the condition or gene and where you live. We show you tests that look at that gene, what they cost, whether you need a doctor, and what each test might miss."

It is a guide, not a shop. No ranking by commission, no affiliate links.

## 2. User flow

1. **Start:** "What are you looking for?" Pick a condition or a gene (search box powered by our existing catalogue). Option: "I don't know yet" leads to broad options (exome/genome) and free symptom-based programmes.
2. **Where do you live?** Country (and US state later, if needed). Drives currency, public route card and which labs/programmes apply.
3. **Do you have a doctor or genetic counsellor who can order a test?** Yes / No / Not sure. "No" highlights routes that include ordering (Genome Medical in the US, UK private clinics, Probably Genetic, sponsored programmes with their own clinicians).
4. **Budget (optional):** Free only / up to about 500 / up to about 2,000 / any. Shown in local currency, labelled "approximate".
5. **Results page:**
   - Top card, always first: **"Free routes to check first"** (NHS GMS for UK; sponsored programmes that match the gene; the family's own health service).
   - Then **test cards**, grouped: "Tests focused on this gene or condition" (single gene, panels), "Broad tests" (exome, genome), "Consumer DNA kits (not diagnostic)" collapsed at the bottom with a warning.
6. **Card detail:** what the test looks at, what it might miss, how to order, a "Questions to ask the lab" checklist, and the lab link.
7. **End:** "Next steps" (talk to a genetic counsellor, find a community on Rare Disease Planet, see the gene in Variant Visual) and "Report a wrong price or link" (feeds the existing suite issue-report flow, no email).

## 3. Result card fields

| Field | Example | Source |
|---|---|---|
| Company and test | Revvity Omics, Whole Exome Proband Only | labs.json |
| Price | $900 self-pay, checked 23 Nov 2026 | labs.json (lab page) |
| Price type badge | "Lab's own price" / "Estimate from a charity guide" / "Ask the lab" | labs.json price_type |
| Covers this gene | **Yes / Partly / No / Unknown** | GTR + lab gene list + variant-type rules |
| Variant-type notes | "Looks for missing or extra exons: yes. Repeat expansions: no." | GTR method categories + curated test limits |
| Doctor needed | "A doctor must order. No doctor? Genome Medical can order after a video visit (up to $250)." | labs.json |
| Turnaround, sample | 4 weeks, blood or saliva | labs.json |
| Raw data, counselling, reanalysis | Raw data included | labs.json |
| Data sharing | "Sponsors get de-identified data" for sponsored rows | labs.json |
| Last checked | 23 Nov 2026 + link | per row |

**Coverage rule (gene AND variant type):**
- Each condition gets a list of *needed variant types* (for example DMD: small changes + exon deletions/duplications; Fragile X: repeat sizing + methylation; mitochondrial gene MT-*: mtDNA).
- **Yes:** the test includes the gene and every needed variant type.
- **Partly:** gene included but at least one needed type is missing or unclear (shown in words: "may miss exon deletions, which cause most Duchenne").
- **No:** gene not in the test, or the test cannot detect the main variant type at all.
- **Unknown:** not enough public data; say "Ask the lab: does this test include GENE and detect TYPE?"
- Exomes and genomes count as covering protein-coding genes by default, then the variant-type rules apply (repeats, methylation, pseudogenes, mtDNA if not included).

## 4. Data and how the lookup works

**Our existing data drives the search box:**
- Variant Visual catalogue: `/workspace/ee-repo/src/data/diseaseGenes.ts` (entry point) with entries in `src/data/diseases/catalogue/part01-20.ts` (about 3,778 labels, 1,389 unique genes), plus `regionContext` for CNV/region syndromes (`src/data/cnvRegions.ts`) and mitochondrial helpers (`src/data/diseases/geneSymbols.ts`). `resolveDiseaseName` / `genesForDiseaseName` already map names and aliases to genes.
- RDP catalogue: `/workspace/rdp-repo/src/lib/catalogue/data/genes/` (`gene-by-disease.ts`, `genes-by-disease.ts`, `ee-name-links.ts`, `non-genetic-diseases.ts`). Non-genetic conditions should show "This condition is not usually caused by a single gene change, so a genetic test may not help" instead of results.
- Best path: export a small JSON (condition, aliases, genes, region flag, mito flag) from VV at build time, the same way RDB body views sync today, so the new app never drifts.

**New data the app needs:**
1. `labs.json` (curated, hand-checked; draft in `data/labs.json`).
2. `gene_tests.json` built weekly from GTR `test_version.gz` / `test_condition_gene.txt`: for each gene, the current tests at the curated labs with method categories and GTR last-update date. Proven feasible: 1,386 of our 1,389 VV genes appear in GTR (matching must be case-insensitive).
3. `variant_type_rules.json`: hand-curated per condition (needed variant types), starting with the conditions most searched on RDP. Never invented: each rule cites GeneReviews or a similar source.

## 5. Disclaimers (neutral, always visible)

- "This is general information, not medical advice. A genetic counsellor or doctor can help you choose the right test."
- "We are not paid by any lab or programme. We do not earn money if you choose a test." (If that ever changes, disclose per card.)
- "Prices change often. Always get a written quote from the lab before you pay."
- "A test that includes a gene can still miss some kinds of changes. Check the notes on each card."
- "Free sponsored programmes are paid for by drug companies. They usually receive anonymised results and your clinician's contact details."
- "Ancestry and wellness DNA kits are not designed to diagnose rare diseases."
- UK/Ireland: "You may be able to get NHS or HSE testing for free. Ask your GP or specialist about a referral to clinical genetics."

## 6. Freshness plan

- Every price row has `last_checked` and a source URL shown on the card.
- Weekly routine (box, read-only): download GTR files, rebuild `gene_tests.json`, diff and open a PR.
- Monthly routine: re-open every lab/programme URL in labs.json, flag changed prices or dead links in a PR for review. Rows older than 90 days show "may be out of date".
- "Report a wrong price" button feeds the suite's central report list.

## 7. Privacy

- No accounts, no PII stored. Search choices stay in the browser (URL params or localStorage only).
- No analytics that capture condition names tied to a person; aggregate counts only if anything.
- Outbound lab links open plainly, with no tracking parameters.

## 8. Multilingual

Use the suite's existing i18n approach (RDB has 23 languages). Lab data stays in English with translated labels and caveats. Currency shown as the lab publishes it, with an optional "about X in your currency" note.

## 9. Name ideas

- **Test Finder** (Rare Disease Planet Test Finder)
- **GeneTest Guide**
- **Which Test?**
- **Test Compass**
- **Find My Test**

## 10. Tech stack (fits the suite)

- New repo under malDuffin, git-first; built with Grok Build per Mal's preference; no Lovable credits.
- Static React + Vite + TypeScript + Tailwind, same look as the suite; all data as static JSON in the repo, so no database or backend is needed for v1.
- Build scripts (bun): `sync-catalogue` (from VV), `build-gene-tests` (from GTR), `check-links`.
- Hosting: whatever Mal picks for Grok Build apps; a subdomain like tests.rarediseaseplanet.com.
- Deep links: `?gene=DMD&country=GB`, and links into it from VV, RDP and RDB gene pages.
- Docs: `docs/AI_CHANGELOG.md` from day one.

## 11. Open decisions for Mal

1. **Name and domain** (for example Test Finder on a rarediseaseplanet.com subdomain).
2. **Regions for v1:** US + UK + Ireland first, then EU? (Free programmes are mostly US/Canada.)
3. **Consumer whole-genome kits:** show them in a clearly labelled "not diagnostic" section, or leave them out?
4. **Secondary prices:** OK to show UDNF-sourced estimates with a badge, or only lab-published prices and "Ask the lab"?
5. **Contacting labs:** may we email labs (from team@rarediseaseplanet.com) to ask for cash prices and gene lists? Needs your approval and a draft each time.
6. **PanelApp:** apply to Genomics England for a use agreement, or skip it?
7. **Clinical review:** can a genetic counsellor review the caveat wording and variant-type rules before launch?
8. **Sponsored programmes:** list all, or only those with no data-sharing beyond de-identified data?
9. **Hosting and build:** confirm Grok Build for this new app, and where it is hosted.
10. **Suite links:** add "Find a test" buttons on VV gene boards and RDP disease pages at launch?

## 12. Gaps still to research

MNG Laboratories, Igenomix/Synlab and other EU labs, Irish private clinics, Centogene and CeGaT price quotes, each lab's raw-data and privacy policy, the current Probably Genetic programme list and countries, and Rare Diseases Ireland wait figures (from the PDF itself).
