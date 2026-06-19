import { Navigate, useParams } from "react-router-dom";
import { detectLocale, isLocale } from "./content";
import { SiteProvider } from "./i18n";
import HomePage from "./HomePage";

/** /:locale — validates the locale and renders the localized site. */
export function LocalizedSite() {
  const { locale } = useParams<{ locale: string }>();
  if (!isLocale(locale)) return <Navigate to={`/${detectLocale()}`} replace />;
  return (
    <SiteProvider locale={locale}>
      <HomePage />
    </SiteProvider>
  );
}

/** "/" and unknown paths → the visitor's detected locale. */
export function SiteRedirect() {
  return <Navigate to={`/${detectLocale()}`} replace />;
}
