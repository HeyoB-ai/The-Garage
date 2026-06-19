import { useState, type ReactNode } from "react";
import { useSite } from "../i18n";
import { formatPrice } from "../content";
import { Container, Eyebrow, SectionHeading, Button } from "./ui";

/** Spanish registration tax (Impuesto de Matriculación) is CO2-banded. */
function rateForCo2(co2: number): number {
  if (co2 < 120) return 0;
  if (co2 < 160) return 0.0475;
  if (co2 < 200) return 0.0975;
  return 0.1475;
}

export default function ImportCalculator() {
  const { t, locale } = useSite();
  const c = t.calc;
  const [value, setValue] = useState(80000);
  const [co2, setCo2] = useState(180);
  const [result, setResult] = useState<{ tax: number; rate: number } | null>(null);

  const calculate = () => {
    const rate = rateForCo2(co2);
    setResult({ tax: Math.round(value * rate), rate });
  };

  return (
    <section id="calculator" className="border-b border-line bg-surface py-20 lg:py-28">
      <Container className="grid items-start gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <SectionHeading className="mt-4 text-3xl sm:text-4xl">{c.title}</SectionHeading>
          <p className="mt-5 text-lg text-ink-soft">{c.lead}</p>
        </div>

        <div className="lg:col-span-7 lg:pl-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={c.valueLabel}>
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full border-b border-line bg-transparent py-2 font-mono text-lg text-ink outline-none focus:border-accent"
              />
            </Field>
            <Field label={c.co2Label}>
              <input
                type="number"
                min={0}
                value={co2}
                onChange={(e) => setCo2(Number(e.target.value))}
                className="w-full border-b border-line bg-transparent py-2 font-mono text-lg text-ink outline-none focus:border-accent"
              />
            </Field>
          </div>

          <Button onClick={calculate} className="mt-8">{c.button}</Button>

          {result && (
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">{c.resultLabel}</div>
                <div className="mt-1 font-display text-4xl font-semibold text-accent">{formatPrice(result.tax, locale)}</div>
              </div>
              <div className="text-right font-mono text-xs text-ink-soft">
                {c.rateLabel}: {(result.rate * 100).toFixed(2)}%
              </div>
            </div>
          )}
          <p className="mt-5 max-w-md text-xs leading-relaxed text-ink-soft/80">{c.disclaimer}</p>
        </div>
      </Container>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
