import { useSite } from "../i18n";
import { Container, Eyebrow, SectionHeading } from "./ui";
import CarCard from "./CarCard";

export default function Stock() {
  const { t, data } = useSite();
  return (
    <section id="stock" className="border-b border-line py-20 lg:py-28">
      <Container>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <Eyebrow>{t.stock.eyebrow}</Eyebrow>
            <SectionHeading className="mt-4 text-4xl sm:text-5xl">{t.stock.title}</SectionHeading>
          </div>
          <p className="max-w-sm text-ink-soft sm:text-right">{t.stock.lead}</p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {data.stock.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </Container>
    </section>
  );
}
