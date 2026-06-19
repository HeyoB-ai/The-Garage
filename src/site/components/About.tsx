import { useSite } from "../i18n";
import { Container, Eyebrow, SectionHeading } from "./ui";

export default function About() {
  const { t, data } = useSite();
  return (
    <section id="about" className="border-b border-line py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <figure className="order-2 lg:order-1 lg:col-span-5">
          <img
            src={data.media.aboutImage}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="aspect-[4/5] w-full rounded-[2px] object-cover"
          />
        </figure>

        <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-6">
          <Eyebrow>{t.about.eyebrow}</Eyebrow>
          <SectionHeading className="mt-4 text-4xl sm:text-5xl">{t.about.title}</SectionHeading>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft">
            {t.about.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-[2px] border border-line bg-line sm:grid-cols-3">
            {t.about.points.map((pt) => (
              <div key={pt.title} className="bg-bg p-5">
                <dt className="font-display text-base font-medium text-ink">{pt.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{pt.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
