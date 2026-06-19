import { useEffect } from "react";
import { useSite } from "./i18n";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Services from "./components/Services";
import ImportCalculator from "./components/ImportCalculator";
import Stock from "./components/Stock";
import About from "./components/About";
import News from "./components/News";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import AdvisorChat from "./components/AdvisorChat";

export default function HomePage() {
  const { t, locale } = useSite();

  useEffect(() => {
    document.title = t.meta.title;
    document.documentElement.lang = locale;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", t.meta.description);
  }, [t, locale]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Nav />
      <main>
        <Hero />
        <Services />
        <ImportCalculator />
        <Stock />
        <About />
        <News />
        <Contact />
      </main>
      <Footer />
      <AdvisorChat />
    </div>
  );
}
