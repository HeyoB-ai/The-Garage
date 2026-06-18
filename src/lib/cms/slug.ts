/** Shared slugify used by the planner and the content generators. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    // strip combining diacritical marks (U+0300–U+036F)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
