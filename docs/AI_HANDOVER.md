# AI Handover Guide: Test Tracker

Read this before changing anything, then add your session to `docs/AI_CHANGELOG.md` (what changed,
tests, deploy state, unfinished work; GitHub state and deployed state written separately).
Rules for every AI: `AGENTS.md`.

## What it is

A free, static web app in the Rare Disease Planet suite. Families pick a condition or gene (or "No
diagnosis yet" and some symptoms), their country, and whether they have a doctor. They see:

1. Summary (condition, genes, what kind of change the variant is, look-alike gene notes).
2. **Free routes to check first**: the public route for their country (named routes for England,
   Scotland, Wales, Northern Ireland and Ireland; a generic "ask your health service" card elsewhere,
   which says we have not checked that country) and matching free sponsored programmes, with the
   sponsor data-sharing note and country limits.
3. **Which test first?** (only when the variant is unknown): testing order by condition type.
4. **Tests that look at this gene**: best test per lab from the NIH Genetic Testing Registry, with a
   Yes / Partly / No / Unknown verdict. Hand-checked labs show their prices and ordering rules.
5. **Broad tests**: hand-checked exomes, genomes (and microarrays for region syndromes) with prices,
   source badges, "last checked", doctor rules, turnaround, sample, raw data, counselling, countries.
6. **No doctor? Ways to get a test ordered** (when the family says No or Not sure, and always for
   undiagnosed).
7. **Consumer DNA kits: not a diagnosis** (collapsed), with a per-kit line for the chosen condition.
8. Questions to ask the lab, next steps (links to RDP, Variant Visual, Rare Disease Body), footer
   disclaimers, credits and contact.

## Stack and layout

Vite 5 + React 18 + TypeScript + Tailwind 3, the same shape as Variant Visual (index.html at the
root, `src/main.tsx`, `@` alias to `src`). No backend, no env vars, no database.

```text
index.html                 entry
src/App.tsx                page, form state, URL params, footer
src/components/Form.tsx    condition combobox, variant box, symptoms, country (+ UK nation), doctor
src/components/Results.tsx all result sections
src/components/ui.tsx      Section, Card, VerdictBadge, PriceList, Checked, SourceLink
src/lib/variant.ts         classifyVariant(): snv, indel, exon_cnv, large_cnv, repeat, mtdna, methylation, unknown
src/lib/rules.ts           profileFor(): condition type, needed kinds, testing order, notes, sources
src/lib/coverage.ts        judgeCoverage() verdict rules; abilitiesFromGtr() GTR method flags to abilities
src/lib/params.ts          parseParams() for ?name ?gene ?variant ?country ?nation ?lang ?mode
src/lib/catalogue.ts       condition search and resolve (data: public/data/catalogue.json)
src/lib/gtr.ts             loads public/data/gtr/meta.json and per-letter shards on demand
src/data/*.ts              hand-checked labs/offers, programmes, public routes, consumer kits, symptoms, countries
src/i18n/                  t(), language list (same as RDB/RDP), loads public/i18n/<code>.json
scripts/sync-catalogue.ts  rebuild catalogue.json from VV + RDP repos (bun)
scripts/build_gtr_index.py rebuild GTR shards (downloads 13 MB test_version.gz, deletes it after)
scripts/extract-ui-strings.mjs  collect English UI strings into public/i18n/en.json
scripts/translate_ui.py    offline machine translation (NLLB-200 1.3B, CTranslate2) of missing keys
tests/                     vitest: variant types, coverage verdicts, testing order, URL params, data rules
docs/research/             research notes, plan and the draft lab data this app was built from
```

## Coverage rules (src/lib/coverage.ts)

- Gene not in the test: **No**. Gene inclusion unknown: **Unknown**.
- Every needed kind found: **Yes**.
- Main kind (first in the needed list) cannot be found and nothing else is found: **No**.
- Nothing clearly found or missing: **Unknown**. Anything else: **Partly**.
- Needed kinds: the known variant's kind if a variant was given; otherwise the condition profile
  (for example DMD: missing/extra exons, single-letter, small indel; repeat disorders: repeat).
- GTR lists methods per test, not per gene. For tests with 3 genes or fewer, an unlisted repeat or
  methylation method counts as "cannot". For bigger panels it counts as "unclear". Missing or extra
  exons not listed always counts as "unclear" (ask the lab).
- Exomes: single letters and small indels yes; repeats and methylation no; CNV and mtDNA only where
  the lab says so. Genomes: CNV, repeats and mtDNA "unknown" unless the lab says so.

## Data rules

- Never invent a price, ability, programme, eligibility rule or country. Each price has a badge:
  lab's own, charity guide estimate (UDNF 25 Mar 2026), clinic's own, sale, income-based, or price on
  request. Rows older than 90 days show "may be out of date".
- Lab, test and programme details stay in English (translated UI says so).
- PanelApp is not used (terms).
- The UDNF guide text is not committed (it is the charity's document); we link to it.

## Commands

| Command | Purpose |
| --- | --- |
| `bun install` | install |
| `bun run dev` | dev server on port 8080 |
| `bun run test` | vitest (70 tests at v1) |
| `bun run typecheck` | TypeScript |
| `bun run build` | static build to `dist/` |
| `VV_REPO=../ee-repo RDP_REPO=../rdp-repo bun scripts/sync-catalogue.ts` | refresh catalogue |
| `python3 scripts/build_gtr_index.py` | refresh GTR index (needs `scripts/.catalogue-genes.txt` from the sync) |
| `node scripts/extract-ui-strings.mjs` then `NLLB_DIR=... python scripts/translate_ui.py` | refresh translations |

## Deployment

- GitHub: https://github.com/malDuffin/test-tracker (`main`) is the source of truth.
- Hosting: Lovable, hosting-only project (not created yet at v1). Plan, same as Echoes - Menu:
  create the project with the smallest prompt, connect GitHub in Lovable (this creates a Lovable
  mirror repo), push our `main` over the mirror, wait for `latest_commit_sha`, then `deploy_project`.
  Badge off, remix off. Never use Lovable chat.
- New Lovable projects start on Lovable's TanStack Start template. If Lovable's build does not accept
  this plain Vite app, follow the Newborn Screening Guide approach: keep Lovable's template files
  (vite config, router, server, package.json) and render `<App />` from the index route.

## Known gaps (v1)

- Public routes checked only for the UK (4 nations) and Ireland. Other countries see a generic card.
- No Irish private lab or clinic prices found. EU labs (Blueprint, CENTOGENE, CeGaT) are quote-only.
- Invitae exome price conflict (UDNF 3,522 USD vs an undated third-party copy of 1,250 USD) is shown.
- Probably Genetic countries and the PTC Pinpoint programme status are not verified.
- AncestryDNA wording not checked on Ancestry's own site.
- GTR entries for some big labs are years old (shown on each card).
- Translations are machine made (offline NLLB) and not medically reviewed; keys the model could not
  translate cleanly fall back to English (see public/i18n/_meta.json).
- No clinical review of the testing-order rules yet (Mal's plan suggested a genetic counsellor review).
- "Report a wrong price" uses email for now, not the suite's central report list.
