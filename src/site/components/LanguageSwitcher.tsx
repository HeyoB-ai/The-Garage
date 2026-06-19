import { Link } from "react-router-dom";
import { locales } from "../content";
import { useSite } from "../i18n";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale } = useSite();
  return (
    <nav aria-label="Language" className={`flex items-center gap-1 font-mono text-[11px] tracking-wider ${className}`}>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="mx-1 text-line">·</span>}
          <Link
            to={`/${l}`}
            aria-current={l === locale ? "true" : undefined}
            className={`uppercase transition-colors ${
              l === locale ? "text-accent" : "text-ink-soft hover:text-ink"
            }`}
          >
            {l}
          </Link>
        </span>
      ))}
    </nav>
  );
}
