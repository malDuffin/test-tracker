import { useId, useMemo, useState } from "react";
import { unitsFromEcoRIkb, type SubtypeChoice, type SubtypeSet } from "@/data/subtypes";
import { t, useLang } from "@/i18n";
import type { Catalogue, Condition } from "@/lib/catalogue";
import { COUNTRY_CODES } from "@/data/countries";
import { SYMPTOMS } from "@/data/symptoms";
import { countryName } from "@/lib/format";

export type Doctor = "yes" | "no" | "unsure";

export function ConditionSearch({ catalogue, value, onPick, initialText }: { catalogue: Catalogue | null; value: Condition | null; onPick: (c: Condition | null) => void; initialText?: string }) {
  const [q, setQ] = useState(initialText ?? value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const results = useMemo(() => (catalogue && q && q !== value?.label ? catalogue.search(q) : []), [catalogue, q, value]);
  const pick = (c: Condition) => {
    onPick(c);
    setQ(c.label);
    setOpen(false);
  };
  return (
    <div className="relative">
      <label htmlFor={`${id}-in`} className="block font-medium">{t("Condition or gene")}</label>
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">{t("For example Duchenne, Angelman syndrome or KDM5B")}</p>
      <input
        id={`${id}-in`}
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-describedby={`${id}-hint`}
        aria-activedescendant={open && results[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base"
        value={q}
        placeholder={catalogue ? t("Start typing a name") : t("Loading conditions…")}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
          if (value && e.target.value !== value.label) onPick(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); setOpen(true); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open) { e.preventDefault(); pick(results[active].c); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-white shadow-lg">
          {results.map((r, i) => (
            <li
              id={`${id}-opt-${i}`}
              key={r.c.label}
              role="option"
              aria-selected={i === active}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-accent" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); pick(r.c); }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="font-medium">{r.c.label}</span>
              {r.c.genes.length > 0 && <span className="ml-2 text-sm text-muted-foreground">{r.c.genes.slice(0, 4).join(", ")}{r.c.genes.length > 4 ? " …" : ""}</span>}
            </li>
          ))}
        </ul>
      )}
      {catalogue && q.length >= 2 && !value && results.length === 0 && (
        <p className="mt-1 text-sm" role="status">{t("We could not find that name. Try another spelling, the gene name, or choose 'No diagnosis yet'.")}</p>
      )}
    </div>
  );
}

export function VariantInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block font-medium">{t("The exact change, if you know it (optional)")}</label>
      <p id={`${id}-h`} className="text-sm text-muted-foreground">{t("Copy it from a report, for example c.1234A>G, deletion of exons 45 to 50, or CGG repeat. It is not saved.")}</p>
      <input id={id} aria-describedby={`${id}-h`} type="text" autoComplete="off" className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function SubtypePicker({ set, value, onChange }: { set: SubtypeSet; value: SubtypeChoice; onChange: (c: SubtypeChoice) => void }) {
  const id = useId();
  const [kb, setKb] = useState("");
  const opt = set.options.find((o) => o.id === value.id) ?? set.options[0];
  const est = kb.trim() ? unitsFromEcoRIkb(Number(kb.replace(",", "."))) : null;
  return (
    <fieldset>
      <legend className="font-medium">{t(set.question)}</legend>
      <p id={`${id}-h`} className="text-sm text-muted-foreground">{t("Pick Unknown if you are not sure. The type changes which test you need.")}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-describedby={`${id}-h`}>
        {set.options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value.id === o.id} onClick={() => onChange({ ...value, id: o.id })}
            className={`rounded-md border px-3 py-2 text-start text-[15px] font-medium ${value.id === o.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"}`}>
            {t(o.label)}
          </button>
        ))}
      </div>
      {opt.helper && <p className="mt-2 rounded bg-accent px-3 py-2 text-sm">{t(opt.helper)}</p>}
      {opt.custom && (
        <div className="mt-2">
          <label htmlFor={`${id}-c`} className="block font-medium">{t("What does your report say?")}</label>
          <input id={`${id}-c`} type="text" autoComplete="off" maxLength={200} className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base"
            value={value.custom ?? ""} onChange={(e) => onChange({ ...value, custom: e.target.value })} />
          <p className="mt-1 text-sm text-muted-foreground">{t("We show it back as written, starting with 'Custom:'. It is not saved.")}</p>
          {(() => {
            const guess = value.custom && set.parseVariant ? set.parseVariant(value.custom) : null;
            const g = guess && guess.id !== "custom" && guess.id !== "unknown" ? set.options.find((o) => o.id === guess.id) : null;
            return g ? <p className="mt-1 text-sm">{t("This looks like: {{type}}.", { type: t(g.label) })}{" "}<button type="button" className="underline" onClick={() => onChange({ id: g.id, ru: guess!.ru ?? null, change: guess!.change ?? null })}>{t("Switch to this type")}</button></p> : null;
          })()}
        </div>
      )}
      {opt.repeats && (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-ru`} className="block font-medium">{t("Number of D4Z4 repeat units (optional)")}</label>
            <input id={`${id}-ru`} type="number" inputMode="numeric" min={1} max={150} className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base"
              value={value.ru ?? ""} onChange={(e) => { const n = parseInt(e.target.value, 10); onChange({ ...value, ru: Number.isFinite(n) && n >= 1 && n <= 150 ? n : null }); }} />
          </div>
          <div>
            <label htmlFor={`${id}-kb`} className="block font-medium">{t("Or: EcoRI size in kb from an older report")}</label>
            <input id={`${id}-kb`} type="text" inputMode="decimal" autoComplete="off" className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base" value={kb} onChange={(e) => setKb(e.target.value)} aria-describedby={`${id}-kbh`} />
            <p id={`${id}-kbh`} className="mt-1 text-sm" aria-live="polite">
              {est != null ? <>{t("Estimate: about {{n}} repeat units", { n: est })}{" "}<button type="button" className="underline" onClick={() => onChange({ ...value, ru: Math.round(est) })}>{t("Use this estimate")}</button></> : t("Estimate = (kb minus 5) divided by 3.3. This is only an estimate and does not fit every lab method (not EcoRI/BlnI). If your report gives repeat units, use that number.")}
            </p>
          </div>
        </div>
      )}
    </fieldset>
  );
}

export function SymptomPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="font-medium">{t("Which areas are affected? Pick any that fit.")}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {SYMPTOMS.map((s) => (
          <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-white p-2.5">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={value.includes(s.id)} onChange={(e) => onChange(e.target.checked ? [...value, s.id] : value.filter((x) => x !== s.id))} />
            <span>{t(s.label)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CountryPicker({ country, nation, onCountry, onNation }: { country: string | null; nation: string | null; onCountry: (c: string | null) => void; onNation: (n: string | null) => void }) {
  const lang = useLang();
  const id = useId();
  const options = useMemo(() => [...COUNTRY_CODES].map((c) => ({ c, n: countryName(c) })).sort((a, b) => a.n.localeCompare(b.n, lang)), [lang]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={id} className="block font-medium">{t("Where do you live?")}</label>
        <select id={id} className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base" value={country ?? ""} onChange={(e) => onCountry(e.target.value || null)}>
          <option value="">{t("Choose a country")}</option>
          {options.map((o) => <option key={o.c} value={o.c}>{o.n}</option>)}
        </select>
      </div>
      {country === "GB" && (
        <div>
          <label htmlFor={`${id}-n`} className="block font-medium">{t("Which part of the UK?")}</label>
          <select id={`${id}-n`} className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2.5 text-base" value={nation ?? ""} onChange={(e) => onNation(e.target.value || null)}>
            <option value="">{t("Show all")}</option>
            <option value="eng">{t("England")}</option>
            <option value="sct">{t("Scotland")}</option>
            <option value="wls">{t("Wales")}</option>
            <option value="nir">{t("Northern Ireland")}</option>
          </select>
        </div>
      )}
    </div>
  );
}

export function DoctorPicker({ value, onChange }: { value: Doctor | null; onChange: (v: Doctor) => void }) {
  const opts: Array<[Doctor, string]> = [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]];
  return (
    <fieldset>
      <legend className="font-medium">{t("Do you have a doctor or genetic counsellor who can order a test?")}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opts.map(([v, l]) => (
          <label key={v} className={`cursor-pointer rounded-md border px-4 py-2 ${value === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"}`}>
            <input type="radio" name="doctor" className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            {t(l)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
