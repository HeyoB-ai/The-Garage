import React, { useState } from "react";
import { ImportEstimateResult } from "../types";
import { Calculator, Ship } from "lucide-react";

export default function ImportCalculator() {
  const [carAge, setCarAge] = useState<string>("range_0_1"); // age multipliers in Spain
  const [co2Amount, setCo2Amount] = useState<number>(140);
  const [originalValue, setOriginalValue] = useState<number>(45000);
  const [originCountry, setOriginCountry] = useState<string>("NL");
  const [co2Reduced, setCo2Reduced] = useState<boolean>(false);

  const [result, setResult] = useState<ImportEstimateResult | null>(null);

  const calculateEstimate = (e: React.FormEvent) => {
    e.preventDefault();

    // Spanish Impuesto de Matriculación is calculated on the value of the car (depreciated by Spain's Hacienda table based on age),
    // times the tax rate determined by CO2 emissions.
    // Hacienda depreciation multipliers:
    let ageMultiplier = 1.0;
    if (carAge === "range_0_1") ageMultiplier = 1.0;
    else if (carAge === "range_1_2") ageMultiplier = 0.84;
    else if (carAge === "range_2_3") ageMultiplier = 0.67;
    else if (carAge === "range_3_4") ageMultiplier = 0.56;
    else if (carAge === "range_4_5") ageMultiplier = 0.47;
    else ageMultiplier = 0.35; // older than 5 years

    const depreciatedValue = originalValue * ageMultiplier;

    // Spanish CO2 tax Rates:
    // <= 120g/km: 0%
    // > 120 and < 160: 4.75%
    // >= 160 and < 200: 9.75%
    // >= 200: 14.75%
    let co2Rate = 0;
    if (co2Amount <= 120) {
      co2Rate = 0;
    } else if (co2Amount > 120 && co2Amount < 160) {
      co2Rate = 4.75;
    } else if (co2Amount >= 160 && co2Amount < 200) {
      co2Rate = 9.75;
    } else {
      co2Rate = 14.75;
    }

    // Double-check hybrid reduction or special low emission incentives
    let co2RateCalculated = co2Rate;
    if (co2Reduced && co2RateCalculated > 0) {
      co2RateCalculated = Math.max(0, co2RateCalculated - 2.0);
    }

    const matriculationTax = Math.round(depreciatedValue * (co2RateCalculated / 100));

    // ITV (Spain imports inspection + Technical Sheet compilation): €150 - €250
    const itvFees = 195;

    // Gestoria, DGT & registrar fees: €380
    const customsAgentFees = 380;

    // Transport fees to Jávea by covered/uncovered trailer
    let transportFees = 950; // NL to Javea
    if (originCountry === "DE") transportFees = 1200;
    if (originCountry === "FR") transportFees = 800;
    if (originCountry === "UK") transportFees = 1450; // includes Customs clearance prep

    const totalEstimation = matriculationTax + itvFees + customsAgentFees + transportFees;

    setResult({
      matriculationTax,
      itvFees,
      customsAgentFees,
      transportFees,
      totalEstimation,
      co2Rate: co2RateCalculated
    });
  };

  return (
    <section id="calc-section" className="py-20 bg-neutral-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-amber-500 uppercase tracking-widest font-mono text-xs block mb-3">
            TRANSPARENT PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight">
            Spanish Import Tax Calculator
          </h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto mt-4 mb-6"></div>
          <p className="text-neutral-400 text-sm">
            Calculate a reliable, real-world estimation of Spanish registration tax (Impuesto de Matriculación) and secure transport costs to Costa Blanca North. Avoid administrative surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Column */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-xl lg:col-span-7">
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              <span>Vehicle Specifications</span>
            </h3>

            <form onSubmit={calculateEstimate} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original estimated market/invoice value */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Estimated Market Value (€)</span>
                    <span className="text-neutral-500">Hacienda Table Value</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="500000"
                    required
                    value={originalValue}
                    onChange={(e) => setOriginalValue(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Origin Country */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Country of Origin
                  </label>
                  <select
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="NL">Netherlands (NL)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                    <option value="UK">United Kingdom (UK - Post-Brexit Customs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age of the car */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Vehicle Age Bracket
                  </label>
                  <select
                    value={carAge}
                    onChange={(e) => setCarAge(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="range_0_1">New to 1 year old</option>
                    <option value="range_1_2">1 to 2 years old</option>
                    <option value="range_2_3">2 to 3 years old</option>
                    <option value="range_3_4">3 to 4 years old</option>
                    <option value="range_4_5">4 to 5 years old</option>
                    <option value="range_older">Older than 5 years</option>
                  </select>
                </div>

                {/* CO2 Emissions */}
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1 flex items-center justify-between">
                    <span>CO2 Emissions (g/km) *</span>
                    <span className="text-[10px] text-amber-500 font-bold">See registration paper</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="450"
                    required
                    value={co2Amount}
                    onChange={(e) => setCo2Amount(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hybrid & Electrics exemption path */}
              <div className="flex items-center space-x-3 bg-neutral-950 p-4 rounded border border-neutral-800">
                <input
                  type="checkbox"
                  id="co2Reduced"
                  checked={co2Reduced}
                  onChange={(e) => setCo2Reduced(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-neutral-900 border-neutral-800 focus:ring-amber-500"
                />
                <label htmlFor="co2Reduced" className="text-xs text-neutral-300 cursor-pointer">
                  This is a qualified <strong>Plug-In Hybrid (PHEV) / Electric</strong> vehicle with officially accredited Spanish eco-status.
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs uppercase tracking-wider transition-all"
              >
                Calculate Turnkey Estimate
              </button>

            </form>

            <span className="text-[10px] text-neutral-500 font-mono mt-4 block leading-relaxed">
              * Official percentages are calculated based on the official Spanish Tax Agency (Agencia Tributaria) guidelines. An exact, legally binding quotation requires manual inspection of your Certificate of Conformity (COC) technical file by our specialists.
            </span>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5">
            {result ? (
              <div className="bg-neutral-900 border-2 border-amber-500/35 p-6 sm:p-8 rounded-xl relative overflow-hidden" id="calculator-results-box">
                <div className="absolute top-0 right-0 px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold text-[10px] uppercase font-mono tracking-wider rounded-bl">
                  Turnkey Estimate
                </div>

                <span className="text-xs uppercase font-mono text-neutral-400 block mb-1">Estimated concierge total</span>
                <h3 className="text-4xl font-mono font-extrabold text-amber-500 mb-6">
                  €{result.totalEstimation.toLocaleString("en-US")}
                </h3>

                <div className="space-y-3.5 border-t border-neutral-800 pt-6">
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Registration Tax (Impuesto de Matriculación) at {result.co2Rate}%:</span>
                    <span className="font-mono text-white">€{result.matriculationTax.toLocaleString("en-US")}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Insured Safe Freight to Jávea:</span>
                    <span className="font-mono text-white">€{result.transportFees.toLocaleString("en-US")}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">ITV Inspection & Technical Sheet:</span>
                    <span className="font-mono text-white font-semibold">€{result.itvFees}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Gestoría, D6T, Plates & Local Duties:</span>
                    <span className="font-mono text-white">€{result.customsAgentFees}</span>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex justify-between items-center text-sm font-sans">
                    <span className="text-amber-500 font-bold">Concierge Fully Managed Service:</span>
                    <span className="text-emerald-400 font-bold font-mono">Included</span>
                  </div>

                </div>

                <div className="mt-6 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded text-xs text-neutral-200">
                  <span className="font-bold text-white block mb-1">Hands-free Management</span>
                  We coordinate the transit, complete the tax declarations, handle the physical ITV customs inspection, and deliver the final Spanish papers.
                </div>

                <a
                  href="#contact-section"
                  className="w-full text-center block mt-6 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Request Official Binding Quote
                </a>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center h-full flex flex-col justify-center items-center min-h-[300px]">
                <Ship className="w-12 h-12 text-neutral-600 mb-4" />
                <h4 className="text-lg font-bold mb-1 text-neutral-250">Calculate Instantly</h4>
                <p className="text-sm text-neutral-400 max-w-sm">
                  Input your luxury or sports vehicle's specifications to view a fully transparent breakdown of Spanish registration fees, taxes, and transit costs.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
