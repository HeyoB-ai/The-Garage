import { useSite } from "../i18n";
import { Eyebrow } from "./ui";

function isOpenNow(range: string): boolean {
  const m = range.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = +m[1] * 60 + +m[2];
  const end = +m[3] * 60 + +m[4];
  return mins >= start && mins <= end;
}

export default function OpeningHours() {
  const { t, data } = useSite();
  const day = new Date().getDay(); // 0 Sun .. 6 Sat
  const isWeekday = day >= 1 && day <= 5;
  const open = isWeekday && isOpenNow(data.openingHours.weekdays);

  const rows = [
    { label: t.hours.weekdaysLabel, value: data.openingHours.weekdays, today: isWeekday },
    { label: t.hours.weekendLabel, value: t.hours.appointment, today: !isWeekday },
  ];

  return (
    <div>
      <Eyebrow>{t.hours.eyebrow}</Eyebrow>
      <h3 className="mt-3 flex items-center gap-3 font-display text-2xl font-medium text-ink">
        {t.hours.title}
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
            open ? "text-accent" : "text-ink-soft"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-accent" : "bg-ink-soft/50"}`} />
          {open ? t.hours.openNow : t.hours.closedNow}
        </span>
      </h3>

      <dl className="mt-5 divide-y divide-line border-y border-line">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-center justify-between py-3 ${r.today ? "text-ink" : "text-ink-soft"}`}
          >
            <dt className="text-sm">{r.label}</dt>
            <dd className="font-mono text-sm tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
