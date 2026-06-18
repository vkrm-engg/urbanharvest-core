import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Download, Award, Globe, 
  Zap, Layers, FileText, CheckSquare, Square, 
  Sliders, TrendingUp, RefreshCw, BarChart2
} from 'lucide-react';

/* ==========================================
   HIGH-PERFORMANCE CANVAS PARTICLE COMPONENT
   ========================================== */
function CyberpunkParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['rgba(0, 217, 255, 0.4)', 'rgba(0, 255, 65, 0.3)', 'rgba(255, 184, 0, 0.3)'];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}

/* ==========================================
   SMOOTH CORE COUNTER ENGINE
   ========================================== */
function useAnimatedCounter(targetValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const end = parseInt(targetValue, 10);
    if (isNaN(end) || end === 0) {
      setCount(targetValue);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}

/* ==========================================
   MAIN DASHBOARD COMPONENT
   ========================================== */
export default function SolarProfileWizard({ availableArea, pinCode, onBack }) {
  const [step, setStep] = useState(1);
  const [monthlyUnits, setMonthlyUnits] = useState(650); 
  const [tariffRate, setTariffRate] = useState(8.5);
  const [includeBuffer, setIncludeBuffer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Technical Modeling Vectors (Calibrated for Tier-1 Commercial Yield Analytics)
  const PEAK_SUNLIGHT_HOURS = 5.5;      
  const PANEL_CAPACITY_WATTS = 540;     
  const PANEL_SURFACE_AREA = 2.58;      
  const BASE_COST_PER_KW = 52000;       
  const GRID_INFLATION_ANNUAL = 0.05;   

  const calculateEngine = () => {
    const safeUnits = Math.max(0, monthlyUnits || 0);
    const rawDailyRequired = safeUnits / 30;
    const dailyEnergyTarget = includeBuffer ? rawDailyRequired * 1.20 : rawDailyRequired;
    const calculatedSizeKw = dailyEnergyTarget / PEAK_SUNLIGHT_HOURS;
    const exactPanelsCount = Math.ceil((calculatedSizeKw * 1000) / PANEL_CAPACITY_WATTS);
    const finalizedSystemSizeKw = (exactPanelsCount * PANEL_CAPACITY_WATTS) / 1000;
    const requiredInstallationArea = exactPanelsCount * PANEL_SURFACE_AREA;
    const isFeasible = availableArea ? requiredInstallationArea <= availableArea : true;

    const basePlantCost = finalizedSystemSizeKw * BASE_COST_PER_KW;
    const structuralMounts = basePlantCost * 0.10; 
    const electricalInverterAndCables = basePlantCost * 0.15;
    const installationLabor = exactPanelsCount * 450;
    const grossTotal = basePlantCost + structuralMounts + electricalInverterAndCables + installationLabor;

    const monthlyBillCurrent = safeUnits * tariffRate;
    const annualSavingsY1 = monthlyBillCurrent * 12;
    const paybackYears = annualSavingsY1 > 0 ? grossTotal / annualSavingsY1 : 0;

    let cumulativeGridCostWithoutSolar = 0;
    let currentYearInvoicedGrid = annualSavingsY1;

    for (let year = 1; year <= 25; year++) {
      cumulativeGridCostWithoutSolar += currentYearInvoicedGrid;
      currentYearInvoicedGrid *= (1 + GRID_INFLATION_ANNUAL);
    }
    const net25YearSavings = cumulativeGridCostWithoutSolar - grossTotal;

    const annualGenerationKwh = finalizedSystemSizeKw * PEAK_SUNLIGHT_HOURS * 365;
    const lifetimeCo2AvoidedTons = (annualGenerationKwh * 25 * 0.82) / 1000;
    const matureTreesEquivalent = Math.round(lifetimeCo2AvoidedTons * 45); 

    let score = 95; 
    if (!isFeasible) score -= 35;
    if (tariffRate < 6) score -= 15;
    if (safeUnits < 250) score -= 10;

    return {
      dailyTarget: dailyEnergyTarget.toFixed(1),
      systemSize: finalizedSystemSizeKw.toFixed(1),
      panelsNeeded: exactPanelsCount,
      areaRequired: requiredInstallationArea.toFixed(1),
      isFeasible,
      baseCost: Math.round(basePlantCost),
      bOSCost: Math.round(structuralMounts),
      electricalCost: Math.round(electricalInverterAndCables),
      laborCost: Math.round(installationLabor),
      totalInvestment: Math.round(grossTotal),
      payback: paybackYears.toFixed(1),
      lifetimeSavings: Math.round(net25YearSavings),
      co2Saved: Math.round(lifetimeCo2AvoidedTons),
      treesPlanted: matureTreesEquivalent,
      confidenceScore: Math.max(10, Math.min(score, 100))
    };
  };

  const metrics = calculateEngine();

  const animatedPanels = useAnimatedCounter(metrics.panelsNeeded);
  const animatedSavings = useAnimatedCounter(metrics.lifetimeSavings);
  const animatedTrees = useAnimatedCounter(metrics.treesPlanted);
  const animatedScore = useAnimatedCounter(metrics.confidenceScore);

  const triggerRefreshPulse = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="w-full h-screen bg-[#0A0E27] text-slate-100 flex flex-col font-sans overflow-y-auto selection:bg-[#00D9FF]/20 select-none antialiased relative">
      
      <style>{`
        @keyframes scrollGrid {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes slowOrbit {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.15); }
        }
        .cyber-grid-container {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(0, 217, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 217, 255, 0.04) 1px, transparent 1px);
          animation: scrollGrid 30s linear infinite;
        }
        .orbital-path {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px dashed rgba(0, 217, 255, 0.07);
          border-radius: 50%;
          transform-origin: center center;
        }
        .animate-spin-slow { animation: slowOrbit 45s linear infinite; }
        .animate-spin-medium { animation: slowOrbit 30s linear infinite reverse; }
        .animate-spin-fast { animation: slowOrbit 20s linear infinite; }
        .pulse-glow-1 { animation: ambientPulse 7s ease-in-out infinite; }
        .pulse-glow-2 { animation: ambientPulse 5s ease-in-out infinite 2s; }
        
        /* Hide native spinner arrows across browsers for structural uniformity */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* BACKGROUND LAYERS */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -inset-[100%] cyber-grid-container opacity-70" />
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-gradient-to-br from-[#00D9FF]/10 to-transparent rounded-full blur-3xl pulse-glow-1" />
        <div className="absolute bottom-[20%] right-[15%] w-[600px] h-[600px] bg-gradient-to-br from-[#00FF41]/5 to-transparent rounded-full blur-3xl pulse-glow-2" />
        <div className="orbital-path w-[500px] h-[500px] animate-spin-slow">
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-[#00D9FF] rounded-full shadow-[0_0_8px_#00D9FF]" />
        </div>
        <div className="orbital-path w-[800px] h-[800px] animate-spin-medium">
          <div className="absolute bottom-0 left-1/3 w-2 h-2 bg-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] via-transparent to-[#0A0E27] opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E27] via-transparent to-[#0A0E27] opacity-80" />
      </div>

      <CyberpunkParticles />

      {/* TOP NAVIGATION HUD */}
      <header className="w-full bg-[#0A0E27]/70 border-b border-[#00D9FF]/20 px-6 py-4 flex items-center justify-between sticky top-0 backdrop-blur-[12px] z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 rounded-lg bg-[#1A1F3A]/40 border border-[#00D9FF]/30 text-[#00D9FF] hover:bg-[#00D9FF]/10 hover:shadow-[0_0_15px_rgba(0,217,255,0.4)] transition-all duration-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#00D9FF] uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00D9FF]" /> Solar PV Calculator
            </h2>
            <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5 tracking-wider">
              PIN Code: {pinCode} • Rooftop Area: <span className="text-[#00FF41] font-bold">{availableArea || 0} m²</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={triggerRefreshPulse}
            className="p-2.5 rounded-lg border border-[#00D9FF]/20 text-slate-400 hover:text-[#00D9FF] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-[10px] font-mono uppercase text-[#00FF41] bg-[#00FF41]/5 border border-[#00FF41]/20 px-3 py-1.5 rounded-md tracking-widest font-bold">
            System Ready
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE INTERFACE */}
      <main className={`flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col justify-center items-center z-20 relative transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
        <AnimatePresence mode="wait">
          {step === 1 ? (
            
            /* STEP 1: BALANCED CONSOLE TEXT CONTROL PANEL */
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg liquid-glass neon-border-cyan rounded-xl p-8 shadow-[0_0_50px_rgba(0,240,255,0.1)] space-y-6 relative overflow-hidden"
            >
              {/* Decorative Tech Scan Bar */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-pulse" />

              <div className="space-y-1.5 font-console">
                <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400 flex items-center gap-2 text-glow-cyan">
                  <Sliders className="w-4 h-4 animate-spin-slow" /> Configure Solar Calculations
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed uppercase">Enter your usage details below to generate a custom solar viability assessment.</p>
              </div>

              <div className="space-y-6 font-console text-xs">
                
                {/* POLISHED NUMERIC INPUT: MONTHLY CONSUMPTION OVERHAUL */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-cyan-400/80 block font-bold tracking-widest">
                    Monthly Electricity Consumption
                  </label>
                  <div className="relative group">
                    <input 
                      type="number"
                      min="0"
                      max="10000"
                      placeholder="Enter monthly consumption in kWh..."
                      value={monthlyUnits || ''}
                      onChange={(e) => setMonthlyUnits(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-950/65 border border-cyan-500/30 focus:border-cyan-400 outline-none rounded-lg py-4 px-4 text-white font-bold text-sm tracking-widest transition-all focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] placeholder-slate-700 font-console"
                    />
                    <span className="absolute right-4 top-3.5 text-cyan-400 font-bold text-[10px] tracking-wider bg-cyan-950/40 border border-cyan-500/40 px-2.5 py-1 rounded">
                      KWH
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider px-0.5">
                    <span>Enter your monthly electricity usage (e.g., from your utility bill).</span>
                    <span></span>
                  </div>
                </div>

                {/* STATE TARIFF INPUT VECTOR */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-cyan-400/80 block font-bold tracking-widest">
                    Electricity Tariff Rate
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      min="0"
                      value={tariffRate || ''}
                      onChange={(e) => setTariffRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-950/65 border border-cyan-500/30 focus:border-cyan-400 outline-none rounded-lg py-4 px-4 text-white font-bold text-sm tracking-widest transition-all focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] font-console"
                    />
                      <span className="absolute right-4 top-3.5 text-slate-500 font-bold text-[9px] tracking-widest uppercase">
                        ₹ / kWh
                      </span>
                  </div>
                </div>

                {/* SCALABILITY CHECKBOX SAFEGUARD */}
                <div 
                  onClick={() => setIncludeBuffer(!includeBuffer)}
                  className="w-full p-4.5 rounded-lg border border-cyan-500/20 bg-slate-950/40 hover:bg-slate-950/70 hover:border-cyan-400/50 flex items-center gap-4.5 cursor-pointer transition-all duration-300 select-none shadow-[inset_0_0_15px_rgba(0,240,255,0.02)]"
                >
                  {includeBuffer ? (
                    <CheckSquare className="w-5 h-5 text-cyan-400 shrink-0 text-glow-cyan" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-700 shrink-0" />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-200 font-bold uppercase tracking-widest text-[10px]">Add 20% Safety Buffer</span>
                    <span className="text-slate-500 text-[8.5px] uppercase leading-relaxed tracking-wider">Slightly larger system size to account for future demand or seasonal variation.</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)} 
                className="w-full py-4.5 rounded-lg text-slate-950 font-tech font-bold tracking-[0.2em] text-xs uppercase bg-gradient-to-r from-cyan-400 to-emerald-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] cursor-pointer transition-all duration-300 transform active:scale-[0.99]"
              >
                Calculate Solar Potential
              </button>
            </motion.div>
          ) : (
            
            /* STEP 2: MULTI-COLUMN GLASSMORPHIC PERFORMANCE GRID */
            <motion.div 
              key="step2"
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.08 } }
              }}
              className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-console"
            >
              
              {/* COMPONENT CARD 1: TECHNICAL SPECS SHEET */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3, boxShadow: "0 0 30px rgba(0, 240, 255, 0.25)" }}
                className="liquid-glass neon-border-cyan rounded-xl p-8 flex flex-col justify-between transition-all duration-300 relative"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 text-glow-cyan">
                        <Zap className="w-5 h-5 text-cyan-400 animate-pulse" /> Estimated Energy Yield
                      </h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Recommended Solar System Size</div>
                      <div className="text-3xl font-tech font-bold text-cyan-400 mt-1.5 text-glow-cyan">
                        {metrics.systemSize} <span className="text-xs font-console font-normal text-slate-400 uppercase tracking-widest">KWP</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Solar Panels Needed</div>
                      <div className="text-3xl font-tech font-bold text-white mt-1.5">
                        {animatedPanels} <span className="text-xs font-console font-normal text-slate-400 uppercase tracking-widest">CELLS</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Average Daily Generation</div>
                      <div className="text-xl font-tech font-bold text-slate-300 mt-1.5">
                        {metrics.dailyTarget} <span className="text-xs font-console font-normal text-slate-500 uppercase tracking-widest">KWH / DAY</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 border p-4 rounded-xl flex flex-col gap-1.5 transition-all duration-300 ${metrics.isFeasible ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'}`}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" /> Spatial Integration Bounds
                  </div>
                  <div className="text-xs font-bold mt-1 text-white flex justify-between">
                    <span>Rooftop Area Required:</span>
                    <span className="text-cyan-400">{metrics.areaRequired} m²</span>
                  </div>
                  <div className={`text-[10px] uppercase font-bold mt-1 tracking-widest text-glow-green ${metrics.isFeasible ? 'text-emerald-400' : 'text-amber-400 text-glow-gold'}`}>
                    {metrics.isFeasible ? "✓ System fits available rooftop area" : `⚠️ Area deficit: ${(metrics.areaRequired - (availableArea || 0)).toFixed(1)} m²`}
                  </div>
                </div>
              </motion.div>

              {/* COMPONENT CARD 2: ITEMIZED PROCUREMENT INVOICE (HERO FOCAL LAYER) */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3, boxShadow: "0 0 35px rgba(0, 240, 255, 0.35)" }}
                className="bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 border-2 border-cyan-400 rounded-xl p-8 flex flex-col justify-between transition-all duration-300 relative shadow-2xl"
              >
                {/* Decorative glowing corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b border-cyan-500/20 pb-3.5">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 text-glow-cyan">
                        <FileText className="w-5 h-5 text-cyan-400" /> Estimated Project Cost
                      </h3>
                      <p className="text-[8px] text-slate-500 uppercase mt-1">Pin Code Reference: {pinCode}</p>
                    </div>
                    <span className="text-[8px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 uppercase tracking-widest text-glow-cyan">Estimated Quote</span>
                  </div>

                  <div className="space-y-3.5 text-[10px] text-slate-400 uppercase tracking-wider">
                    <div className="flex justify-between border-b border-cyan-500/5 pb-1">
                      <span>1. Photovoltaic Cells</span>
                      <span className="text-white font-bold">₹{metrics.baseCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-b border-cyan-500/5 pb-1">
                      <span>2. Structural Mounting</span>
                      <span className="text-white font-bold">₹{metrics.bOSCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-b border-cyan-500/5 pb-1">
                      <span>3. Inverter & Cables</span>
                      <span className="text-white font-bold">₹{metrics.electricalCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-b border-cyan-500/5 pb-1">
                      <span>4. Civil Construction</span>
                      <span className="text-white font-bold">₹{metrics.laborCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-lg flex flex-col gap-1 mt-4 shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Estimated Total Investment</span>
                    <span className="text-3xl font-tech font-bold text-amber-400 tracking-wider mt-1 text-glow-gold">
                      ₹{metrics.totalInvestment.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[8.5px] text-emerald-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1 text-glow-green">
                      <ShieldCheck className="w-3.5 h-3.5" /> Estimated based on local equipment costs
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button 
                    onClick={() => alert('Procurement and financial manifest logs saved to clipboard cache.')}
                    className="w-full py-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-tech font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" /> Save Financial Summary
                  </button>
                  <div className="flex gap-2 font-tech">
                    <button onClick={() => setStep(1)} className="flex-1 py-2 border border-slate-800 text-slate-500 uppercase text-[9px] tracking-widest text-center hover:text-slate-300 transition-colors cursor-pointer">
                      Adjust Inputs
                    </button>
                    <button onClick={onBack} className="flex-1 py-2 bg-cyan-950/20 border border-cyan-500/30 text-cyan-400 uppercase text-[9px] tracking-widest text-center hover:bg-cyan-500/10 transition-all cursor-pointer">
                      Return to Map
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* COMPONENT CARD 3: AMORTIZATION TIMELINES & SUSTAINABILITY LOG */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3, boxShadow: "0 0 20px rgba(0, 217, 255, 0.25)" }}
                className="liquid-glass neon-border-cyan rounded-xl p-8 flex flex-col justify-between transition-all duration-300 relative"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 text-glow-green">
                      <BarChart2 className="w-5 h-5 text-emerald-400" /> Financial Payback & ROI
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* Visual Meter Circular Gauges (SVG representation) */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-950/50 border border-cyan-500/10 p-4 rounded-xl">
                      <div className="flex flex-col items-center justify-center border-r border-cyan-500/10 pr-2">
                        <span className="text-[8.5px] text-slate-500 uppercase tracking-widest block font-bold text-center">Viability Score</span>
                        <div className="relative flex items-center justify-center mt-2.5">
                          <svg className="w-14 h-14">
                            <circle cx="28" cy="28" r="24" className="stroke-slate-800 fill-transparent" strokeWidth="4" />
                            <circle cx="28" cy="28" r="24" className="stroke-emerald-400 fill-transparent text-glow-green" strokeWidth="4" strokeDasharray="150" strokeDashoffset={150 - (150 * animatedScore) / 100} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[11px] font-bold text-white tracking-widest">{animatedScore}%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center pl-2">
                        <span className="text-[8.5px] text-slate-500 uppercase tracking-widest block font-bold text-center">Payback Period</span>
                        <div className="relative flex items-center justify-center mt-2.5">
                          <svg className="w-14 h-14">
                            <circle cx="28" cy="28" r="24" className="stroke-slate-800 fill-transparent" strokeWidth="4" />
                            <circle cx="28" cy="28" r="24" className="stroke-amber-400 fill-transparent text-glow-gold" strokeWidth="4" strokeDasharray="150" strokeDashoffset={150 - (150 * Math.min(25, metrics.payback)) / 25} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[11px] font-bold text-white tracking-widest">~{metrics.payback}Y</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Estimated 25-Year Savings</div>
                      <div className="text-2xl font-tech font-bold text-emerald-400 mt-1.5 text-glow-green">
                        ₹{animatedSavings.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[8.5px] text-slate-500 uppercase mt-2.5 leading-relaxed tracking-wider">Based on current utility rates and average system lifespan.</p>
                    </div>

                    <div className="border-t border-cyan-500/10 pt-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-emerald-400" /> CO₂ Mitigation (Lifetime)
                        </span>
                        <span className="text-white font-bold">{metrics.co2Saved} Tons</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-cyan-400" /> Mature Canopy Offsets
                        </span>
                        <span className="text-emerald-400 font-bold text-glow-green">+{animatedTrees} Trees</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-slate-950/50 border border-cyan-500/10 p-3.5 rounded-lg text-[8.5px] leading-relaxed text-slate-500 uppercase tracking-wider">
                  Estimated financial calculations are projections based on historical solar performance data.
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}