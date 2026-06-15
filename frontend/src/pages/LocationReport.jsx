import React, { useState, useEffect } from 'react';
import { Sun, Leaf, ArrowRight, ShieldCheck, Info, Globe, HelpCircle, MapPin } from 'lucide-react';

export default function LocationReport({ lat: initialLat, lng: initialLng, mode: initialMode, sqmeters: initialSqmeters, onBack }) {
  // Direct landing inputs with absolutely empty default initializations
  const [address, setAddress] = useState('');
  const [sqmeters, setSqmeters] = useState(initialSqmeters || '');
  const [mode, setMode] = useState(initialMode || 'hybrid');
  const [monthlyUnits, setMonthlyUnits] = useState('300');
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  // DYNAMIC REGIONAL POWER BILLING ENGINE
  const calculateRegionalElectricityBill = (units, locationStr) => {
    const loc = (locationStr || '').toLowerCase();
    const u = Number(units) || 0;
    
    // 1. TAMIL NADU (TANGEDCO Domestic Tariff I-A Structural Model)
    if (loc.includes('tamil nadu') || loc.includes('chennai') || loc.includes('tn') || loc.includes('kovai') || loc.includes('madurai')) {
      const biMonthlyUnits = u * 2; // TANGEDCO utilizes bi-monthly calculation intervals
      let energyCharge = 0;
      
      if (biMonthlyUnits <= 500) {
        // Tier 1: 100 units free, structural telescopic sub-slabs
        const billable = Math.max(0, biMonthlyUnits - 100);
        if (billable <= 100) {
          energyCharge = billable * 2.35;
        } else {
          energyCharge = (100 * 2.35) + ((billable - 100) * 4.70);
        }
      } else {
        // Tier 2: The "500-unit cliff" transition
        const billable = Math.max(0, biMonthlyUnits - 100); // 100 units still subsidized free
        if (billable <= 300) {
          energyCharge = billable * 4.70;
        } else if (billable <= 400) {
          energyCharge = (300 * 4.70) + ((billable - 300) * 6.30);
        } else {
          energyCharge = (300 * 4.70) + (100 * 6.30) + ((billable - 400) * 8.40);
        }
      }
      
      const fixedChargesAndDuties = biMonthlyUnits > 0 ? 120 : 0;
      const biMonthlyTotal = energyCharge + fixedChargesAndDuties;
      const monthlyEquivalentBill = biMonthlyTotal / 2;
      
      return {
        ratePerUnit: parseFloat((monthlyEquivalentBill / (u || 1)).toFixed(2)),
        totalBill: Math.round(monthlyEquivalentBill),
        regionLabel: "TANGEDCO LT Domestic Tariff I-A (TN)"
      };
    }
    
    // 2. KARNATAKA / BESCOM Alternate Framework Fallback
    if (loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('karnataka') || loc.includes('ka')) {
      let charge = 0;
      if (u <= 50) charge = u * 4.50;
      else if (u <= 100) charge = (50 * 4.50) + ((u - 50) * 5.85);
      else charge = (50 * 4.50) + (50 * 5.85) + ((u - 100) * 7.75);
      return { ratePerUnit: parseFloat((charge / (u || 1)).toFixed(2)), totalBill: Math.round(charge + 110), regionLabel: "BESCOM Domestic (KA)" };
    }

    // 3. NATIONAL DOMESTIC GENERAL AVERAGE STANDARD
    const standardRate = 6.85;
    return {
      ratePerUnit: standardRate,
      totalBill: Math.round(u * standardRate + 80),
      regionLabel: "Standard Municipal Domestic Base Rate"
    };
  };

  const executeSpatialCalculationPipeline = (e) => {
    if (e) e.preventDefault();
    if (!address.trim() || !sqmeters) return;
    
    setLoading(true);
    const targetUnits = Number(monthlyUnits) || 300;
    const totalArea = Number(sqmeters) || 100;
    
    // Regional billing parameters match
    const billingSpecs = calculateRegionalElectricityBill(targetUnits, address);

    // Calculate solar generation threshold capacities
    const dailyUnitsNeeded = targetUnits / 30;
    const requiredKw = dailyUnitsNeeded / 4.6; 
    let solarArea = Math.ceil(requiredKw * 7.2); 
    if (solarArea > totalArea) solarArea = Math.round(totalArea);

    let sArea = 0, cArea = 0;
    if (mode === 'solar') { 
      sArea = totalArea; 
    } else if (mode === 'crops') { 
      cArea = totalArea; 
    } else { 
      sArea = solarArea; 
      cArea = Math.max(0, Math.round(totalArea - sArea)); 
    }

    const localKw = parseFloat((sArea / 7.2).toFixed(1));
    const dayKwh = localKw * 4.6;

    // Calculate financial offset mapping strictly using the location-based tariff
    const calculatedMonthlySavings = sArea > 0 ? Math.round(Math.min(targetUnits, dayKwh * 30) * billingSpecs.ratePerUnit) : 0;
    const calculatedAnnualSavings = calculatedMonthlySavings * 12;

    setTimeout(() => {
      setMetrics({
        metadata: {
          allocation: {
            solar_assigned_area: `${sArea} m²`,
            crop_assigned_area: `${cArea} m²`
          }
        },
        billing: billingSpecs,
        environmental_baseline: {
          annual_rainfall: locContainsTN(address) ? "1,408 mm/year" : "1,120 mm/year",
          groundwater_level: locContainsTN(address) ? "9.6 ft Shallow Table" : "24.5 ft Standard Depth",
          local_weather: "Microclimate parameters derived via regional tracking address string rules"
        },
        solar_analysis: {
          avg_sunlight_hours: "7.4 hours/day",
          panel_tilt_angle: locContainsTN(address) ? "13.5° South" : "18.2° South Facing",
          max_kw_output: localKw,
          grid_offset: sArea > 0 ? (Math.min(100, Math.round(((dayKwh * 30) / targetUnits) * 100)) || 100) : 0,
          monthly_savings: calculatedMonthlySavings,
          annual_savings: calculatedAnnualSavings
        },
        crop_analysis: {
          suitability_score: "92% System Match Profile",
          soil_or_substrate: "Recirculating Fluid Hydroponic Loop",
          schedule_table: [
            { crop: "Spinach & Microgreens", planting_season: "Seasonal Cycle A", harvest_season: "4 Weeks Post", avg_yield: `${Math.round(cArea * 1.4).toLocaleString()} kg`, net_profit: `₹${Math.round(cArea * 350).toLocaleString()}` },
            { crop: "Vine Tomatoes", planting_season: "Seasonal Cycle B", harvest_season: "12 Weeks Post", avg_yield: `${Math.round(cArea * 2.8).toLocaleString()} kg`, net_profit: `₹${Math.round(cArea * 720).toLocaleString()}` }
          ]
        }
      });
      setLoading(false);
      setInputSubmitted(true);
    }, 800);
  };

  const locContainsTN = (str) => {
    const l = str.toLowerCase();
    return l.includes('tamil nadu') || l.includes('chennai') || l.includes('tn');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-300 font-mono text-xs flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="tracking-widest animate-pulse uppercase">PROCESSING REGIONAL METRICS & TARIFF VALUES...</span>
      </div>
    );
  }

  // CENTRAL INPUT LANDING BLOCK
  if (!inputSubmitted) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-xl bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          
          <div className="space-y-1.5 text-center">
            <div className="mx-auto bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold px-3 py-1 rounded border border-emerald-900 w-max uppercase tracking-wider">
              Rooftop Optimization Engine
            </div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">Rooftop Resource & Microclimate Analyzer</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Provide your regional site characteristics below to project real-time infrastructure splits, localized solar potential, and utility expense relief.
            </p>
          </div>

          <form onSubmit={executeSpatialCalculationPipeline} className="space-y-4">
            
            {/* ADDRESS SEARCH INPUT BLOCK */}
            <div className="space-y-1">
              <label className="text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Infrastructure Site Address:
              </label>
              <input 
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter city, state, or specific regional address profile..."
                className="w-full bg-[#0e1322] text-slate-100 placeholder-slate-600 font-sans text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TOTAL SQUARE FOOTAGE */}
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider block">
                  Total Footprint Area (m²):
                </label>
                <input 
                  type="number"
                  required
                  min="1"
                  value={sqmeters}
                  onChange={(e) => setSqmeters(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full bg-[#0e1322] text-amber-400 font-mono font-bold text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* MONTHLY DEMAND */}
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider block">
                  Monthly Grid Load (Units/kWh):
                </label>
                <input 
                  type="number"
                  required
                  min="0"
                  value={monthlyUnits}
                  onChange={(e) => setMonthlyUnits(e.target.value)}
                  className="w-full bg-[#0e1322] text-blue-400 font-mono font-bold text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* STRATEGY DROPDOWN MODE */}
            <div className="space-y-1">
              <label className="text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider block">
                Target Structural Deployment Strategy Mode:
              </label>
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-[#0e1322] text-slate-200 font-mono text-xs px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 transition-all"
              >
                <option value="hybrid">Hybrid Split Configuration (Balance Solar & Crops)</option>
                <option value="solar">Dedicated Solar Collection Matrix Array (100% Roof Allocation)</option>
                <option value="crops">Pure Controlled Environment Agriculture Surface (100% Crop Focus)</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-mono font-bold text-xs py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 tracking-widest uppercase mt-2"
            >
              Compile Site Analysis Report <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PARSE COMPREHENSIVE OUTPUT DATA VALUES FOR DISPLAY
  const solarAreaNum = parseInt(metrics?.metadata?.allocation?.solar_assigned_area) || 0;
  const cropAreaNum = parseInt(metrics?.metadata?.allocation?.crop_assigned_area) || 0;
  
  const co2OffsetAnnual = solarAreaNum > 0 ? Math.round((metrics?.solar_analysis?.annual_savings / (metrics?.billing?.ratePerUnit || 7)) * 0.82) : 0;
  const waterSavedHydroponics = cropAreaNum > 0 ? Math.round(cropAreaNum * 420) : 0;
  const totalFoodProducedKg = cropAreaNum > 0 ? Math.round(cropAreaNum * 6.1) : 0;

  const renderSolar = mode === 'solar' || mode === 'hybrid';
  const renderCrops = mode === 'crops' || mode === 'hybrid';
  const isHybrid = mode === 'hybrid';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 font-sans space-y-6">
      
      {/* GLOBAL APPLICATION ACTION CONTAINER STRIP */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <button 
          onClick={() => { setInputSubmitted(false); setMetrics(null); }} 
          className="bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold px-4 py-2 rounded-lg border border-slate-700 text-slate-200 transition-all"
        >
          ← Adjust Location Inputs
        </button>
        <button 
          onClick={() => setShowMethodology(!showMethodology)}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-2 rounded-lg font-mono font-bold flex items-center gap-1.5 transition-all"
        >
          <Info className="w-3.5 h-3.5" /> View System Calculations Sheet
        </button>
      </div>

      {/* METHODOLOGY POPUP CARD */}
      {showMethodology && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs text-slate-300">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> System Equations & Tariff Audit Ledger
            </h3>
            <button onClick={() => setShowMethodology(false)} className="text-slate-500 hover:text-slate-200 font-bold">✕ Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
            <div className="space-y-2">
              <p className="text-amber-500 font-bold uppercase text-[10px] tracking-widest">I. Micro-Grid Sizing Architecture</p>
              <p>• <strong>Spatial Allotment Index:</strong> Matches hardware array constants allowing 7.2 m² surface area per 1 kWp panel configuration payload footprint.</p>
              <p>• <strong>Solar Yield Index:</strong> Calculations utilize an average operational baseline yield constant of 4.6 kWh generated daily per kWp installation.</p>
            </div>
            <div className="space-y-2">
              <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">II. Dynamic Localized Tariff Modeling</p>
              <p>• <strong>Billing Logic Selected:</strong> Evaluated using the customized target zone model utility pricing rules matrix matching your site address string profile.</p>
              <p>• <strong>Calculated Baseline Tariff:</strong> Billed at <strong>₹{metrics?.billing?.ratePerUnit}/unit</strong> under the <strong>{metrics?.billing?.regionLabel}</strong> structural table framework.</p>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM BLUEPRINT ADDRESS AND METRICS CONTAINER */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-emerald-500" />
        <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Target Infrastructure Profile Address</h2>
        <h3 className="text-base font-bold text-slate-200 truncate mb-4">{address}</h3>
        
        <div className="grid gap-4 font-mono text-xs grid-cols-2 md:grid-cols-4">
          <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] font-bold uppercase">Utility Rate Ledger Zone</span>
            <span className="text-slate-200 font-bold text-[11px] truncate block mt-0.5">{metrics?.billing?.regionLabel}</span>
          </div>
          <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] font-bold uppercase">Total Project Footprint</span>
            <span className="text-blue-400 font-bold">{Number(sqmeters).toLocaleString()} m²</span>
          </div>
          <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] font-bold uppercase">Solar Allocation Space</span>
            <span className="text-amber-400 font-bold">{solarAreaNum.toLocaleString()} m²</span>
          </div>
          <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] font-bold uppercase">Agricultural Allotted Space</span>
            <span className="text-emerald-400 font-bold">{cropAreaNum.toLocaleString()} m²</span>
          </div>
        </div>
      </div>

      {/* DETAILED UTILITY PRICE AND ACCOUNT PROFILE LEDGER BLOCK */}
      <div className="bg-gradient-to-r from-slate-900 to-[#111827] border border-slate-800 rounded-xl p-5 shadow-md grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
        <div>
          <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider mb-0.5">Assessed Current Energy Bill:</span>
          <span className="text-slate-100 font-sans text-xl font-black">₹{metrics?.billing?.totalBill?.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-mono font-normal">/ month</span></span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider mb-0.5">Evaluated Effective Tariff Base:</span>
          <span className="text-amber-400 font-sans text-xl font-black">₹{metrics?.billing?.ratePerUnit} <span className="text-xs text-slate-400 font-mono font-normal">per Unit (kWh)</span></span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider mb-0.5">Configured Operational System Goal:</span>
          <span className="text-blue-400 font-sans text-sm font-black block mt-1.5 uppercase tracking-wide">Offset {metrics?.solar_analysis?.grid_offset}% Base Load</span>
        </div>
      </div>

      {/* SUSTAINABILITY QUANTIFICATION CONTAINER BLOCK */}
      <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900 border border-emerald-900/60 rounded-2xl p-5 shadow-lg">
        <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-emerald-400" /> Quantified Environmental Impact Matrices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-[#0b0f19]/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-slate-500 text-[9px] font-bold block uppercase mb-1">Carbon Mitigation Impact</span>
            <span className="text-emerald-400 font-sans text-xl font-black">{co2OffsetAnnual.toLocaleString('en-IN')} kg / year</span>
            <span className="text-slate-400 block text-[10px] font-sans mt-1">Net greenhouse gas (CO2) footprint eliminated via renewable offset metrics.</span>
          </div>
          <div className="bg-[#0b0f19]/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-slate-500 text-[9px] font-bold block uppercase mb-1">Water Resource Conservation</span>
            <span className="text-sky-400 font-sans text-xl font-black">{waterSavedHydroponics.toLocaleString('en-IN')} Liters</span>
            <span className="text-slate-400 block text-[10px] font-sans mt-1">Water volume saved via advanced vertical closed hydroponic recirculation loops.</span>
          </div>
          <div className="bg-[#0b0f19]/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-slate-500 text-[9px] font-bold block uppercase mb-1">Hyper-Local Food Security</span>
            <span className="text-amber-400 font-sans text-xl font-black">{totalFoodProducedKg.toLocaleString('en-IN')} kg / year</span>
            <span className="text-slate-400 block text-[10px] font-sans mt-1">Clean agricultural crop yields generated directly from repurposed infrastructure locations.</span>
          </div>
        </div>
      </div>

      {/* WEATHER BASELINE MATRIX SLOTS */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 font-mono text-xs flex flex-col md:flex-row gap-4 items-stretch">
        <div className="flex flex-1 justify-between items-center bg-[#0e1322] p-3 rounded-lg border border-slate-800/60 whitespace-nowrap">
          <span className="text-slate-500 font-bold uppercase mr-4">Estimated Rainfall Index:</span>
          <span className="text-slate-200 font-sans font-bold">{metrics?.environmental_baseline?.annual_rainfall}</span>
        </div>
        <div className="flex flex-1 justify-between items-center bg-[#0e1322] p-3 rounded-lg border border-slate-800/60 whitespace-nowrap">
          <span className="text-slate-500 font-bold uppercase mr-4">Water Table Profile:</span>
          <span className="text-sky-400 font-sans font-bold">{metrics?.environmental_baseline?.groundwater_level}</span>
        </div>
      </div>

      {/* BLOCK BLUEPRINT CONFIGURATIONS GRID WRAPPER */}
      <div className={`grid gap-6 ${isHybrid ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* PV SOLAR ARRAY CARD COMPONENT */}
        {renderSolar && (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 border-t-4 border-t-amber-500">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Sun className="w-4 h-4" /> Solar Generation Blueprint Blueprint
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[9px] font-bold uppercase">Estimated Sunlight Index</span>
                <span className="text-slate-200 font-sans font-black text-sm block mt-0.5">{metrics?.solar_analysis?.avg_sunlight_hours}</span>
              </div>
              <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[9px] font-bold uppercase">Calculated Optimal Tilt</span>
                <span className="text-amber-400 font-sans font-bold text-xs block mt-1">{metrics?.solar_analysis?.panel_tilt_angle}</span>
              </div>
              <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[9px] font-bold uppercase">Max Safe Array Capacity</span>
                <span className="text-amber-400 font-sans font-black text-sm block mt-0.5">{metrics?.solar_analysis?.max_kw_output} kWp</span>
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800/80 p-4 rounded-xl space-y-3">
              <div className="text-xs font-mono border-b border-slate-800/60 pb-2 flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase">Maximum Local Array Target Output:</span>
                <span className="text-amber-500 font-mono font-bold text-xs bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60">
                  {metrics?.solar_analysis?.max_kw_output || "0"} KW PEAK
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1">
                <div className="bg-[#0e1322] p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 text-[9px] font-bold block uppercase">Bill Covered</span>
                  <span className="text-emerald-400 font-sans font-black text-sm block mt-0.5">{metrics?.solar_analysis?.grid_offset}%</span>
                </div>
                <div className="bg-[#0e1322] p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-500 text-[9px] font-bold block uppercase">Monthly Offset Value</span>
                  <span className="text-slate-200 font-sans font-black text-sm block mt-0.5">₹{metrics?.solar_analysis?.monthly_savings?.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40">
                  <span className="text-emerald-400 text-[9px] font-bold block uppercase">Annual Net Savings</span>
                  <span className="text-emerald-400 font-sans font-black text-sm block mt-0.5">₹{metrics?.solar_analysis?.annual_savings?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HYDROPONIC CONTROL AGRICULTURE CARD */}
        {renderCrops && (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 border-t-4 border-t-emerald-500">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Leaf className="w-4 h-4" /> Climatic Agricultural Blueprints
            </h4>

            <div className="flex gap-3 text-xs font-mono">
              <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800 flex-1">
                <span className="text-slate-500 block text-[9px] font-bold uppercase">Heuristic Bio-Match Index</span>
                <span className="text-emerald-400 font-sans font-black text-sm mt-0.5 block">{metrics?.crop_analysis?.suitability_score}</span>
              </div>
              <div className="bg-[#0e1322] p-3 rounded-xl border border-slate-800 flex-1">
                <span className="text-slate-500 block text-[9px] font-bold uppercase">Growth Substrate Framework</span>
                <span className="text-slate-300 font-sans font-bold text-xs mt-1 block truncate">{metrics?.crop_analysis?.soil_or_substrate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block tracking-wider">Recommended Planting Matrix</span>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0e1322]">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-[9px] font-bold uppercase">
                      <th className="p-3">Suggested Vegetation</th>
                      <th className="p-3">Planting Phase</th>
                      <th className="p-3 text-right">Avg Projected Yield</th>
                      <th className="p-3 text-right text-emerald-400">Est. Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {metrics?.crop_analysis?.schedule_table?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-all">
                        <td className="p-3 font-sans font-bold text-slate-200">{row.crop}</td>
                        <td className="p-3 text-slate-400">{row.planting_season}</td>
                        <td className="p-3 text-right font-sans">{row.avg_yield}</td>
                        <td className="p-3 text-right font-sans font-bold text-emerald-400">{row.net_profit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
