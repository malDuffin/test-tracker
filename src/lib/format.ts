import type { Price, PriceBadge, Source } from "./types";
import { getLanguage, t } from "@/i18n";

const SYMBOL: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };

export function priceText(p: Price): string {
  if (!p.amount) return t("Price on request");
  const sym = p.currency ? SYMBOL[p.currency] ?? "" : "";
  const amt = p.amount.replace(/(\d[\d,]*)/g, (m) => sym + m);
  return `${amt} ${p.currency ?? ""}`.trim();
}

export const BADGE_LABEL: Record<PriceBadge, string> = {
  lab: "Lab's own price",
  charity: "Charity guide estimate (UDNF, 25 Mar 2026)",
  clinic: "Clinic's own price",
  sale: "Sale price on the day we checked",
  income: "Price for people who qualify on income",
  request: "Price on request",
};

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(getLanguage(), { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return iso;
  }
}

/** Rows older than 90 days may be out of date. */
export function isStale(iso: string, now = new Date()): boolean {
  const d = new Date(`${iso}T12:00:00Z`);
  return now.getTime() - d.getTime() > 90 * 24 * 3600 * 1000;
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames([getLanguage(), "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export const hostOf = (s: Source) => {
  try {
    return new URL(s.url).hostname.replace(/^www\./, "");
  } catch {
    return s.url;
  }
};
