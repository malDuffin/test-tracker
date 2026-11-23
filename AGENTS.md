# AGENTS.md: rules for any AI working on Test Tracker

Read `docs/AI_HANDOVER.md` first. Record every change in `docs/AI_CHANGELOG.md` (what, tests, deploy
state, unfinished work; GitHub state and deployed state written separately).

1. GitHub `malDuffin/test-tracker` (`main`) is the source of truth. Hosts only build it.
2. Never edit through Lovable chat (costs credits). Lovable is hosting only. Lovable badge OFF,
   remix OFF.
3. Never invent prices, coverage, programmes, eligibility or clinical facts. Every row needs a
   source URL and the date it was checked. If unsure, say "Ask the lab" or "price on request".
4. Do not use Genomics England PanelApp data (its terms forbid this use without an agreement).
5. Plain language (reading age about 11), patient and family first. No em dashes in UI copy.
6. No PII, no accounts, no analytics with PII. Nothing from URL parameters is stored.
7. Contact address is team@rarediseaseplanet.com. Never use a personal address.
8. No affiliate links, no ranking by payment. Neutral wording about every lab and kit.
9. Keep generated data small (sharded JSON). Delete raw GTR downloads after building.
10. Run `bun run test` and `bun run build` before pushing.
