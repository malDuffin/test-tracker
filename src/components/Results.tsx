import { useEffect, useMemo, useState } from "react";
import { t } from "@/i18n";
import type { Condition } from "@/lib/catalogue";
import { profileFor, KIND_LABEL, type Profile } from "@/lib/rules";
import { classifyVariant } from "@/lib/variant";
import { abilitiesFromGtr, judgeCoverage, type CoverageResult, F_DELDUP, F_SEQ, F_REPEAT, F_METH, F_CYTO, F_TARGETED, F_SEQ_PART } from "@/lib/coverage";
import { loadGtrGene, loadGtrSpecial, gtrTestUrl, type GtrGene, type GtrMeta, type GtrSpecial } from "@/lib/gtr";
import { applySubtype, subtypeOption, subtypeSetFor, type SubtypeChoice } from "@/data/subtypes";
import type { VariantKind, Verdict } from "@/lib/types";
import { OFFERS, labById, servesCountry, type Lab, type Offer } from "@/data/labs";
import { matchProgrammes, SPONSOR_DATA_NOTE, SPONSOR_DATA_SOURCE } from "@/data/programmes";
import { routesFor } from "@/data/publicRoutes";
import { KITS, kitLine } from "@/data/consumer";
import { SYMPTOMS } from "@/data/symptoms";
import { countryName, formatDate } from "@/lib/format";
import { Card, Checked, Field, PriceList, Section, SourceLink, VerdictBadge } from "./ui";
import type { Doctor } from "./Form";

const ORDER: Record<Verdict, number> = { yes: 0, partly: 1, unknown: 2, no: 3 };

function CoverageNotes({ cov, knownVariant }: { cov: CoverageResult; knownVariant: boolean }) {
  return (
    <div className="mt-2 text-sm">
      <p>{t(cov.reason)}</p>
      {knownVariant && (cov.verdict === "no" || cov.verdict === "partly") && <p className="font-semibold text-no">{t("May miss this change.")}</p>}
      {cov.found.length > 0 && <p>✓ {t("Looks for:")} {cov.found.map((k) => t(KIND_LABEL[k])).join("; ")}</p>}
      {cov.missing.length > 0 && <p>✕ {t("Cannot find:")} {cov.missing.map((k) => t(KIND_LABEL[k])).join("; ")}</p>}
      {cov.unclear.length > 0 && <p>? {t("Not clear, ask the lab:")} {cov.unclear.map((k) => t(KIND_LABEL[k])).join("; ")}</p>}
    </div>
  );
}

function DoctorLine({ lab, country }: { lab: Lab; country: string | null }) {
  if (lab.doctor === "self") return <Field label={t("Doctor needed")}>{t("No, you can book yourself")}</Field>;
  if (lab.doctor === "clinic") return <Field label={t("Doctor needed")}>{t("No, the clinic's own doctor orders it")}</Field>;
  return (
    <Field label={t("Doctor needed")}>
      {t("Yes, a doctor or genetic counsellor must order it.")}{" "}
      {country === "US" ? t("No doctor? Genome Medical can order after a video visit.") : country === "GB" ? t("No doctor? UK private clinics that accept self-referral can order.") : t("No doctor? Ask a genetics clinic or a doctor where you live.")}
    </Field>
  );
}

