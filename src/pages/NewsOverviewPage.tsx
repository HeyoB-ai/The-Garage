import { Newspaper } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Seo from "../components/Seo";
import NewsCard from "../components/news/NewsCard";
import { getAllNews } from "../lib/content";

export default function NewsOverviewPage() {
  const articles = getAllNews();

  return (
    <PageShell>
      <Seo
        title="Nieuws"
        description="Latest news, events and updates from The Garage Jávea."
      />

      {/* Header */}
      <section className="py-16 sm:py-20 border-b border-neutral-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-amber-500 uppercase tracking-widest font-mono text-xs mb-4">
            <Newspaper className="w-4 h-4" /> News &amp; Updates
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Nieuws
          </h1>
          <div className="h-1 w-20 bg-amber-500 mb-6" />
          <p className="text-neutral-400 max-w-2xl">
            Events, announcements and stories from our workshop and showroom on the Costa Blanca.
          </p>
        </div>
      </section>

      {/* Grid / fallback */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {articles.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/40">
              <Newspaper className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">No news yet</h2>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                There are no published articles at the moment. Check back soon for the
                latest updates from The Garage Jávea.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <NewsCard key={article.slug} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
