import { useEffect } from "react";
import theme from "../../../content/site/theme.json";

/**
 * Applies the brand design tokens from content/site/theme.json as inline CSS
 * variables on <html>, overriding the defaults in src/index.css. This is the
 * runtime token layer the AI-CMS edits (set_theme → theme.json). Inline custom
 * properties take priority, so one token change recolours the whole site.
 */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function SiteTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const set = (name: string, value?: string | null) => {
      if (value) root.style.setProperty(name, value);
    };
    if (HEX.test(theme.accent)) {
      set("--color-accent", theme.accent);
      set("--color-accent-hover", HEX.test(theme.accentStrong) ? theme.accentStrong : theme.accent);
    }
    if (theme.background && HEX.test(theme.background)) set("--color-bg", theme.background);
    if (theme.ink && HEX.test(theme.ink)) set("--color-ink", theme.ink);
    if (theme.font) set("--font-sans", theme.font);
  }, []);

  return null;
}
