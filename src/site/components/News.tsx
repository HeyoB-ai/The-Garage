import { useSite } from "../i18n";
import { Container, Eyebrow, SectionHeading } from "./ui";
import NewsItem from "./NewsItem";

export default function News() {
  const { t, data } = useSite();
  const [feature, ...rest] = data.news;
  return (
    <section id="news" className="border-b border-line py-20 lg:py-28">
      <Container>
        <Eyebrow>{t.news.eyebrow}</Eyebrow>
        <SectionHeading className="mt-4 text-4xl sm:text-5xl">{t.news.title}</SectionHeading>

        <div className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-2">
          {feature && <NewsItem record={feature} feature />}
          <div className="flex flex-col gap-12">
            {rest.map((r) => (
              <NewsItem key={r.id} record={r} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
