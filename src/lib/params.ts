/**
 * URL parameters, so Rare Disease Planet (and the other suite apps) can open Test Tracker
 * with the person's condition already filled in. Nothing passed in is stored: values live in
 * memory for this page only (no localStorage, no cookies, no analytics).
 *
 *   ?name=<condition>  ?gene=<SYMBOL>  ?variant=<HGVS or plain words>  ?country=<ISO2>  ?lang=<code>
 *   ?nation=<eng|sct|wls|nir> (optional, UK only)   ?mode=undiagnosed
 *   ?subtype=<id> or ?fshd_type=<id> (for conditions with known types, for example fshd1 or fshd2-smchd1)
 *   ?d4z4_ru=<number> (FSHD: D4Z4 repeat units, same name as Variant Visual)
 */
export interface Params {
  name: string | null;
  gene: string | null;
  variant: string | null;
  country: string | null;
  nation: "eng" | "sct" | "wls" | "nir" | null;
  lang: string | null;
  undiagnosed: boolean;
  subtype: string | null;
  d4z4Ru: number | null;
}

// Strip control characters and cap length. React escapes all output, so ">" (needed in HGVS such as
// c.1234A>G) is kept. Names also lose angle brackets.
const clean = (v: string | null, max = 200, dropBrackets = false): string | null => {
  if (v == null) return null;
  let s = v.replace(/[\u0000-\u001f\u007f]/g, "");
  if (dropBrackets) s = s.replace(/[<>]/g, "");
  s = s.trim().slice(0, max);
  return s ? s : null;
};

export function parseParams(search: string): Params {
  const q = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = q.get(k);
      if (v != null && v.trim()) return v;
    }
    return null;
  };
  const gene = (get("gene", "g") ?? "").trim();
  const geneOk = gene && /^[A-Za-z0-9][A-Za-z0-9\-_.]{0,29}$/.test(gene) ? gene.toUpperCase() : null;
  const country = clean(get("country", "c"), 6);
  let cc = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null;
  if (cc === "UK") cc = "GB";
  const nationRaw = (clean(get("nation", "region"), 10) ?? "").toLowerCase().replace(/^gb-/, "");
  const nation = (["eng", "sct", "wls", "nir"] as const).find((n) => n === nationRaw) ?? null;
  const langRaw = clean(get("lang", "hl"), 20);
  const lang = langRaw && /^[A-Za-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/.test(langRaw) ? langRaw : null;
  const mode = (get("mode") ?? "").toLowerCase();
  return {
    name: clean(get("name", "disease", "condition"), 200, true),
    gene: geneOk,
    variant: clean(get("variant", "hgvs"), 200),
    country: cc,
    nation: cc === "GB" ? nation : null,
    lang,
    undiagnosed: mode === "undiagnosed" || mode === "symptoms",
    d4z4Ru: ((v) => (v && /^\d{1,3}$/.test(v) && +v >= 1 && +v <= 150 ? +v : null))(clean(get("d4z4_ru", "ru"), 5)),
    subtype: ((s) => (s && /^[a-z0-9][a-z0-9-]{0,39}$/.test(s) ? s : null))((clean(get("subtype", "fshd_type", "type"), 40) ?? "").toLowerCase()),
  };
}
