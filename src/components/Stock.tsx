import React, { useState } from "react";
import { Car } from "../types";
import { CARS_STOCK } from "../data";
import { Fuel, Gauge, CheckCircle, Info, Sparkles } from "lucide-react";

interface StockProps {
  onSelectCar: (car: Car) => void;
  openBooking: () => void;
}

export default function Stock({ onSelectCar, openBooking }: StockProps) {
  const [filterFuel, setFilterFuel] = useState<string>("All");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryWishlist, setInquiryWishlist] = useState("");

  const filteredCars = filterFuel === "All"
    ? CARS_STOCK
    : CARS_STOCK.filter(car => car.fuel === filterFuel);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryWishlist) return;
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setInquiryName("");
      setInquiryWishlist("");
    }, 4000);
  };

  return (
    <section id="stock-section" className="py-20 bg-neutral-900 border-t border-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-500 uppercase tracking-widest font-mono text-sm block mb-3">
            PREMIUM VEHICLE INVENTORY
          </span>
          <h2 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight mb-4">
            Exclusive Current Collection
          </h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto mb-6"></div>
          <p className="text-neutral-400">
            Every meticulously curated premium vehicle comes with a comprehensive warranty, fully serviced in our local state-of-the-art facility, and complete turnkey transfer of legal Spanish registration.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider mr-2">Fuel Type:</span>
          {["All", "Petrol", "Hybrid"].map((fuel) => (
            <button
              key={fuel}
              onClick={() => setFilterFuel(fuel)}
              className={`px-4 py-1.5 rounded text-xs font-mono border transition-all ${
                filterFuel === fuel
                  ? "bg-amber-500 border-amber-500 text-neutral-950 font-bold"
                  : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
              }`}
            >
              {fuel === "All" ? "All Engines" : fuel}
            </button>
          ))}
        </div>

        {/* Car Stock Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16" id="stock-cars-grid">
          {filteredCars.map((car) => (
            <div 
              key={car.id}
              className="bg-neutral-950 rounded-xl border border-neutral-800/80 overflow-hidden hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image & Status Badge */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={car.image} 
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      car.status === "Available" ? "bg-emerald-500 text-neutral-950" :
                      car.status === "Reserved" ? "bg-amber-500 text-neutral-950" :
                      "bg-neutral-800 text-neutral-400"
                    }`}>
                      {car.status}
                    </span>
                  </div>

                  {/* Year Tag bottom Left */}
                  <div className="absolute bottom-4 left-4 px-2.5 py-1 bg-neutral-950/85 backdrop-blur-md text-xs font-mono text-neutral-300 rounded border border-neutral-800">
                    Year: {car.year}
                  </div>
                </div>

                {/* Info Text */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      <span className="text-amber-500 block text-xs uppercase font-mono tracking-wider">{car.make}</span>
                      {car.model}
                    </h3>
                    <span className="text-2xl font-mono font-bold text-white">
                      €{car.price.toLocaleString("en-US")}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-400 mb-4 line-clamp-3">
                    {car.description}
                  </p>

                  {/* Highlights Bullet List */}
                  <div className="bg-neutral-900 ring-1 ring-neutral-800/50 rounded-lg p-4 mb-4">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block mb-2">Key Performance Features:</span>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {car.specs.slice(0, 4).map((spec, i) => (
                        <li key={i} className="text-xs text-neutral-300 flex items-center space-x-1.5 truncate">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick features Grid */}
                  <div className="grid grid-cols-3 gap-3 border-t border-neutral-900 pt-4">
                    <div className="bg-neutral-900/65 py-2 px-3 rounded text-center">
                      <Gauge className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <span className="block text-[10px] uppercase font-mono text-neutral-500">MILEAGE</span>
                      <span className="block text-xs font-bold font-mono">{car.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="bg-neutral-900/65 py-2 px-3 rounded text-center">
                      <Fuel className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <span className="block text-[10px] uppercase font-mono text-neutral-500">FUEL</span>
                      <span className="block text-xs font-semibold">{car.fuel}</span>
                    </div>
                    <div className="bg-neutral-900/65 py-2 px-3 rounded text-center">
                      <Info className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <span className="block text-[10px] uppercase font-mono text-neutral-500">TRANSMISSION</span>
                      <span className="block text-xs font-semibold">{car.transmission}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer CTA Button */}
              <div className="p-6 pt-0 border-t border-neutral-900 mt-4 flex space-x-2">
                <button
                  onClick={() => onSelectCar(car)}
                  className="w-1/2 py-2.5 bg-neutral-900 hover:bg-neutral-850 rounded text-neutral-100 font-semibold text-xs border border-neutral-800 transition-colors"
                >
                  View Full Specs
                </button>
                <button
                  onClick={openBooking}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded transition-all"
                >
                  Inquire / Book Test Drive
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Custom Seek Form / Zoekopdracht */}
        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-8 sm:p-12 relative overflow-hidden" id="custom-car-seek-block">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center space-x-2 text-amber-500 font-mono text-xs uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Vehicle not listed?</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
                Submit a Sourcing Inquiry!
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Do you have precise specifications for your next sports vehicle (make, specific color, options package, year limits)? Leveraging our established network of select dealers and wholesale partners in Germany, Italy, and the Netherlands, we locate exact model candidates. We negotiate pricing, handle secure insulated trailer transportation, and deliver the asset turnkey registered on Spanish plates directly to your door.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-neutral-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Pre-purchase master-tech inspection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Registration tax audit & optimization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Insured covered flatbed transport</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Spanish registration keys in hand</span>
                </div>
              </div>
            </div>

            {/* Quick Form */}
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
              {inquirySubmitted ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-1">Inquiry received!</h4>
                  <p className="text-sm text-neutral-400">Our specialists will perform an initial wholesale search and contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. Robert Vance"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Describe your dream vehicle *</label>
                    <textarea
                      required
                      rows={3}
                      value={inquiryWishlist}
                      onChange={(e) => setInquiryWishlist(e.target.value)}
                      placeholder="e.g. Porsche 718 Cayman GTS 4.0 from 2021, PDK, black leather, Sport Chrono package, sub 30,000 km..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:border-amber-500 text-sm placeholder-neutral-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Activate Sourcing Profile
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
