import { useSite } from "../i18n";
import { Container, Eyebrow, Button } from "./ui";

export default function Hero() {
  const { t, data } = useSite();
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
      <Container className="grid items-center gap-10 py-16 lg:grid-cols-12 lg:gap-12 lg:py-24">
        {/* Text */}
        <div className="lg:col-span-6 xl:col-span-5">
          <Eyebrow>{t.hero.eyebrow}</Eyebrow>
          <h1
            className="mt-6 font-display font-semibold tracking-[-0.015em] text-ink"
            style={{ fontSize: "var(--text-display)", lineHeight: 1.04 }}
          >
            {t.hero.headline}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">{t.hero.lead}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="#contact">{t.hero.ctaPrimary}</Button>
            <Button href="#stock" variant="ghost">{t.hero.ctaSecondary}</Button>
          </div>
        </div>

        {/* Image */}
        <div className="lg:col-span-6 xl:col-span-7">
          <figure className="relative">
            <div className="absolute -left-3 -top-3 h-16 w-16 border-l border-t border-accent/40" aria-hidden />
            <img
              src={data.media.heroImage}
              alt=""
              className="aspect-[5/4] w-full rounded-[2px] object-cover lg:aspect-[4/3]"
              referrerPolicy="no-referrer"
              fetchPriority="high"
            />
            <figcaption className="absolute bottom-3 right-3 bg-bg/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft backdrop-blur">
              Jávea · Augusta
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
