import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Navbar from "../Navbar";
import { siteConfig } from "../../lib/content";

/**
 * Shared chrome (top banner, navbar, footer) for standalone routed pages such
 * as the news pages and the CMS dashboard. The home page keeps its own rich
 * layout in App.tsx so existing behaviour is untouched.
 */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-950 min-h-screen text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950 flex flex-col">
      {/* Top banner — mirrors the home page banner */}
      <div className="bg-amber-500 text-neutral-950 text-xs font-bold font-mono py-2.5 px-4 text-center tracking-wide flex justify-center items-center gap-1.5 overflow-hidden">
        <ShieldCheck className="w-4 h-4 text-neutral-950 shrink-0" />
        <span>{siteConfig.tagline}</span>
      </div>

      <Navbar />

      <main className="flex-grow">{children}</main>

      {/* Compact footer */}
      <footer className="bg-neutral-950 py-12 border-t border-neutral-900 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-extrabold text-sm text-white tracking-widest uppercase mb-1">
              {siteConfig.name} • 2026
            </div>
            <p>{siteConfig.contact.address}</p>
          </div>
          <div className="flex gap-4 font-mono">
            <Link to="/" className="hover:text-amber-500">Home</Link>
            <span>•</span>
            <Link to="/nieuws" className="hover:text-amber-500">Nieuws</Link>
            <span>•</span>
            <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-amber-500">
              {siteConfig.contact.email}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
