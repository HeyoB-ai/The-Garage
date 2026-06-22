import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { siteData } from "../../site/content";

/**
 * Shared chrome for the CMS-adjacent routed pages (/nieuws, /beheer), re-skinned
 * to the new brand tokens (limestone + Mediterranean blue, Bodoni / Hanken).
 */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/" className="leading-none">
            <span className="block font-display text-xl font-semibold tracking-[0.04em] text-ink">THE GARAGE</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.4em] text-accent">Jávea</span>
          </Link>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em]">
            <Link to="/nieuws" className="text-ink-soft transition-colors hover:text-ink">Nieuws</Link>
            <Link to="/beheer" className="text-ink-soft transition-colors hover:text-ink">Beheer</Link>
            <Link to="/" className="inline-flex items-center gap-1.5 text-accent hover:gap-2.5 transition-all">
              <ArrowLeft className="h-3.5 w-3.5" /> Site
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-10 text-xs text-ink-soft">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 md:flex-row">
          <div className="font-display text-sm font-semibold tracking-[0.04em] text-ink">
            THE GARAGE <span className="text-accent">JÁVEA</span> · 2026
          </div>
          <div className="flex items-center gap-4 font-mono">
            <Link to="/" className="hover:text-accent">Home</Link>
            <span className="text-line">·</span>
            <a href={`mailto:${siteData.contact.email}`} className="hover:text-accent">{siteData.contact.email}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
