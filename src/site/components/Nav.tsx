import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSite } from "../i18n";
import { Container, Button } from "./ui";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Nav() {
  const { t } = useSite();
  const [open, setOpen] = useState(false);

  const links = [
    { id: "services", label: t.nav.services },
    { id: "stock", label: t.nav.stock },
    { id: "about", label: t.nav.about },
    { id: "news", label: t.nav.news },
    { id: "contact", label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between">
        {/* Wordmark */}
        <a href="#top" className="group leading-none" onClick={() => setOpen(false)}>
          <span className="block font-display text-xl font-semibold tracking-[0.04em] text-ink">THE GARAGE</span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.4em] text-accent">Jávea</span>
        </a>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <LanguageSwitcher />
          <Button href="#contact" className="px-5 py-2.5">{t.nav.cta}</Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-ink"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-bg md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="py-2.5 text-base text-ink-soft hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
              <LanguageSwitcher />
              <Button href="#contact" className="px-5 py-2.5" >{t.nav.cta}</Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
