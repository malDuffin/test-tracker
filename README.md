# Test Tracker

Free, independent guide that helps families choose a genetic test for a rare condition, especially a
private test when they cannot get one through their doctor. Part of the Rare Disease Planet suite.

- Free public routes and free sponsored programmes first.
- Test cards: price with a source badge and "last checked" date, whether a doctor is needed (and how
  to get one), turnaround, sample, raw data, counselling, countries, link.
- Coverage verdict **Yes / Partly / No / Unknown**, judged by the gene **and** the kind of change.
- A sensible testing order when the change is not known (for example Duchenne: missing or extra exons
  first, then sequencing).
- "No diagnosis yet" route that starts from symptoms or body areas.
- Consumer DNA kits in a separate, collapsed "Not a diagnosis" section.
- English plus 23 machine-translated languages (the same list as Rare Disease Body).

Not medical advice. No accounts, no tracking, nothing typed is stored. No affiliate links.

## Run it

```bash
bun install        # or npm install
bun run dev        # http://localhost:8080
bun run test       # vitest
bun run build      # static site in dist/
bun run preview    # serve dist/
```

## Open it from another app

```
https://<host>/?name=Duchenne%20muscular%20dystrophy&gene=DMD&variant=deletion%20of%20exons%2045-50&country=GB&nation=sct&lang=fr
```

| Parameter | Meaning |
| --- | --- |
| `name` | Condition name (any name or alias from the suite catalogue) |
| `gene` | Gene symbol |
| `variant` | HGVS (c./p./m.) or plain words ("deletion of exons 45 to 50", "CGG repeat") |
| `country` | ISO 3166 two-letter code (`UK` is read as `GB`) |
| `nation` | UK only: `eng`, `sct`, `wls`, `nir` |
| `lang` | Language code, as in Rare Disease Planet |
| `mode=undiagnosed` | Open the symptoms route |

Nothing passed in is stored.

## Data

| File | What | How it is made |
| --- | --- | --- |
| `public/data/catalogue.json` | Condition names, aliases, genes, kind | `bun scripts/sync-catalogue.ts` from Variant Visual and Rare Disease Planet |
| `public/data/gtr/*.json` | Gene to tests index (best test per lab, methods, last update) | `python3 scripts/build_gtr_index.py` from the NCBI Genetic Testing Registry (public domain). The raw download is deleted after the build |
| `src/data/labs.ts` | Hand-checked labs, clinics, prices, abilities | By hand, with a source URL and date on every price |
| `src/data/programmes.ts` | Free sponsored programmes | By hand, with sources |
| `src/data/publicRoutes.ts` | Public routes (NHS England, Scotland, Wales, Northern Ireland, Ireland HSE/CHI) | By hand, with sources |
| `src/data/consumer.ts` | Consumer kits | By hand, with sources |
| `public/i18n/*.json` | UI translations | `node scripts/extract-ui-strings.mjs`, then `scripts/translate_ui.py` (offline NLLB model, machine translated) |

Credits: NCBI Genetic Testing Registry (https://www.ncbi.nlm.nih.gov/gtr/). Some prices: UDNF Clinical
Genetic Testing Lab Comparison Guide, updated 25 Mar 2026 (marked on each card). PanelApp is not used.

See `docs/AI_HANDOVER.md` before changing anything.
