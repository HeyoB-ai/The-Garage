import { Newspaper } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Seo from "../components/Seo";
import NewsCard from "../components/news/NewsCard";
import { resolveNews } from "../site/content";

export default function NewsOverviewPage() {
  const articles = resolveNews();

  return (
    <PageShell>
      <Seo title="Nieuws" description="Latest news, events and updates from The Garage Jávea." />

      <section className="border-b border-line py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            <Newspaper className="h-4 w-4" /> Journal
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.01em] text-ink sm:text-5xl">Nieuws</h1>
          <div className="mt-5 h-px w-20 bg-accent" />
          <p className="mt-5 max-w-2xl text-ink-soft">
            Events, announcements and stories from our workshop and showroom on the Costa Blanca.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          {articles.length === 0 ? (
            <div className="rounded-[2px] border border-dashed border-line bg-surface py-20 text-center">
              <Newspaper className="mx-auto mb-4 h-10 w-10 text-line" />
              <h2 className="font-display text-lg font-medium text-ink">No news yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                There are no articles at the moment. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
