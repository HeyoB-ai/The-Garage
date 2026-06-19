/**
 * Content generator for the `update_opening_hours` intent. Writes the
 * language-independent TIME RANGE only (e.g. "09:00 – 17:00") into
 * content/site/data.json#openingHours.weekdays. The per-locale day labels
 * ("Monday – Friday" / "Maandag – Vrijdag") live in the prose files and are
 * left untouched. One edit therefore applies to all four languages.
 */
export interface OpeningHoursUpdate {
  weekdays?: string;
  weekend?: string;
}

export function buildOpeningHours(from?: string, to?: string): OpeningHoursUpdate {
  if (from && to) {
    return { weekdays: `${from} – ${to}` };
  }
  return {};
}
