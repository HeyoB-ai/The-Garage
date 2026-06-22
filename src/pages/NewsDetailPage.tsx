import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import Seo from "../components/Seo";
import { getNewsById } from "../site/content";

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getNewsById(slug) : undefined;

  if (!article) {
    return (
      <PageShell>
        <Seo title="Article not found" />
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h1 className="font-display text-3xl font-semibold text-ink">Article not found</h1>
            <p className="mt-4 text-ink-soft">This news item does not exist.</p>
            <Link
              to="/nieuws"
              className="mt-8 inline-flex items-center gap-2 rounded-[2px] bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              <ArrowLeft className="h-4 w-4" /> Back to all news
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const date = new Date(article.date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell>
      <Seo title={article.title} description={article.excerpt} image={article.image} />

      <article className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
          <Link
            to="/nieuws"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-all hover:gap-2.5"
          >
            <ArrowLeft className="h-4 w-4" /> All news
          </Link>

          <h1 className="mt-8 font-display text-3xl font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            <Calendar className="h-3.5 w-3.5 text-accent" /> {date}
          </div>

          <img
            src={article.image}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="mt-10 aspect-[16/9] w-full rounded-[2px] border border-line object-cover"
          />

          <p className="mt-8 text-lg leading-relaxed text-ink-soft">{article.excerpt}</p>
        </div>
      </article>
    </PageShell>
  );
}
