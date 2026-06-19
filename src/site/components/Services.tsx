import { Wrench, Ship, Gem } from "lucide-react";
import { useSite } from "../i18n";
import { Container, Eyebrow, SectionHeading } from "./ui";

const ICONS = { maintenance: Wrench, import: Ship, sales: Gem } as const;

export default function Services() {
  const { t } = useSite();
  const items = [
    { key: "maintenance", ...t.services.items.maintenance },
    { key: "import", ...t.services.items.import },
    { key: "sales", ...t.services.items.sales },
  ] as const;

  return (
    <section id="services" className="border-b border-line py-20 lg:py-28">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{t.services.eyebrow}</Eyebrow>
          <SectionHeading className="mt-4 text-4xl sm:text-5xl">{t.services.title}</SectionHeading>
          <p className="mt-5 text-lg text-ink-soft">{t.services.lead}</p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[2px] border border-line bg-line sm:grid-cols-3">
          {items.map((s) => {
            const Icon = ICONS[s.key];
            return (
              <article key={s.key} className="group flex flex-col bg-surface p-8 transition-colors hover:bg-bg">
                <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <span className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                  0{items.indexOf(s) + 1}
                </span>
                <h3 className="mt-2 font-display text-2xl font-medium text-ink">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
