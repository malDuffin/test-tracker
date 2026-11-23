import { useId, useMemo, useState } from "react";
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
