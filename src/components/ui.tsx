import type { ReactNode } from "react";
import { t } from "@/i18n";
import type { Price, Source, Verdict } from "@/lib/types";
import { BADGE_LABEL, formatDate, hostOf, isStale, priceText } from "@/lib/format";

export function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="mt-8">
      <h2 id={`${id}-h`} className="font-serif text-2xl font-semibold text-foreground">{title}</h2>
      {intro && <div className="mt-1 text-[15px] text-muted-foreground">{intro}</div>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Card({ children, className = "", tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "free" | "warn" }) {
  const toneCls = tone === "free" ? "border-l-4 border-l-yes" : tone === "warn" ? "border-l-4 border-l-partly" : "";
  return <div className={`rounded-lg border border-border bg-card p-4 shadow-sm ${toneCls} ${className}`}>{children}</div>;
}

const VERDICT: Record<Verdict, { label: string; cls: string; icon: string }> = {
  yes: { label: "Yes", cls: "bg-yes text-white", icon: "✓" },
  partly: { label: "Partly", cls: "bg-partly text-black", icon: "◐" },
  no: { label: "No", cls: "bg-no text-white", icon: "✕" },
  unknown: { label: "Unknown", cls: "bg-unknown text-white", icon: "?" },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${v.cls}`}>
      <span aria-hidden="true">{v.icon}</span>
      <span>{t("Covers your condition:")} {t(v.label)}</span>
    </span>
  );
}

export function SourceLink({ source, children }: { source: Source; children?: ReactNode }) {
  return (
    <a className="underline decoration-dotted underline-offset-2 hover:decoration-solid" href={source.url} target="_blank" rel="noopener noreferrer">
      {children ?? source.label ?? hostOf(source)}
    </a>
  );
}

export function Checked({ source }: { source: Source }) {
  return (
    <span className="text-xs text-muted-foreground">
      {t("Last checked {{date}}", { date: formatDate(source.checked) })}
      {isStale(source.checked) && <strong className="ml-1 text-no">{t("(may be out of date)")}</strong>}
      {" · "}
      <SourceLink source={source}>{t("Source")}: {hostOf(source)}</SourceLink>
    </span>
  );
}

export function PriceList({ prices }: { prices: Price[] }) {
  if (!prices.length) return <p className="text-sm">{t("Price on request")}</p>;
  return (
    <ul className="space-y-2">
      {prices.map((p, i) => (
        <li key={i} className="text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium">{p.what}:</span>
            <span className="text-base font-semibold">{priceText(p)}</span>
            <span className={`rounded border px-1.5 py-0.5 text-xs ${p.badge === "charity" ? "border-primary/40 bg-accent" : p.badge === "lab" || p.badge === "clinic" ? "border-yes/50 bg-yes/10" : "border-border bg-background"}`}>
              {t(BADGE_LABEL[p.badge])}
            </span>
          </div>
          {p.note && <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>}
          <Checked source={p.source} />
        </li>
      ))}
    </ul>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-sm">
      <dt className="inline font-medium">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  );
}
