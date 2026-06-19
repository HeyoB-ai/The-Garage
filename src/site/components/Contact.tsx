import { ArrowUpRight } from "lucide-react";
import { useSite } from "../i18n";
import { Container, Eyebrow, SectionHeading } from "./ui";
import ContactBlock from "./ContactBlock";
import OpeningHours from "./OpeningHours";

export default function Contact() {
  const { t, data } = useSite();
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(data.contact.mapQuery)}&output=embed`;

  return (
    <section id="contact" className="py-20 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{t.contact.eyebrow}</Eyebrow>
          <SectionHeading className="mt-4 text-4xl sm:text-5xl">{t.contact.title}</SectionHeading>
          <p className="mt-5 text-lg text-ink-soft">{t.contact.lead}</p>

          <div className="mt-10">
            <ContactBlock />
          </div>
          <div className="mt-10">
            <OpeningHours />
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[2px] border border-line">
            <iframe
              title="Map"
              src={mapSrc}
              className="h-[420px] w-full grayscale-[0.3] lg:h-full lg:min-h-[520px]"
              loading="lazy"
            />
          </div>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(data.contact.mapQuery)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent hover:gap-2.5 transition-all"
          >
            {t.contact.directions} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </Container>
    </section>
  );
}
