/**
 * Content generator for the `update_opening_hours` intent. Turns extracted
 * times into the openingHours fields of site.json. Only the fields it can
 * derive are returned; the executor preserves the rest.
 */
export interface OpeningHoursUpdate {
  weekdays?: string;
  weekend?: string;
}

export function buildOpeningHours(from?: string, to?: string): OpeningHoursUpdate {
  if (from && to) {
    return { weekdays: `Monday to Friday: ${from} - ${to}` };
  }
  return {};
}
