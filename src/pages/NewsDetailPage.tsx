import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Seo from "../components/Seo";
import { Markdown } from "../lib/markdown";
import { getNewsBySlug, formatDate } from "../lib/content";

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getNewsBySlug(slug) : undefined;

  // Fallback: unknown slug or unpublished article
  if (!article || !article.published) {
    return (
      <PageShell>
        <Seo title="Article not found" />
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Article not found</h1>
            <p className="text-neutral-400 mb-8">
              This news article does not exist or is not published yet.
            </p>
            <Link
              to="/nieuws"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded text-sm uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to all news
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Seo
        title={article.metaTitle || article.title}
        description={article.metaDescription || article.excerpt}
        image={article.image}
      />

      <article className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/nieuws"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-500 hover:gap-2.5 transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All news
          </Link>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 mb-8">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              {formatDate(article.date)}
            </span>
            {article.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                {article.author}
              </span>
            )}
          </div>

          <img
            src={article.image}
            alt={article.title}
            className="w-full h-64 sm:h-96 object-cover rounded-2xl border border-neutral-800 mb-10"
            referrerPolicy="no-referrer"
          />

          <Markdown source={article.body} />
        </div>
      </article>
    </PageShell>
  );
}