function OfferCard({ offer, cov, knownVariant, country }: { offer: Offer; cov: CoverageResult | null; knownVariant: boolean; country: string | null }) {
  const lab = labById(offer.labId)!;
  const serves = servesCountry(lab, country);
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{lab.name}</h3>
          <p className="text-[15px]">{offer.name}</p>
        </div>
        {cov && <VerdictBadge verdict={cov.verdict} />}
      </div>
      {serves === false && <p className="mt-2 rounded bg-partly/20 px-2 py-1 text-sm">{t("Only for people in: {{where}}", { where: lab.countries.text })}</p>}
      {cov && <CoverageNotes cov={cov} knownVariant={knownVariant} />}
      {offer.abilityNotes?.map((n, i) => <p key={i} className="mt-1 text-sm text-muted-foreground">{n}</p>)}
      <div className="mt-3"><PriceList prices={offer.prices} /></div>
      <dl className="mt-3 space-y-1">
        <DoctorLine lab={lab} country={country} />
        {offer.turnaround && <Field label={t("Time to results")}>{offer.turnaround}</Field>}
        {lab.samples && <Field label={t("Sample")}>{lab.samples}</Field>}
        <Field label={t("Raw data")}>{offer.rawData ?? lab.rawData ?? t("Not stated")}</Field>
        <Field label={t("Counselling")}>{lab.counselling ?? t("Not stated")}</Field>
        <Field label={t("Countries")}>{lab.countries.text}</Field>
        {lab.notes?.map((n, i) => <p key={i} className="text-sm text-muted-foreground">{n}</p>)}
      </dl>
      <p className="mt-3"><a className="font-semibold text-primary underline" href={offer.url} target="_blank" rel="noopener noreferrer">{t("Open the lab's page")}<span className="sr-only"> ({lab.name})</span></a></p>
    </Card>
  );
}

function methodsText(flags: number): string[] {
  const out: string[] = [];
  if (flags & F_SEQ) out.push(t("reads the whole gene"));
  else if (flags & F_SEQ_PART) out.push(t("reads some exons"));
  if (flags & F_TARGETED) out.push(t("checks known changes"));
  if (flags & F_DELDUP) out.push(t("missing or extra exons"));
  if (flags & F_REPEAT) out.push(t("repeat sizing"));
  if (flags & F_METH) out.push(t("methylation"));
  if (flags & F_CYTO) out.push(t("chromosome test"));
  return out;
}

