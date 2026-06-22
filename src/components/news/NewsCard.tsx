import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export interface NewsCardData {
  id: string;
  date: string;
  image: string;
  title: string;
  excerpt: string;
}

export default function NewsCard({ article }: { article: NewsCardData }) {
  const date = new Date(article.date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Link to={`/nieuws/${article.id}`} className="group flex flex-col">
      <div className="overflow-hidden rounded-[2px] bg-surface">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-[3/2] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <time className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{date}</time>
      <h3 className="mt-2 font-display text-xl font-medium leading-snug text-ink">{article.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{article.excerpt}</p>
      <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-all group-hover:gap-2">
        Read <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
