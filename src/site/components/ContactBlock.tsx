import { MapPin, Phone, Mail } from "lucide-react";
import { useSite } from "../i18n";

export default function ContactBlock() {
  const { t, data } = useSite();
  const c = data.contact;
  const rows = [
    { icon: MapPin, label: t.contact.workshopLabel, value: c.address, href: undefined },
    { icon: Phone, label: t.contact.callLabel, value: c.phone, href: `tel:${c.phoneHref}` },
    { icon: Mail, label: t.contact.emailLabel, value: c.email, href: `mailto:${c.email}` },
  ];
  return (
    <div className="space-y-6">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-4">
          <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">{r.label}</div>
            {r.href ? (
              <a href={r.href} className="text-ink transition-colors hover:text-accent">{r.value}</a>
            ) : (
              <div className="text-ink">{r.value}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