function GeneTests({ gene, data, meta, profile, known, country, needed }: { gene: string; data: GtrGene; meta: GtrMeta; profile: Profile; known: VariantKind | null; country: string | null; needed: VariantKind[] }) {
  const [all, setAll] = useState(false);
  const rows = useMemo(() => {
    return data.t
      .map((test) => {
        const [acc, li, name, flags, geneCount, touched] = test;
        const [labName, labCountry, curatedId] = meta.labs[li];
        const cov = judgeCoverage(abilitiesFromGtr(flags, geneCount, gene), true, needed);
        return { acc, labName, labCountry, curated: curatedId ? labById(curatedId) ?? null : null, name, flags, geneCount, touched, cov };
      })
      // Focused tests (50 genes or fewer) first: that is what most families look for here.
      .sort((a, b) => ORDER[a.cov.verdict] - ORDER[b.cov.verdict] || Number(a.geneCount > 50) - Number(b.geneCount > 50) || Number(!a.curated) - Number(!b.curated) || b.touched.localeCompare(a.touched));
  }, [data, meta, gene, needed]);
  const shown = all ? rows : rows.slice(0, 8);
  return (
    <>
      <p className="text-sm">
        {t("The NIH Genetic Testing Registry lists {{tests}} tests from {{labs}} labs that include {{gene}}. Labs are in: {{countries}}.", { tests: data.n, labs: data.l, gene, countries: data.c.slice(0, 12).join(", ") + (data.c.length > 12 ? " …" : "") })}{" "}
        {t("We show the best match from each lab. The registry has no prices, and labs update it at different times.")}
      </p>
      {shown.map((r) => (
        <Card key={r.acc}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{r.labName}</h3>
              <p className="text-[15px]">{r.name}</p>
              <p className="text-sm text-muted-foreground">
                {r.labCountry} · {r.geneCount === 1 ? t("single gene test") : r.geneCount >= 1000 ? t("very large panel of {{n}} genes (close to an exome)", { n: r.geneCount }) : t("panel of {{n}} genes", { n: r.geneCount })} · {methodsText(r.flags).join(", ")}
              </p>
            </div>
            <VerdictBadge verdict={r.cov.verdict} />
          </div>
          <CoverageNotes cov={r.cov} knownVariant={!!known && known !== "unknown"} />
          {r.curated ? (
            <div className="mt-3 space-y-2">
              {r.curated.panelPrices && <PriceList prices={r.curated.panelPrices} />}
              {!r.curated.panelPrices && <p className="text-sm">{t("Price on request")}</p>}
              <dl className="space-y-1">
                <DoctorLine lab={r.curated} country={country} />
                <Field label={t("Countries")}>{r.curated.countries.text}</Field>
                {r.curated.samples && <Field label={t("Sample")}>{r.curated.samples}</Field>}
              </dl>
            </div>
          ) : (
            <p className="mt-2 text-sm">{t("Price on request. A doctor usually needs to order it. Ask the lab.")}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Registry entry last updated by the lab: {{date}}", { date: formatDate(r.touched) })} ·{" "}
            <a className="underline" href={gtrTestUrl(r.acc)} target="_blank" rel="noopener noreferrer">{t("Open in the Genetic Testing Registry")}<span className="sr-only"> ({r.labName})</span></a>
          </p>
        </Card>
      ))}
      {rows.length > 8 && (
        <button type="button" className="rounded-md border border-border bg-white px-4 py-2 font-medium" onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? t("Show fewer") : t("Show all {{n}} labs", { n: rows.length })}
        </button>
      )}
    </>
  );
}

function SpecialTests({ group, meta, country }: { group: GtrSpecial; meta: GtrMeta; country: string | null }) {
  return (
    <>
      <p className="text-sm">{t("These labs list this special test in the NIH Genetic Testing Registry. The registry has no prices, and labs update it at different times.")}</p>
      {group.t.map(([acc, li, name, methods, touched]) => {
        const [labName, labCountry] = meta.labs[li];
        return (
          <Card key={acc}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{labName}</h3>
                <p className="text-[15px]">{name}</p>
                <p className="text-sm text-muted-foreground">{labCountry} · {methods}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-yes px-3 py-1 text-sm font-semibold text-white">✓ {t(group.badge)}</span>
            </div>
            {country && <p className="mt-2 text-sm">{t("Ask whether they accept samples from {{country}}.", { country: countryName(country) })}</p>}
            <p className="mt-2 text-sm">{t("Price on request. A doctor usually needs to order it. Ask the lab.")}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("Registry entry last updated by the lab: {{date}}", { date: formatDate(touched) })} ·{" "}
              <a className="underline" href={gtrTestUrl(acc)} target="_blank" rel="noopener noreferrer">{t("Open in the Genetic Testing Registry")}<span className="sr-only"> ({labName})</span></a>
            </p>
          </Card>
        );
      })}
    </>
  );
}

