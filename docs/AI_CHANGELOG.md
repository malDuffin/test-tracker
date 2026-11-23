# AI Changelog: Test Tracker

Newest first. Times are Europe/London. Every AI adds an entry: what changed, tests, deploy state,
unfinished work. Write GitHub state and deployed state separately.

## 2026-11-23 (evening): FSHD type picker, full translations (Grok Bot)

Mal's FSHD decisions (23 Nov 2026, finalised in t2175): the variant box for FSHD becomes a type
picker, with D4Z4 sizing first. Research: /workspace/fshd-variant-options/RESEARCH.md (not in repo).

- New reusable pattern `src/data/subtypes.ts`: a SubtypeSet (question, match rule, options, optional
  `parseVariant`, `repeatNotes`, `display`). When a condition matches, the variant box is replaced by
  toggle buttons, "Unknown" first and default. Each option sets the kinds of change needed, the
  testing order, notes, sources, the genes shown and an optional special test group.
- FSHD options and stable ids (shared with RDP and VV): `unknown`, `fshd1`, `fshd2-smchd1`,
  `fshd2-dnmt3b` (sometimes called FSHD4), `fshd2-lrif1` (sometimes called FSHD3), `fshd1-fshd2`,
  `fshd1-mosaic`, `fshd1-4q-deletion` (Mal, t2179: proximal 4q35 deletions that remove part or all
  of D4Z4, so the repeat count may not be readable), `custom` (Other: free text shown back as "Custom: <text>", trimmed, never rewritten;
  a "this looks like" hint offers a switch, the person confirms).
- FSHD1, combined and mosaic get an optional repeat units box plus an EcoRI kb helper
  ((kb minus 5) / 3.3, FSHD Society), shown as an estimate. Range notes: 1-3, 1-7, 8-10 borderline
  (suggest methylation and FSHD2 genes), 11+.
- Suggested tests: Unknown/FSHD1/Other: D4Z4 sizing first (panels, exomes, genomes and kits cannot
  measure D4Z4), then FSHD2. FSHD2 genes: that gene's panels plus 4qA and D4Z4 methylation. Combined:
  D4Z4 sizing and SMCHD1 (a panel alone scores Partly). Mosaic: sizing that can detect mosaicism
  (optical genome mapping or pulsed-field Southern blot), with a note that older tests can miss it.
  4q deletion: optical genome mapping or molecular combing (special tests filtered to labs listing
  those methods), or an extended Southern blot that also uses the D4Z4 and 4qA probes, because a
  4q deletion can remove the usual p13E-11 probe site. Sources: GeneReviews NBK1443, the 2024
  guidelines (from the 268th ENMC workshop) and Lemmers et al. 2022 (Hum Mol Genet).
- URL: `?subtype=<id>` or `?fshd_type=<id>` (also accepts `fshd1-plus-fshd2` and `mosaic-fshd1`), `?d4z4_ru=<n>`, and
  `?variant=` in the shared formats ("FSHD1: 5 RU, 4qA", "FSHD2: SMCHD1 c.1876A>G",
  "FSHD1+FSHD2: 9 RU + SMCHD1 c...", "Mosaic FSHD1: 4 RU", "FSHD1 with a 4q deletion" or DPED wording, "Custom: ...", "Unknown", FSHD3/FSHD4).
  Unrecognised text becomes Custom with the original words. Nothing is stored.
- New variant kind `d4z4`. Exomes, genomes, microarrays and kits are "no" for it. GTR flag F_D4Z4 is
  set only when an FSHD test lists optical mapping, Southern blot or molecular combing.
- New `public/data/gtr/special.json` from GTR (file of 15 Nov 2026): 4 D4Z4 sizing tests, from
  Biogipuzkoa (Spain), Bionano Laboratories (US), CHEO (Canada) and University of Iowa (US), shown in
  "Special tests for this condition". Raw GTR dump deleted again.
- Translations: all 23 non-English languages done offline (NLLB-200 distilled 1.3B), marked machine
  translated in `public/i18n/_meta.json` and in the app. Keys that failed checks fall back to English.
- Tests, typecheck and build: see the commit message. GitHub: pushed to main. Deployed: not deployed.
  Lovable: no project, 0 credits.
- Later the same evening (Mal, final ids live in RDP/VV): `src/lib/fshdType.ts` copied from Variant
  Visual main (b411bbd) so parsing and stored strings match all three apps ("FSHD1: 6 RU, 4qA",
  "FSHD2 (SMCHD1): c.1876A>G", "FSHD1 + FSHD2: 9 RU, SMCHD1 ...", "FSHD1 with a 4q deletion: 3 RU").
  Params: `fshd_type` (or `subtype`, or `variant`), `d4z4_ru`, `d4z4_hap`. Toggles and sliders, not
  text boxes: repeat units are Unknown / slider / EcoRI kb slider (estimate), haplotype is Unknown /
  4qA / 4qB / 4A166 toggles. Only Other keeps a text box. 4q deletion also gets the optional units.
- Not done: methylation % (VV has it), passing d4z4_ru / d4z4_hap on to VV links.

## 2026-11-23: v1 first build (Grok Bot)

Mal approved building v1 on 23 Nov 2026: worldwide from the start, charity guide prices with a source
badge, consumer kits in a separate "not a diagnosis" section, URL parameters for RDP, testing order
when the variant is unknown, an undiagnosed route, and hosting on a Lovable hosting-only project with
GitHub as the source of truth.

- New repo malDuffin/test-tracker. Vite + React + TypeScript + Tailwind, same shape as Variant Visual.
- Screens: one page with the form (condition search or symptoms, optional variant, country with UK
  nation, doctor yes/no/not sure) and results (summary, free routes first, which test first, tests
  that look at this gene, broad tests, no-doctor ordering routes, consumer kits collapsed, questions
  to ask, next steps, footer disclaimers and credits).
- Data:
  - Catalogue: 1,498 conditions and 1,416 genes from Variant Visual (c405609) plus 68 Rare Disease
    Planet-only names (RDP 36d66d84); 296 marked "not usually one gene", 29 region syndromes, 9 mtDNA.
  - GTR index (file dated 15 Nov 2026, 63,423 current tests): 1,415 of 1,416 catalogue genes have tests
    (missing: H1-8); 247 labs in 35 countries; up to 40 labs per gene (best test per lab), 37,203 rows,
    4 MB total in 27 shards. Raw dump deleted after the build.
  - Hand-checked: 14 labs, clinics and ordering services, 24 test offers, 8 sponsored programmes,
    5 public routes (England, Scotland, Wales, Northern Ireland, Ireland), 5 consumer kits. Every price
    has a source URL and the date checked (23 Nov 2026).
- i18n: same language list as RDB/RDP; public/i18n/<code>.json keyed by English text; 23 languages
  machine translated offline (NLLB-200 1.3B), not medically reviewed, with a notice in the app.
- Tests: 70 vitest tests (variant classification, coverage verdicts, testing order, URL params, data
  sources, programme matching, catalogue and GTR index, no em dashes, contact address). Typecheck and
  build clean.
- GitHub: pushed to main (see git log). Deployed: not deployed anywhere. No Lovable project created,
  0 Lovable credits.
- Unfinished: Lovable hosting project and GitHub connect (needs Mal), public routes for more
  countries, Irish private options, clinical review of rules, suite links into Test Tracker from
  VV/RDP/RDB, central "report a wrong price" flow.
