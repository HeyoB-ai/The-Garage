import React, { useState } from "react";
import { PortfolioItem } from "../types";
import { PORTFOLIO_ITEMS } from "../data";
import { ArrowRight, Compass, Shield } from "lucide-react";

export default function Portfolio() {
  const [filter, setFilter] = useState<'all' | 'import' | 'export' | 'maintenance' | 'brokerage'>('all');

  const filteredItems = filter === 'all' 
    ? PORTFOLIO_ITEMS 
    : PORTFOLIO_ITEMS.filter(item => item.type === filter);

  return (
    <section id="portfolio-section" className="py-20 bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div className="max-w-xl">
            <span className="text-amber-500 uppercase tracking-widest font-mono text-xs block mb-3">
              PORTFOLIO & CASE STUDIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight">
              Our Pride & Projects
            </h2>
            <div className="h-1 w-20 bg-amber-500 mt-4 mb-6"></div>
            <p className="text-neutral-400">
              Browse our professional track record of successful Spanish registrations, certified bespoke services, classic car brokerage, and secure European transports.
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0" id="portfolio-filter-buttons">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'import', label: 'Spanish Imports' },
              { id: 'export', label: 'Export Services' },
              { id: 'maintenance', label: 'Maintenance & Diagnostics' },
              { id: 'brokerage', label: 'Sourcing & Brokerage' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`px-4 py-2.5 rounded text-xs font-mono border tracking-wider uppercase transition-all duration-200 ${
                  filter === btn.id
                    ? "bg-amber-500 border-amber-500 text-neutral-950 font-bold"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="portfolio-items-grid">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="group bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col sm:flex-row hover:border-amber-500/30 transition-all duration-300"
            >
              {/* Image box */}
              <div className="sm:w-2/5 relative h-56 sm:h-auto overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                {/* Type Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-950/80 backdrop-blur-md rounded border border-neutral-800 text-[10px] uppercase tracking-wider font-mono text-amber-400">
                  {item.type === "maintenance" ? "service" : item.type}
                </div>
              </div>

              {/* Text info */}
              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  {/* Origin -> Destination Route Info for Import/Export */}
                  {(item.origin || item.destination) && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-amber-500 font-mono mb-2">
                      <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{item.origin}</span>
                      {item.destination && (
                        <>
                          <ArrowRight className="w-3 h-3 text-neutral-500" />
                          <span>{item.destination}</span>
                        </>
                      )}
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors font-sans">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-neutral-400 font-mono mb-3">
                    Vehicle: {item.car} ({item.year})
                  </p>

                  <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Outcome panel styling */}
                <div className="mt-4 p-3 bg-neutral-950 rounded border border-neutral-800 text-xs">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold block mb-1">Outcome</span>
                  <p className="text-neutral-300 italic">"{item.outcome}"</p>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Dynamic trust CTA banner */}
        <div className="mt-16 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-8 rounded-xl border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded bg-amber-500 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Is your dream vehicle located in Germany or the Netherlands?</h4>
              <p className="text-sm text-neutral-400">We calculate an extremely reliable Spanish registration costing scenario including taxes, COC handling, and transport.</p>
            </div>
          </div>
          <a
            href="#calc-section"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded font-semibold text-sm shadow-md transition-all whitespace-nowrap shrink-0"
          >
            Launch Free Estimator
          </a>
        </div>

      </div>
    </section>
  );
}
