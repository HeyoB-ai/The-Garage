import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import type { NewsArticle } from "../../types";
import { formatDate } from "../../lib/content";

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      to={`/nieuws/${article.slug}`}
      className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-amber-500/30 hover:scale-[1.01] transition-all duration-300"
    >
      <div className="h-48 w-full overflow-hidden bg-neutral-950">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover filter brightness-95 group-hover:brightness-100 transition-all duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-500 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(article.date)}
        </span>
        <h3 className="text-lg font-bold text-white mb-2 leading-snug">{article.title}</h3>
        <p className="text-sm text-neutral-400 leading-relaxed flex-grow">{article.excerpt}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500 group-hover:gap-2.5 transition-all">
          Read article <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