export function Results({ condition, gene, variantText, choice, symptoms, country, nation, doctor, meta, undiagnosed }: {
  condition: Condition | null; gene: string | null; variantText: string; choice?: SubtypeChoice | null; symptoms: string[]; country: string | null; nation: string | null; doctor: Doctor | null; meta: GtrMeta | null; undiagnosed: boolean;
}) {
  const subSet = useMemo(() => (undiagnosed ? null : subtypeSetFor(condition)), [condition, undiagnosed]);
  const subOpt = useMemo(() => subtypeOption(subSet, choice?.id ?? null), [subSet, choice?.id]);
  const profile = useMemo(() => applySubtype(profileFor(undiagnosed ? null : condition), subOpt, choice, subSet), [condition, undiagnosed, subOpt, choice, subSet]);
  const choiceText = subSet && subOpt && choice && subSet.display ? subSet.display(choice, subOpt) : null;
  const [special, setSpecial] = useState<GtrSpecial | null>(null);
  useEffect(() => {
    setSpecial(null);
    if (!profile.specialTests) return;
    let cancelled = false;
    loadGtrSpecial().then((all) => { if (!cancelled) setSpecial(all[profile.specialTests!] ?? null); });
    return () => { cancelled = true; };
  }, [profile.specialTests]);
  const variant = useMemo(() => classifyVariant(undiagnosed ? "" : variantText), [variantText, undiagnosed]);
  const known = variant.kind !== "unknown" ? variant.kind : null;
  const needed: VariantKind[] = useMemo(() => (known ? [known] : profile.needed), [known, profile]);
  const genes = undiagnosed ? [] : profile.genes ?? condition?.genes ?? (gene ? [gene] : []);
  const mainGene = gene && genes.includes(gene) ? gene : genes[0] ?? null;
  const [gtr, setGtr] = useState<GtrGene | null>(null);
  const [gtrGene, setGtrGene] = useState<string | null>(null);
  const [gtrLoading, setGtrLoading] = useState(false);
  const [pickedGene, setPickedGene] = useState<string | null>(null);
  const activeGene = pickedGene && genes.includes(pickedGene) ? pickedGene : mainGene;

  useEffect(() => {
    setGtr(null);
    setGtrGene(null);
    if (!activeGene || profile.category === "nongene") return;
    let cancelled = false;
    setGtrLoading(true);
    loadGtrGene(activeGene).then((d) => {
      if (cancelled) return;
      setGtr(d);
      setGtrGene(activeGene);
      setGtrLoading(false);
    }).catch(() => !cancelled && setGtrLoading(false));
    return () => { cancelled = true; };
  }, [activeGene, profile.category]);

  if (!undiagnosed && !condition && !gene) return null;
  const nameForMatch = undiagnosed ? null : condition?.label ?? null;
  const programmes = matchProgrammes({ genes, name: nameForMatch, symptoms: undiagnosed ? symptoms : [], country });
  const routes = routesFor(country, nation);
  const geneIncludedForBroad = (o: Offer): boolean | null => {
    if (undiagnosed) return true;
    // Exomes, genomes and microarrays look across (almost) all genes; panels depend on the condition.
    return o.type === "exome" || o.type === "genome" || o.type === "cma" ? true : null;
  };
  const broad = OFFERS.filter((o) => o.type !== "visit")
    .filter((o) => (profile.category === "region" || undiagnosed || o.type !== "cma"))
    .map((o) => ({ o, cov: profile.category === "nongene" ? null : judgeCoverage(o.abilities, geneIncludedForBroad(o), needed), serves: servesCountry(labById(o.labId)!, country) }))
    .sort((a, b) => Number(a.serves === false) - Number(b.serves === false) || ORDER[a.cov?.verdict ?? "unknown"] - ORDER[b.cov?.verdict ?? "unknown"]);
  const ordering = OFFERS.filter((o) => o.type === "visit");
  const showOrdering = doctor === "no" || doctor === "unsure";

  return (
    <div aria-live="polite">
      {/* Summary */}
      <Card className="mt-6">
        {undiagnosed ? (
          <>
            <h2 className="font-serif text-2xl font-semibold">{t("No diagnosis yet")}</h2>
            {symptoms.length > 0 ? (
              <>
                <p className="mt-1">{t("Based on what you picked, tests to ask about:")}</p>
                <ul className="mt-1 list-disc ps-6">
                  {SYMPTOMS.filter((s) => symptoms.includes(s.id)).map((s) => <li key={s.id}><strong>{t(s.label)}:</strong> {t(s.panel)}</li>)}
                </ul>
              </>
            ) : <p className="mt-1">{t("Pick the areas that are affected to see matching tests and free programmes.")}</p>}
          </>
        ) : (
          <>
            <h2 className="font-serif text-2xl font-semibold">{condition?.label ?? gene}</h2>
            {genes.length > 0 && <p className="mt-1">{t("Gene(s):")} <strong>{genes.slice(0, 12).join(", ")}{genes.length > 12 ? " …" : ""}</strong></p>}
            {!condition && gene && <p className="mt-1 text-sm">{t("This gene is not in our condition list yet, so we show general advice.")}</p>}
            {variantText.trim() && (
              <p className="mt-2 rounded bg-accent px-3 py-2">
                {known ? t("We read your change as {{kind}}. Tests that cannot find this kind of change are marked 'May miss this change'.", { kind: t(KIND_LABEL[variant.kind]) }) : t("We could not work out what kind of change this is, so we show tests for the usual kinds of change for this condition.")}
                {variant.hints.includes("deep_intronic") && <> {t("It looks like a change deep inside the gene. Exomes and many panels miss these. Genomes or RNA tests do better.")}</>}
              </p>
            )}
            {choiceText && choice?.id !== "unknown" && <p className="mt-2 rounded bg-accent px-3 py-2"><span className="font-medium">{t("You picked:")}</span> <span dir="auto">{choiceText}</span></p>}
            {profile.notes.map((n, i) => <p key={i} className="mt-2 text-sm">{t(n.text, n.vars)}</p>)}
          </>
        )}
      </Card>

      {/* Free routes first */}
      <Section id="free" title={t("Free routes to check first")}>
        {routes.length > 0 ? routes.map((r) => (
          <Card key={r.id} tone="free">
            <h3 className="text-lg font-semibold">{r.name}</h3>
            <ul className="mt-1 list-disc ps-6 text-[15px]">{r.how.map((h, i) => <li key={i}>{t(h)}</li>)}</ul>
            {r.caution && <p className="mt-1 text-sm">{t(r.caution)}</p>}
            <div className="mt-2 flex flex-col gap-0.5">{r.sources.map((s) => <Checked key={s.url} source={s} />)}</div>
          </Card>
        )) : (
          <Card tone="free">
            <h3 className="text-lg font-semibold">{country ? t("Your public health service in {{country}}", { country: countryName(country) }) : t("Your public health service")}</h3>
            <p className="mt-1">{t("Ask your doctor if a free test is possible through your health service or a genetics clinic. Many countries offer testing for rare conditions.")}</p>
            {country === "US" && <p className="mt-1">{t("In the US, health insurance or Medicaid may pay for testing. Ask your doctor, and check the free programmes below.")}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{t("We have not checked the public route for this country yet.")}</p>
          </Card>
        )}
        {programmes.length > 0 && (
          <Card tone="free">
            <h3 className="text-lg font-semibold">{t("Free sponsored testing programmes")}</h3>
            <p className="mt-1 text-sm"><strong>{t(SPONSOR_DATA_NOTE)}</strong> <SourceLink source={SPONSOR_DATA_SOURCE}>{t("Source")}</SourceLink></p>
            <ul className="mt-3 space-y-4">
              {programmes.map(({ programme: p, inCountry }) => (
                <li key={p.id} className="border-t border-border pt-3">
                  <h4 className="font-semibold">{p.name}</h4>
                  {inCountry === false && <p className="rounded bg-partly/20 px-2 py-1 text-sm">{t("Not open in your country. Only for people in: {{where}}", { where: p.countriesText })}</p>}
                  {inCountry === null && <p className="text-sm text-muted-foreground">{t("Where:")} {p.countriesText}</p>}
                  <dl className="mt-1 space-y-1">
                    <Field label={t("For")}>{p.forWho}</Field>
                    <Field label={t("Who can get it")}>{p.eligibility}</Field>
                    <Field label={t("Cost")}>{p.cost}</Field>
                    <Field label={t("Doctor needed")}>{p.doctor}</Field>
                    {p.covers && <Field label={t("What it tests")}>{p.covers}</Field>}
                    {p.sponsors && <Field label={t("Paid for by")}>{p.sponsors}</Field>}
                    {p.caution && <p className="text-sm font-medium">{p.caution}</p>}
                  </dl>
                  <Checked source={p.source} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>

      {/* Testing order */}
      {!known && (
        <Section id="order" title={undiagnosed ? t("A sensible way to start") : t("Which test first?")} intro={t("General rules for this kind of condition. A genetic counsellor can tell you what fits your family.")}>
          <Card>
            <ol className="list-decimal space-y-2 ps-6">
              {profile.steps.map((s, i) => (
                <li key={i}><strong>{t(s.title, s.vars)}</strong><br /><span className="text-[15px]">{t(s.why, s.vars)}</span></li>
              ))}
            </ol>
            {profile.sources.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">{t("Sources:")} {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && " · "}<SourceLink source={s} /></span>)}</p>
            )}
          </Card>
        </Section>
      )}

      {/* Special tests (for example D4Z4 sizing for FSHD1) */}
      {profile.specialTests && (
        <Section id="special" title={t("Special tests for this condition")} intro={special ? t(special.label) : undefined}>
          {special && meta ? <SpecialTests group={subOpt?.specialMethods ? { ...special, t: special.t.filter((r) => subOpt.specialMethods!.test(r[3])) } : special} meta={meta} country={country} /> : <p role="status">{t("Loading tests…")}</p>}
        </Section>
      )}

      {/* Gene-specific tests from GTR */}
      {!undiagnosed && profile.category !== "nongene" && genes.length > 0 && (
        <Section id="gene" title={t("Tests that look at this gene")} intro={t("Single gene tests and panels. Coverage is judged by the gene and by the kind of change.")}>
          {genes.length > 1 && (
            <div>
              <label htmlFor="gene-pick" className="font-medium">{t("Show tests for gene:")}</label>{" "}
              <select id="gene-pick" className="rounded-md border border-border bg-white px-2 py-1.5" value={activeGene ?? ""} onChange={(e) => setPickedGene(e.target.value)}>
                {genes.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}
          {gtrLoading && <p role="status">{t("Loading tests…")}</p>}
          {!gtrLoading && gtr && meta && gtrGene && <GeneTests gene={gtrGene} data={gtr} meta={meta} profile={profile} known={known} country={country} needed={needed} />}
          {!gtrLoading && !gtr && activeGene && <Card><p>{t("We found no tests for {{gene}} in the Genetic Testing Registry. Broad tests below may still include it. Ask the lab.", { gene: activeGene })}</p></Card>}
        </Section>
      )}

      {/* Broad tests */}
      {profile.category !== "nongene" && (
        <Section id="broad" title={profile.category === "region" ? t("Microarray, exome and genome tests") : t("Broad tests: exome and genome")} intro={t("These read most genes at once. Exomes read the parts of genes that make proteins. Genomes read almost everything.")}>
          {broad.map(({ o, cov }) => <OfferCard key={o.id} offer={o} cov={undiagnosed ? null : cov} knownVariant={!!known} country={country} />)}
        </Section>
      )}

      {/* Getting a test ordered */}
      {(showOrdering || undiagnosed) && (
        <Section id="order-help" title={t("No doctor? Ways to get a test ordered")}>
          {ordering.map((o) => {
            const lab = labById(o.labId)!;
            return (
              <Card key={o.id}>
                <h3 className="text-lg font-semibold">{lab.name}</h3>
                <p>{o.name}</p>
                <p className="mt-1 text-sm">{lab.doctorNote}</p>
                {servesCountry(lab, country) === false && <p className="mt-1 rounded bg-partly/20 px-2 py-1 text-sm">{t("Only for people in: {{where}}", { where: lab.countries.text })}</p>}
                <div className="mt-2"><PriceList prices={o.prices} /></div>
              </Card>
            );
          })}
          <Card>
            <p>{t("Northway Clinic in London also accepts people without a GP referral.")}</p>
            <p className="mt-1">{t("Probably Genetic (see free programmes) uses its own clinicians, so you do not need your own doctor.")}</p>
            <p className="mt-1">{t("Some international labs (Blueprint Genetics, CENTOGENE, CeGaT) accept orders from doctors in many countries. A local doctor can order and you pay the lab.")}</p>
          </Card>
        </Section>
      )}

      {/* Consumer kits */}
      <section aria-labelledby="kits-h" className="mt-8">
        <details className="rounded-lg border-2 border-dashed border-partly bg-card p-4">
          <summary className="cursor-pointer">
            <span id="kits-h" className="font-serif text-xl font-semibold">{t("Consumer DNA kits: not a diagnosis")}</span>
            <span className="block text-sm text-muted-foreground">{t("Useful as a clue, never to rule a condition out. Tap to open.")}</span>
          </summary>
          <p className="mt-3">{t("Ancestry and wellness DNA kits are not designed to find the cause of a rare disease. A clear result does not mean someone does not have a genetic condition.")}</p>
          <p className="mt-1">{t("Chip tests (like 23andMe and AncestryDNA) read only a set list of spots and miss most rare disease changes, including missing or extra exons. Consumer genomes give you raw data, but no doctor interprets it, and they can miss missing or extra pieces and repeats.")}</p>
          <ul className="mt-3 space-y-3">
            {KITS.map((k) => {
              const line = kitLine(k, undiagnosed ? profile.needed : needed, known);
              return (
                <li key={k.id} className="rounded-md border border-border bg-white p-3">
                  <h3 className="font-semibold">{k.name} <span className="text-sm font-normal text-muted-foreground">({k.kind === "chip" ? t("chip test") : t("consumer genome")})</span></h3>
                  <p className="mt-1 text-sm font-medium">{t(line.text, line.parts ? { what: line.parts.map((p) => t(p)).join(", ") } : undefined)}</p>
                  {k.lowDepth && <p className="mt-1 text-sm">{k.lowDepth}</p>}
                  {k.claims && <p className="mt-1 text-sm text-muted-foreground">{k.claims}</p>}
                  {k.rawData && <p className="mt-1 text-sm">{t("Raw data")}: {k.rawData}</p>}
                  {k.countries && <p className="text-sm">{t("Countries")}: {k.countries}</p>}
                  {k.prices.length > 0 && <div className="mt-2"><PriceList prices={k.prices} /></div>}
                  {k.sources[0] && <div className="mt-1"><Checked source={k.sources[0]} /></div>}
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      {/* Questions and next steps */}
      <Section id="ask" title={t("Questions to ask the lab")}>
        <Card>
          <ul className="list-disc space-y-1 ps-6">
            <li>{genes[0] ? t("Does this test include {{gene}}?", { gene: activeGene ?? genes[0] }) : t("Which genes does this test include?")}</li>
            <li>{t("Does it find missing or extra exons? Repeats? Mitochondrial DNA?")}</li>
            <li>{t("What is the total price, including the report and any doctor's fee? Can I have it in writing?")}</li>
            <li>{t("Who needs to order it, and can you help me find someone?")}</li>
            <li>{t("Will I get counselling about the result? Can I get my raw data?")}</li>
            <li>{t("Will you check the result again later if there is no answer now?")}</li>
          </ul>
        </Card>
      </Section>
      <Section id="next" title={t("Next steps")}>
        <Card>
          <ul className="list-disc space-y-1 ps-6">
            <li>{t("Talk to a genetic counsellor or doctor before you pay for a test.")}</li>
            <li><a className="underline" href="https://rarediseaseplanet.com" target="_blank" rel="noopener noreferrer">{t("Find other families on Rare Disease Planet")}</a></li>
            {activeGene && <li><a className="underline" href={`https://exoneditor.com/?gene=${encodeURIComponent(activeGene)}`} target="_blank" rel="noopener noreferrer">{t("See {{gene}} in Variant Visual", { gene: activeGene })}</a></li>}
            {condition && !undiagnosed && <li><a className="underline" href={`https://rarediseasebody.com/?disease=${encodeURIComponent(condition.label)}`} target="_blank" rel="noopener noreferrer">{t("See how it can affect the body in Rare Disease Body")}</a></li>}
          </ul>
        </Card>
      </Section>
    </div>
  );
}

