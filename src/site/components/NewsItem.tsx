import { ArrowUpRight } from "lucide-react";
import { useSite } from "../i18n";
import type { NewsRecord } from "../content";

export default function NewsItem({ record, feature = false }: { record: NewsRecord; feature?: boolean }) {
  const { t, locale } = useSite();
  const prose = (t.news.items as Record<string, { title: string; excerpt: string }>)[record.id];
  const date = new Date(record.date).toLocaleDateString(
    { nl: "nl-NL", en: "en-GB", de: "de-DE", es: "es-ES" }[locale],
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className={`group flex flex-col ${feature ? "" : ""}`}>
      <div className="overflow-hidden rounded-[2px] bg-surface">
        <img
          src={record.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] ${
            feature ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
        />
      </div>
      <time className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{date}</time>
      <h3 className={`mt-2 font-display font-medium leading-snug text-ink ${feature ? "text-3xl" : "text-xl"}`}>
        {prose?.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{prose?.excerpt}</p>
      <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-all group-hover:gap-2">
        {t.news.readMore} <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </article>
  );
}
