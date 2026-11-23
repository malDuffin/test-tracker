# AI Changelog: Test Tracker

Newest first. Times are Europe/London. Every AI adds an entry: what changed, tests, deploy state,
unfinished work. Write GitHub state and deployed state separately.

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
