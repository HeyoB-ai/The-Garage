import { useEffect } from "react";
import { siteConfig } from "../lib/content";

/**
 * Brand token layer. The whole site already styles itself with Tailwind colour
 * utilities (amber-*, neutral-950) and font-sans, which Tailwind v4 emits as CSS
 * variables (e.g. `var(--color-amber-500)`). This component overrides those
 * variables as INLINE custom properties on <html> from site.json's `theme`, so a
 * single token change recolours the entire UI with no component edits and no
 * layout change. Unset/invalid values are skipped (keeps the Tailwind default).
 *
 * Editable via the AI-CMS `set_theme` operation.
 */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function ThemeStyle() {
  useEffect(() => {
    const t = siteConfig.theme;
    const root = document.documentElement;
    const set = (name: string, value?: string | null) => {
      if (value) root.style.setProperty(name, value);
    };

    if (HEX.test(t.accent)) {
      set("--color-amber-300", t.accent);
      set("--color-amber-400", t.accent);
      set("--color-amber-500", t.accent);
    }
    const strong = t.accentStrong && HEX.test(t.accentStrong) ? t.accentStrong : HEX.test(t.accent) ? t.accent : undefined;
    if (strong) {
      set("--color-amber-600", strong);
      set("--color-amber-700", strong);
    }
    if (t.background && HEX.test(t.background)) set("--color-neutral-950", t.background);
    if (t.font) set("--font-sans", t.font);
  }, []);

  return null;
}
