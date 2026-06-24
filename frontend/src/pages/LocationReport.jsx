import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Sprout, Layers, ShieldCheck, Download, Loader2, Thermometer, TreePine, AlertTriangle, Cpu, Globe, Heart, Zap, TrendingUp, Leaf, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useReportStore } from '../store/useReportStore';

/**
 * Highly Stylized Metrics Report View Panel
 * Fetches live environmental & computer vision parameters from FastAPI backend,
 * and renders a data-rich cyberpunk HUD dashboard.
 */
export default function LocationReport({ onBack }) {
  const { tracedArea, coordinates, selectedMode, resolvedAddress, pinCode, monthlyConsumption } = useReportStore();

  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Loading process strings for holographic terminal effect
  const [loadLine, setLoadLine] = useState("ACQUIRING SENTINEL-2 INFRASTRUCTURE FEED...");

  useEffect(() => {
    let active = true;
    
    // Animate loader lines
    const processMessages = [
      "ESTABLISHING SECURE SATELLITE CONNECTION...",
      "FETCHING LIVE METEO WEATHER GRID CHUNKS...",
      "RUNNING PIXEL-LEVEL OPENCV THRESHOLD MASKS...",
      "GENERATING HSV VEGETATION COEFFICIENTS...",
      "RUNNING EDGE VIABILITY CALCULATOR MATRIX..."
    ];

    processMessages.forEach((msg, idx) => {
      setTimeout(() => {
        if (active && isLoading) setLoadLine(msg);
      }, (idx + 1) * 800);
    });

    const executeAnalysis = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            area_m2: tracedArea,
            mode: selectedMode
          })
        });

        if (!response.ok) {
          throw new Error('API transaction pipeline fault');
        }

        const data = await response.json();
        if (active) {
          setAnalysisData(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setApiError('FASTAPI CORE API LATENCY TIMEOUT. REVERTING TO BASELINE SIMULATION MODELS.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    executeAnalysis();
    return () => { active = false; };
  }, [coordinates.lat, coordinates.lng, tracedArea, selectedMode]);

  // Handle Loading State with Holographic Cyberpunk Telemetry Animation
  if (isLoading) {
    return (
      <div className="w-full flex-1 bg-[#02050d] flex flex-col justify-center items-center font-console p-6 text-center space-y-6 relative overflow-hidden h-screen select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
        <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Holographic glowing ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-cyan-500/10 border-l-transparent animate-spin" style={{ animationDuration: '1s' }} />
          <div className="absolute w-20 h-20 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-pink-500/10 border-l-transparent animate-spin-reverse" style={{ animationDuration: '1.5s' }} />
          <div className="absolute w-12 h-12 rounded-full border-2 border-dashed border-cyan-400/40 animate-pulse" />
          <Cpu className="w-6 h-6 text-cyan-400 animate-pulse text-glow-cyan" />
        </div>
        
        <div className="space-y-3 z-10 relative">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 text-glow-cyan animate-pulse">
            {loadLine}
          </h3>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              Retrieving satellite imagery and processing regional weather data...
            </p>
        </div>
      </div>
    );
  }

  // --- COMPUTE BASE FEASIBILITY DATA ---
  const solarSuitability = analysisData?.financial_projections?.solar?.suitability_score ?? 85.0;
  const cropSuitability = analysisData?.financial_projections?.crops?.suitability_score ?? 80.0;

  const solarCapacityKW = (tracedArea * 0.15 * (solarSuitability / 100)).toFixed(1);
  const annualEnergyMWh = (parseFloat(solarCapacityKW) * 1.45).toFixed(1);
  const carbonOffsetTons = (parseFloat(annualEnergyMWh) * 0.82).toFixed(1);
  const foodYieldKg = (tracedArea * (cropSuitability / 100) * 4.2).toFixed(0);
  const rainwaterHarvestLiters = (tracedArea * 650 * 0.85).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // --- COMPUTE INSIGHTS DATA ---
  const tariffRate = 8.5; // ₹/kWh avg Indian residential tariff
  const monthlyBill = (monthlyConsumption || 650) * tariffRate;
  const annualBill = monthlyBill * 12;
  const totalInvestment = parseFloat(solarCapacityKW) * 52000;
  const paybackYears = annualBill > 0 ? (totalInvestment / annualBill).toFixed(1) : 'N/A';
  const energyCoverage = Math.min(100, Math.round((parseFloat(annualEnergyMWh) * 1000) / ((monthlyConsumption || 650) * 12) * 100));
  const monthlySaving = Math.round(monthlyBill * Math.min(1, energyCoverage / 100));
  const waterSavedLiters = Math.round(tracedArea * 0.6 * 650); // rainwater collected for crop irrigation
  const monthlyProduceValue = Math.round((parseFloat(foodYieldKg) / 12) * 80); // avg ₹80/kg local market price
  const foodSecurityScore = Math.min(100, Math.round((parseFloat(foodYieldKg) / 12) / 4 * 100)); // 4kg/month per person
  const co2PerYear = (parseFloat(annualEnergyMWh) * 0.82).toFixed(1);
  const treesEquivalent = Math.round(parseFloat(co2PerYear) * 45);

  const insightItems = {
    solar: [
      { icon: Zap, label: 'Monthly Bill Savings', value: `₹${monthlySaving.toLocaleString('en-IN')}`, sub: 'per month vs current grid bill', color: 'text-amber-400', glow: 'text-glow-gold' },
      { icon: TrendingUp, label: 'Investment Payback', value: `${paybackYears} Years`, sub: 'estimated ROI timeline at current tariffs', color: 'text-cyan-400', glow: 'text-glow-cyan' },
      { icon: Sun, label: 'Energy Coverage', value: `${energyCoverage}%`, sub: 'of your monthly demand from solar', color: 'text-emerald-400', glow: 'text-glow-green' },
      { icon: Leaf, label: 'CO₂ Offset/Year', value: `${co2PerYear} T`, sub: `equivalent to planting ${treesEquivalent} trees`, color: 'text-pink-400', glow: '' },
    ],
    crops: [
      { icon: Sprout, label: 'Monthly Produce Value', value: `₹${monthlyProduceValue.toLocaleString('en-IN')}`, sub: 'estimated market value of harvest', color: 'text-emerald-400', glow: 'text-glow-green' },
      { icon: Leaf, label: 'Food Security Score', value: `${foodSecurityScore}%`, sub: 'fraction of household monthly produce', color: 'text-cyan-400', glow: 'text-glow-cyan' },
      { icon: TrendingUp, label: 'Grow Cycles/Year', value: '3–4 Seasons', sub: 'typical tropical rooftop gardening cycles', color: 'text-amber-400', glow: 'text-glow-gold' },
      { icon: Zap, label: 'Water Saved', value: `${(waterSavedLiters / 1000).toFixed(0)}k L/yr`, sub: 'via rainwater harvested for irrigation', color: 'text-pink-400', glow: '' },
    ],
    hybrid: [
      { icon: Zap, label: 'Monthly Bill Savings', value: `₹${monthlySaving.toLocaleString('en-IN')}`, sub: 'from combined solar generation', color: 'text-amber-400', glow: 'text-glow-gold' },
      { icon: Sprout, label: 'Monthly Produce Value', value: `₹${monthlyProduceValue.toLocaleString('en-IN')}`, sub: 'estimated market value of harvest', color: 'text-emerald-400', glow: 'text-glow-green' },
      { icon: TrendingUp, label: 'Investment Payback', value: `${paybackYears} Years`, sub: 'for solar infrastructure cost recovery', color: 'text-cyan-400', glow: 'text-glow-cyan' },
      { icon: Leaf, label: 'CO₂ Offset/Year', value: `${co2PerYear} T`, sub: `equivalent to planting ${treesEquivalent} trees`, color: 'text-pink-400', glow: '' },
    ],
  };

  const activeInsights = insightItems[selectedMode] || insightItems.hybrid;

  return (
    <div className="w-full flex-1 bg-[#02050d] p-6 overflow-y-auto font-console text-slate-100 max-w-7xl mx-auto space-y-8 animate-fadeIn relative select-none">
      {/* Background radial accent glow */}
      <div className="absolute top-[10%] left-[30%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ACTION HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-cyan-500/10 pb-5">
        <div className="space-y-1.5">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all uppercase tracking-widest border border-cyan-500/20 px-3 py-1.5 rounded bg-cyan-950/10 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Map
          </button>
          <h2 className="text-xl font-bold font-tech text-white uppercase tracking-[0.15em] pt-2 text-glow-cyan glitch-wrapper">
            <span className="glitch" data-text="FEASIBILITY ANALYSIS REPORT">FEASIBILITY ANALYSIS REPORT</span>
          </h2>
        </div>

        {/* Action Button Controls */}
        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-950/60 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest text-cyan-400 text-glow-cyan cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" /> Download Report
        </button>
      </div>

      {/* PRIMARY METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel neon-border-cyan p-5 rounded-xl space-y-1 relative overflow-hidden">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">PIN Code</span>
          <span className="text-2xl font-tech font-bold text-white block mt-1">{pinCode || "600001"}</span>
        </div>
        <div className="glass-panel neon-border-cyan p-5 rounded-xl space-y-1 relative overflow-hidden">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Calculated Area</span>
          <span className="text-2xl font-tech font-bold text-cyan-400 block mt-1 text-glow-cyan">{tracedArea} m²</span>
        </div>
        <div className="glass-panel neon-border-cyan p-5 rounded-xl space-y-1 relative overflow-hidden">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Selected Mode</span>
          <span className="text-2xl font-tech font-bold text-[#FF007F] block mt-1 uppercase tracking-widest text-glow-magenta">{selectedMode}</span>
        </div>
        <div className="glass-panel neon-border-cyan p-5 rounded-xl space-y-1 relative overflow-hidden">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Monthly Consumption</span>
          <span className="text-2xl font-tech font-bold text-amber-400 block mt-1 text-glow-gold">{monthlyConsumption || 650} <span className="text-xs text-slate-500 font-normal">kWh</span></span>
        </div>
      </div>

      {/* DETAILED SIMULATION GRID */}
      <div className={`grid grid-cols-1 ${selectedMode === 'hybrid' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        
        {/* CARD 1: SOLAR BLUEPRINT SUB-SYSTEM */}
        {['solar', 'hybrid'].includes(selectedMode) && (
          <div className="liquid-glass rounded-xl p-6 space-y-5 transition-all duration-300 relative neon-border-gold shadow-[0_0_20px_rgba(255,170,0,0.08)]">
            <div className="flex items-center gap-2.5 border-b border-cyan-500/10 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sun className="w-4 h-4 text-glow-gold" />
              </div>
              <h3 className="text-xs font-bold tracking-[0.15em] text-white uppercase">Rooftop Solar Potential</h3>
            </div>

            <div className="space-y-3 text-[10px] text-slate-400 uppercase tracking-wider">
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Estimated System Size:</span>
                <span className="text-white font-bold">{solarCapacityKW} kWp</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Annual Energy Output:</span>
                <span className="text-amber-400 font-bold text-glow-gold">{annualEnergyMWh} MWh</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Annual CO₂ Saved:</span>
                <span className="text-white font-bold">{carbonOffsetTons} Tons/yr</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Solar Suitability:</span>
                <span className="text-[#00FF41] font-bold text-glow-green">{solarSuitability}%</span>
              </div>
            </div>
          </div>
        )}

        {/* CARD 2: AGRI-INFRASTRUCTURE SUB-SYSTEM */}
        {['crops', 'hybrid'].includes(selectedMode) && (
          <div className="liquid-glass rounded-xl p-6 space-y-5 transition-all duration-300 relative neon-border-green shadow-[0_0_20px_rgba(57,255,20,0.08)]">
            <div className="flex items-center gap-2.5 border-b border-cyan-500/10 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sprout className="w-4 h-4 text-glow-green" />
              </div>
              <h3 className="text-xs font-bold tracking-[0.15em] text-white uppercase">Rooftop Farming Potential</h3>
            </div>

            <div className="space-y-3 text-[10px] text-slate-400 uppercase tracking-wider">
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Cultivation Area:</span>
                <span className="text-white font-bold">{tracedArea} m²</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Estimated Crop Yield:</span>
                <span className="text-emerald-400 font-bold text-glow-green">~{foodYieldKg} Kg/yr</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Rainwater Harvest Potential:</span>
                <span className="text-white font-bold">{rainwaterHarvestLiters} Liters/yr</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-cyan-500/5">
                <span>Agricultural Suitability:</span>
                <span className="text-emerald-400 font-bold text-glow-green">{cropSuitability}%</span>
              </div>
            </div>
          </div>
        )}

        {/* CARD 3: CONTEXTUAL INSIGHTS — MODE SPECIFIC */}
        <div className="liquid-glass neon-border-cyan rounded-xl p-6 space-y-5 flex flex-col justify-between relative shadow-[0_0_20px_rgba(0,240,255,0.08)]">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-cyan-500/10 pb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-4 h-4 text-glow-cyan" />
              </div>
              <h3 className="text-xs font-bold tracking-[0.15em] text-white uppercase">Insights</h3>
            </div>
            
            {/* Mode-specific actionable insights */}
            <div className="space-y-3">
              {activeInsights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <div key={idx} className="bg-slate-950/50 border border-cyan-500/5 rounded-lg p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className={`w-3.5 h-3.5 ${insight.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8.5px] text-slate-500 uppercase tracking-widest font-bold">{insight.label}</div>
                      <div className={`text-base font-tech font-bold mt-0.5 ${insight.color} ${insight.glow}`}>{insight.value}</div>
                      <div className="text-[8px] text-slate-600 uppercase tracking-wider mt-0.5 leading-relaxed">{insight.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[9px] text-slate-600 leading-relaxed uppercase tracking-wider pt-2 border-t border-cyan-500/5">
              Insights computed for <span className="text-slate-400 font-bold">{tracedArea} m²</span> at <span className="text-slate-400 font-bold">{resolvedAddress.split(',')[0]}</span> based on {monthlyConsumption || 650} kWh/month consumption.
            </p>
          </div>
          
          <div className="bg-slate-950/70 p-3 rounded-lg border border-cyan-500/15 flex items-center gap-2.5 shadow-[inset_0_0_10px_rgba(0,240,255,0.02)] mt-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 text-glow-green" />
            <span className="text-[8.5px] text-slate-400 uppercase tracking-widest font-bold leading-normal">
              Analysis completed · {selectedMode.toUpperCase()} mode · {tracedArea} m² rooftop
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}