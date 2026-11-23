import { useEffect, useMemo, useState } from "react";
import { LANGUAGES, getLanguage, initialLanguage, setLanguage, t, useLang } from "@/i18n";
import { parseParams } from "@/lib/params";
import { loadCatalogue, type Catalogue, type Condition } from "@/lib/catalogue";
import { loadGtrMeta, type GtrMeta } from "@/lib/gtr";
import { ConditionSearch, CountryPicker, DoctorPicker, SubtypePicker, SymptomPicker, VariantInput, type Doctor } from "@/components/Form";
import { choiceFromParams, subtypeSetFor, type SubtypeChoice } from "@/data/subtypes";
import { Results } from "@/components/Results";
import { formatDate } from "@/lib/format";
import { CHECKED, UDNF } from "@/data/labs";

// Read once. Nothing passed in is stored anywhere (no localStorage, cookies or analytics).
const params = parseParams(typeof window !== "undefined" ? window.location.search : "");

export default function App() {
  const lang = useLang();
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [meta, setMeta] = useState<GtrMeta | null>(null);
  const [mode, setMode] = useState<"known" | "undiagnosed">(params.undiagnosed ? "undiagnosed" : "known");
  const [condition, setCondition] = useState<Condition | null>(null);
  const [gene, setGene] = useState<string | null>(params.gene);
  const [unmatchedName, setUnmatchedName] = useState<string | null>(null);
  const [variant, setVariant] = useState(params.variant ?? "");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [country, setCountry] = useState<string | null>(params.country);
  const [nation, setNation] = useState<string | null>(params.nation);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [subtype, setSubtype] = useState<SubtypeChoice>({ id: "unknown" });
  const subtypeSet = useMemo(() => (mode === "known" ? subtypeSetFor(condition) : null), [condition, mode]);
  const choice: SubtypeChoice | null = subtypeSet ? (subtypeSet.options.some((o) => o.id === subtype.id) ? subtype : { id: subtypeSet.options[0].id }) : null;

  useEffect(() => {
    setLanguage(initialLanguage(params.lang));
    loadCatalogue().then((c) => {
      setCatalogue(c);
      if (params.name || params.gene) {
        const hit = c.resolve(params.name, params.gene);
        if (hit) {
          setCondition(hit);
          setSubtype(choiceFromParams(subtypeSetFor(hit), params.subtype, params.variant, params.d4z4Ru) ?? { id: "unknown" });
        }
        else if (params.name) setUnmatchedName(params.name);
      }
    });
    loadGtrMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  const pickCondition = (c: Condition | null) => {
    setCondition(c);
    setUnmatchedName(null);
    setSubtype({ id: "unknown" });
    setGene(c ? (gene && c.genes.includes(gene) ? gene : c.genes[0] ?? null) : null);
  };

  const showResults = mode === "undiagnosed" ? true : !!(condition || (gene && catalogue));
  const machine = lang !== "en";
  const langLabel = useMemo(() => LANGUAGES.find((l) => l.code === lang)?.english ?? lang, [lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">{t("Skip to main content")}</a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Part of Rare Disease Planet")}</p>
            <h1 className="font-serif text-3xl font-bold leading-tight">Test Tracker</h1>
          </div>
          <div>
            <label htmlFor="lang" className="sr-only">{t("Language")}</label>
            <select id="lang" className="rounded-md border border-border bg-white px-2 py-1.5 text-sm" value={lang} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4 pb-16">
        {machine && (
          <p className="mt-3 rounded-md border border-border bg-accent px-3 py-2 text-sm" role="note">
            {t("This page was translated by a computer and may have mistakes. Lab and programme details are in English.")} <span className="sr-only">({langLabel})</span>
          </p>
        )}
        <p className="mt-5 text-lg">{t("Find a genetic test that looks for your condition. See what it costs, whether you need a doctor, and what it might miss.")}</p>

        <div className="mt-4 rounded-lg border-2 border-primary/30 bg-card p-4" role="note" aria-label={t("Important")}>
          <p className="font-semibold">{t("This is general information, not medical advice.")}</p>
          <ul className="mt-1 list-disc ps-6 text-[15px]">
            <li>{t("A genetic counsellor or doctor can help you choose the right test.")}</li>
            <li>{t("We are not paid by any lab or programme. There are no affiliate links and no sponsors.")}</li>
            <li>{t("Prices change often. Always get a written quote from the lab before you pay.")}</li>
          </ul>
        </div>

        <form className="mt-6 space-y-5 rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={(e) => e.preventDefault()} aria-label={t("Tell us about the test you need")}>
          <fieldset>
            <legend className="font-medium">{t("What are you looking for?")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["known", "I know the condition or gene"], ["undiagnosed", "No diagnosis yet"]] as const).map(([v, l]) => (
                <label key={v} className={`cursor-pointer rounded-md border px-4 py-2 ${mode === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"}`}>
                  <input type="radio" name="mode" className="sr-only" checked={mode === v} onChange={() => setMode(v)} />
                  {t(l)}
                </label>
              ))}
            </div>
          </fieldset>

          {mode === "known" ? (
            <>
              {unmatchedName && <p className="rounded bg-partly/20 px-3 py-2 text-sm" role="status">{t("We could not find '{{name}}' in our list. Try searching below.", { name: unmatchedName })}</p>}
              <ConditionSearch key={condition?.label ?? unmatchedName ?? "empty"} catalogue={catalogue} value={condition} onPick={pickCondition} initialText={condition?.label ?? unmatchedName ?? undefined} />
              {subtypeSet && choice ? <SubtypePicker set={subtypeSet} value={choice} onChange={setSubtype} /> : <VariantInput value={variant} onChange={setVariant} />}
            </>
          ) : (
            <SymptomPicker value={symptoms} onChange={setSymptoms} />
          )}
          <CountryPicker country={country} nation={nation} onCountry={(c) => { setCountry(c); if (c !== "GB") setNation(null); }} onNation={setNation} />
          <DoctorPicker value={doctor} onChange={setDoctor} />
        </form>

        {showResults && (
          <Results condition={mode === "known" ? condition : null} gene={mode === "known" ? gene : null} variantText={subtypeSet ? "" : variant} choice={choice} symptoms={symptoms} country={country} nation={nation} doctor={doctor} meta={meta} undiagnosed={mode === "undiagnosed"} />
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-6 text-sm">
          <p className="font-semibold">{t("About this information")}</p>
          <p>{t("This is general information, not medical advice. A genetic counsellor or doctor can help you choose the right test.")}</p>
          <p>{t("We are not paid by any lab or programme. We do not earn money if you choose a test. Labs cannot pay to be listed or ranked.")}</p>
          <p>{t("A test that includes a gene can still miss some kinds of changes. Check the notes on each card.")}</p>
          <p>{t("Test lists come from the NIH Genetic Testing Registry (GTR), a public domain source. NIH does not check lab entries or endorse labs.")}{" "}
            <a className="underline" href="https://www.ncbi.nlm.nih.gov/gtr/" target="_blank" rel="noopener noreferrer">ncbi.nlm.nih.gov/gtr</a>
            {meta?.gtrFileDate && <> · {t("GTR data from {{date}}", { date: formatDate(meta.gtrFileDate) })}</>}
          </p>
          <p>{t("Some prices come from the UDNF Clinical Genetic Testing Lab Comparison Guide (25 Mar 2026). They are marked on each card.")}{" "}
            <a className="underline" href={UDNF.url} target="_blank" rel="noopener noreferrer">udnf.org</a>
          </p>
          <p>{t("Prices and programmes last checked {{date}}.", { date: formatDate(CHECKED) })}</p>
          <p>{t("No accounts and no tracking. Nothing you type is saved.")}</p>
          <p>{t("Spotted a wrong price or link? Contact us:")} <a className="underline" href="mailto:team@rarediseaseplanet.com?subject=Test%20Tracker">team@rarediseaseplanet.com</a></p>
          <p className="text-muted-foreground">{getLanguage() !== "en" ? t("Translations are machine translated and not medically reviewed.") : null}</p>
        </div>
      </footer>
    </div>
  );
}
