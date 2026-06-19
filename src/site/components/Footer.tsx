import { useSite } from "../i18n";
import { Container } from "./ui";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Footer() {
  const { t, data } = useSite();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-surface py-12">
      <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <div className="font-display text-lg font-semibold tracking-[0.04em] text-ink">
            THE GARAGE <span className="text-accent">JÁVEA</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{t.footer.tagline}</p>
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <LanguageSwitcher />
          <p className="font-mono text-[11px] text-ink-soft">
            © {year} thegaragejavea.com · {data.contact.languages} · {t.footer.rights}
          </p>
        </div>
      </Container>
    </footer>
  );
}
