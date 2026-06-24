import React, { useState, useEffect, useRef } from 'react';
import { useMapInit } from '../hooks/useMapInit';
import SolarProfileWizard from './SolarProfileWizard';
import LocationReport from './LocationReport';
import { useReportStore } from '../store/useReportStore';
import { ArrowLeft, Layers, MousePointer, Info, Maximize, Activity, Sun, Sprout, Layers2, Save, History, Terminal, Zap } from 'lucide-react';

export default function MapWorkspace({ targetPin, onBack }) {
  const mapContainerId = 'telemetry-map-canvas';
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [calculatedArea, setCalculatedArea] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [savedPlots, setSavedPlots] = useState([]);
  
  const { coordinates, resolvedAddress, pinCode, monthlyConsumption, setMonthlyConsumption } = useReportStore();
  const safePinString = pinCode || targetPin || '';

  // Real-time terminal log stream state
  const [logs, setLogs] = useState([
    `SYS_INIT: ACQUIRING GEOSPATIAL VECTOR MAPS FOR PIN ${safePinString}...`,
    `OK: FEED CONNECTED WITH RESOLUTION CAP AT 0.5M/PIXEL.`,
    `READY: ENTRANCE PERIMETER PROTOCOLS ENGAGED.`
  ]);

  const logEndRef = useRef(null);

  const addLog = (text) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${text}`]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const { toggleLassoMode } = useMapInit(
    mapContainerId, 
    coordinates.lat, 
    coordinates.lng, 
    (area, centroid) => {
      setCalculatedArea(area);
      if (centroid) {
        useReportStore.getState().setCoordinates(centroid);
      }
      useReportStore.getState().setTracedArea(area);
      setIsLassoActive(false); 
      toggleLassoMode(false);
      addLog(`SUCCESS: BOUNDS LOCKED. FOOTPRINT AREA CALCULATION: ${area} m².`);
      addLog(`GEO_UPDATE: CENTROID POSITION SECURED: ${centroid.lat.toFixed(5)}° N, ${centroid.lng.toFixed(5)}° E.`);
    }
  );

  // Fetch saved plots from backend registry
  const fetchSavedPlots = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/plots`);
      if (response.ok) {
        const data = await response.json();
        setSavedPlots(data);
        addLog(`SYNC: DOWNLOADED ${data.length} HISTORICAL REGISTERS FROM SQL REGISTRY.`);
      }
    } catch (err) {
      console.error("Failed to query saved plots history:", err);
      addLog(`ERROR: FAIL DETECTED RUNNING SYNCHRONIZATION WITH DATABASE.`);
    }
  };

  useEffect(() => {
    fetchSavedPlots();
  }, []);

  // Save current plot to backend registry
  const handleSavePlot = async () => {
    if (calculatedArea === null) return;
    addLog(`POST: INITIATING PERSISTENCE CALL FOR ${calculatedArea} m² IN DATABASE...`);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/plots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          address_string: resolvedAddress,
          center_lat: coordinates.lat,
          center_lng: coordinates.lng,
          total_area_sqmeters: calculatedArea,
          chosen_mode: selectedSystem || 'hybrid',
          monthly_consumption: 650
        })
      });
      if (response.ok) {
        const data = await response.json();
        addLog(`OK: PLOT REGISTERED UNDER ID: ${data.id}.`);
        fetchSavedPlots();
      } else {
        addLog(`ERROR: TRANSACTION PIPELINE FAILURE ON SQL CORE.`);
      }
    } catch (err) {
      console.error(err);
      addLog(`ERROR: DATABASE TIMEOUT TELEMETRY EXHAUSTED.`);
    }
  };

  const handleLoadSavedPlot = (plot) => {
    addLog(`LOAD: SEEDING STATE FOR REGISTER ID ${plot.id}...`);
    const store = useReportStore.getState();
    store.setCoordinates({ lat: plot.lat, lng: plot.lng });
    store.setResolvedAddress(plot.address);
    store.setPinCode(plot.monthly_consumption ? String(plot.monthly_consumption) : '560001'); // stub pin fallback
    setCalculatedArea(plot.area);
    addLog(`LOAD: RESTORED PARCEL BOUNDS FOR ENVELOPE: ${plot.area} m².`);
    if (['solar', 'crops', 'hybrid'].includes(plot.mode)) {
      handleSelectStrategy(plot.mode);
    }
  };

  const handleSelectStrategy = (mode) => {
    addLog(`MODE: REDIRECTING ENGINE SEQUENCE TO PROFILE: ${mode.toUpperCase()}...`);
    const store = useReportStore.getState();
    store.setSelectedMode(mode);
    store.setTracedArea(calculatedArea);
    store.setPinCode(safePinString);
    store.setMonthlyConsumption(monthlyConsumption);
    setSelectedSystem(mode);
  };

  return (
    <div className="w-full h-screen bg-[#02050d] text-slate-100 flex flex-col relative font-sans overflow-hidden select-none animate-fadeIn">
      {/* Map Canvas Background (Always Mounted to preserve state and draw layers) */}
      <div id={mapContainerId} className="absolute inset-0 z-0 bg-[#020408]" />

      {/* Main Workspace UI (Header & Sidebar) - Visible when no wizard/report is selected */}
      {!selectedSystem && (
        <>
          {/* HUD HEADER */}
          <header className="w-full bg-slate-950/70 border-b border-cyan-500/20 px-6 py-4 flex justify-between items-center z-20 backdrop-blur-[12px] relative shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xs font-console font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2 text-glow-cyan">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  Rooftop Solar & Farming Analyzer
                </h2>
                <p className="text-[9px] text-slate-400 mt-1 font-console uppercase tracking-wider truncate max-w-xl">
                  Location: {resolvedAddress} • PIN Code: <span className="text-cyan-400 font-bold">{safePinString}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-cyan-400 bg-cyan-950/20 px-4 py-2 rounded-lg border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(0,240,255,0.05)] font-console uppercase tracking-widest font-bold text-glow-cyan">
              <Layers className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              System Online
            </div>
          </header>

          <div className="w-full flex-1 relative flex z-10 pointer-events-none">
            <div className="w-80 h-full p-4 flex flex-col gap-4 relative pointer-events-auto">
              
              {/* CONTROL HUD UNIT: BOUNDS & STRATEGY */}
              <div className="p-5 rounded-xl flex flex-col gap-4 glass-panel neon-border-cyan shadow-2xl relative">
                {/* Hologram scan line overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_95%,rgba(0,240,255,0.05)_95%)] bg-[size:100%_8px] pointer-events-none animate-pulse" />

                <h3 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2 font-console border-b border-cyan-500/10 pb-2.5">
                  <Maximize className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Trace Rooftop Area
                </h3>
                
                {isLassoActive ? (
                  <div className="flex flex-col gap-4 font-console">
                    <div className="bg-slate-950/70 border border-pink-500/20 rounded-lg p-4 text-center">
                      <div className="text-[10px] text-pink-400 font-bold uppercase tracking-widest animate-pulse">
                        Drawing Mode Active
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 uppercase leading-relaxed">
                        Click on the map to define the perimeter corners. Double-click to complete the boundary.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsLassoActive(false);
                        toggleLassoMode(false);
                      }}
                      className="w-full py-3 px-4 rounded-lg font-bold text-xs bg-pink-500/20 text-pink-400 border border-pink-500/40 hover:bg-pink-500/30 cursor-pointer font-console uppercase tracking-widest transition-all"
                    >
                      Cancel Selection
                    </button>
                  </div>
                ) : calculatedArea === null ? (
                  <button
                    onClick={() => {
                      setIsLassoActive(true);
                      toggleLassoMode(true);
                    }}
                    className="w-full py-4 px-4 rounded-lg font-bold text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer font-console uppercase tracking-widest"
                  >
                    <MousePointer className="w-4 h-4" />
                    Select Area on Map
                  </button>
                ) : (
                  <div className="flex flex-col gap-4 font-console">
                    <div className="bg-slate-950/70 border border-cyan-500/10 rounded-lg p-3.5 relative overflow-hidden">
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">TOTAL FOOTPRINT AREA</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1.5 font-tech text-glow-green flex items-baseline gap-1">
                        {calculatedArea.toLocaleString()} <span className="text-xs text-slate-400 font-normal font-console">m²</span>
                      </div>
                    </div>

                    {/* Monthly Power Consumption Input */}
                    <div className="bg-slate-950/70 border border-cyan-500/15 rounded-lg p-3.5 space-y-2">
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Monthly Power Consumption
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={monthlyConsumption}
                          onChange={(e) => setMonthlyConsumption(Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 bg-slate-900/80 border border-cyan-500/30 focus:border-cyan-400 outline-none rounded-lg py-2 px-3 text-white font-bold text-xs tracking-widest transition-all focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] font-console w-0"
                        />
                        <span className="text-[9px] text-amber-400 font-bold tracking-wider bg-amber-950/30 border border-amber-500/30 px-2 py-1.5 rounded shrink-0">KWH</span>
                      </div>
                      <p className="text-[8px] text-slate-600 uppercase tracking-wider">Enter your avg monthly electricity usage</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCalculatedArea(null); // Clear previous area state
                          setIsLassoActive(true);
                          toggleLassoMode(true); // Restart lasso interaction
                        }}
                        className="flex-1 py-2.5 px-3 rounded-lg font-console text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer transition-all duration-300 flex items-center justify-center gap-1"
                      >
                        <MousePointer className="w-3.5 h-3.5" />
                        RESELECT AREA
                      </button>

                      <button
                        onClick={handleSavePlot}
                        className="flex-1 py-2.5 px-3 rounded-lg font-console text-[9px] font-bold uppercase tracking-wider bg-slate-900/60 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer transition-all duration-300 flex items-center justify-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> SAVE PLOT
                      </button>
                    </div>

                    <div className="text-[9px] uppercase font-console tracking-[0.2em] text-slate-500 mt-2 font-bold px-0.5 border-t border-cyan-500/10 pt-3">Select Action:</div>
                    <div className="flex flex-col gap-2 font-console text-[9px] tracking-wider">
                      <button
                        onClick={() => handleSelectStrategy('solar')}
                        className="w-full py-3 px-3 rounded-lg flex items-center gap-2.5 transition-all text-left font-bold bg-slate-950/50 text-slate-300 border border-slate-900 hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-400 cursor-pointer"
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        1. Rooftop Solar Potential
                      </button>

                      <button
                        onClick={() => handleSelectStrategy('crops')}
                        className="w-full py-3 px-3 rounded-lg flex items-center gap-2.5 transition-all text-left font-bold bg-slate-950/50 text-slate-300 border border-slate-900 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400 cursor-pointer"
                      >
                        <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                        2. Rooftop Farming Potential
                      </button>

                      <button
                        onClick={() => handleSelectStrategy('hybrid')}
                        className="w-full py-3 px-3 rounded-lg flex items-center gap-2.5 transition-all text-left font-bold bg-slate-950/50 text-slate-300 border border-slate-900 hover:border-sky-500/50 hover:bg-sky-500/5 hover:text-sky-400 cursor-pointer"
                      >
                        <Layers2 className="w-3.5 h-3.5 text-sky-400" />
                        3. Hybrid Agrivoltaics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* OVERLAY WIZARDS - Keeps the map container mounted in the DOM layer beneath */}
      {['solar', 'crops', 'hybrid'].includes(selectedSystem) && (
        <div className="absolute inset-0 z-30 bg-[#02050d]/95 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <LocationReport 
            onBack={() => {
              setSelectedSystem(null);
              addLog(`NAVIGATION: RESTORED BOUNDARY CANVAS MATRIX VIEW.`);
            }} 
          />
        </div>
      )}
    </div>
  );
}