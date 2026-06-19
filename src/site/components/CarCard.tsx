import { useSite } from "../i18n";
import { formatPrice, type Car } from "../content";
import { StatusChip } from "./ui";

export default function CarCard({ car }: { car: Car }) {
  const { t, locale } = useSite();
  const prose = (t.stock.cars as Record<string, { tagline: string; description: string }>)[car.id];

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-[2px] bg-surface">
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] ${
            car.status === "sold" ? "opacity-70 grayscale-[0.2]" : ""
          }`}
        />
        <div className="absolute left-3 top-3">
          <StatusChip status={car.status} label={t.stock.status[car.status as keyof typeof t.stock.status]} />
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{car.make}</span>
        <span className="font-mono text-sm tabular-nums text-ink">
          <span className="text-ink-soft">{t.stock.from} </span>
          {formatPrice(car.price, locale)}
        </span>
      </div>
      <h3 className="mt-1 font-display text-2xl font-medium leading-snug text-ink">{car.model}</h3>
      {prose?.tagline && <p className="mt-1 text-sm italic text-accent">{prose.tagline}</p>}
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{prose?.description}</p>
      <div className="mt-4 flex gap-5 font-mono text-[11px] tabular-nums text-ink-soft">
        <span>{car.year}</span>
        <span>{car.mileage.toLocaleString(locale)} km</span>
        <span>{car.transmission}</span>
      </div>
    </article>
  );
}
