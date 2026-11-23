import { useSyncExternalStore } from "react";
import { isRtl, matchLanguage, normalizeLanguage } from "./languages";

export { LANGUAGES, matchLanguage, isRtl } from "./languages";

/**
 * Small i18n layer, the same pattern as Rare Disease Body.
 * - t("English text {{name}}", { name }): the English text is the key.
 * - Translations live in public/i18n/<code>.json, keyed by English text, fetched on demand.
 *   Missing keys fall back to English, so new text never shows a blank.
 * - All non-English files are machine translated (see public/i18n/_meta.json) and not medically reviewed.
 * - Language: ?lang= first, then the browser languages. The choice is not stored.
 * - Lab names, test names, gene symbols and lab notes stay in English.
 */
type Dict = Record<string, string>;
let lang = "en";
let dict: Dict = {};
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");
const cache = new Map<string, Promise<Dict>>();

function load(code: string): Promise<Dict> {
  let p = cache.get(code);
  if (!p) {
    p = typeof fetch === "undefined"
      ? Promise.resolve({})
      : fetch(`${BASE}i18n/${code}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => {
          cache.delete(code);
          return {};
        });
    cache.set(code, p);
  }
  return p;
}

export function getLanguage() {
  return lang;
}

export async function setLanguage(next: string) {
  const code = normalizeLanguage(next);
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
    document.documentElement.dir = isRtl(code) ? "rtl" : "ltr";
  }
  const d = code === "en" ? {} : await load(code);
  lang = code;
  dict = d;
  emit();
}

export function initialLanguage(param: string | null): string {
  const fromParam = matchLanguage(param);
  if (fromParam) return fromParam;
  if (typeof navigator !== "undefined") {
    for (const l of navigator.languages ?? [navigator.language]) {
      const m = matchLanguage(l);
      if (m) return m;
    }
  }
  return "en";
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = dict[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v));
  return s;
}

export function useLang(): string {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version,
  );
  return lang;
}
