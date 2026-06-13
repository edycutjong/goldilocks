import React from 'react';

export default function PricingReport() {
  // Hardcoded demo values based on the PRD specification
  const currentPrice = 5.00;
  const recommendedPrice = 0.45;
  const fillRate = 0.18;
  const median = 0.40;
  
  const comps = [
    { service: "Output Grading", price: 0.20, category: "verification" },
    { service: "Human Sign-off", price: 0.50, category: "verification" },
    { service: "Address Intel", price: 1.00, category: "defi" },
    { service: "Daily Brief", price: 0.40, category: "research" },
    { service: "Patent Search", price: 0.60, category: "research" },
    { service: "Tx Risk Flag", price: 0.35, category: "security" },
    { service: "Summary Bot", price: 0.25, category: "research" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">Goldilocks Pricing Oracle</h1>
          <p className="text-slate-400 mt-2">Analysis for: <span className="font-mono text-cyan-400">agent_demo_overpriced</span></p>
        </header>

        {/* The Dial & Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4">Pricing Analysis</h2>
            
            <div className="flex items-end gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Current Price</p>
                <p className="text-4xl font-light text-red-400 line-through">${currentPrice.toFixed(2)}</p>
              </div>
              <div className="mb-2 text-slate-600">→</div>
              <div>
                <p className="text-xs text-cyan-500 font-medium mb-1">Recommended</p>
                <p className="text-5xl font-bold text-cyan-400">${recommendedPrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Demand Signal</h3>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border-4 border-red-500/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-red-400">{Math.round(fillRate * 100)}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Severely under-filled</p>
                    <p className="text-xs text-slate-400">Only 18% of negotiations convert to paid orders.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
            <h2 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4">AI Rationale</h2>
            <div className="flex-grow bg-slate-950 rounded-lg p-4 font-mono text-sm text-amber-400 border border-slate-800/50 leading-relaxed shadow-inner">
              <span className="text-amber-500/50 mr-2">&gt;</span>
              Your $5.00 is 10× the category median ($0.40) and your fill-rate is 18%. Comparable research services cluster at $0.30–$0.70. Recommend $0.45 to lift fill without underpricing.
            </div>
          </div>
        </div>

        {/* Comparables Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4">Market Comparables</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Service</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Price (USDC)</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((comp, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{comp.service}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">{comp.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">${comp.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-slate-500 text-right">
            Category Median: <span className="font-mono text-slate-300">${median.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
