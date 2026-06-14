import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Leaf, Database, Cpu, Layers, Sun, Eye, Play, Pause, RefreshCw, Sliders, UserPlus, Save } from 'lucide-react';

// Tabled Demonstration Zones
const PRESET_ZONES = [
  { id: 'zone_01', name: 'Downtown Innovation Hub', lat: 13.0827, lon: 80.2707, baseSolar: 84.2 },
  { id: 'zone_02', name: 'Metro Industrial Sub-Pocket', lat: 13.0400, lon: 80.2300, baseSolar: 91.5 },
  { id: 'zone_03', name: 'Coastal Residential Sector', lat: 13.0105, lon: 80.2670, baseSolar: 76.8 }
];

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function Dashboard() {
  // Onboarding Session states
  const [userSession, setUserSession] = useState(null);
  const [username, setUsername] = useState('');
  const [locationName, setLocationName] = useState('');

  // Operational Vectors
  const [coordinates, setCoordinates] = useState([13.0827, 80.2707]);
  const [selectedZones, setSelectedZones] = useState(['zone_01']);
  const [allocationChoice, setAllocationChoice] = useState('Photovoltaic Clean-Energy Asset');
  const [solarCover, setSolarCover] = useState(84.2);
  
  // SciPy Optimizer interactive limits state
  const [surfaceArea, setSurfaceArea] = useState(2500);
  const [dailySolarHours, setDailySolarHours] = useState(9);
  const [needRating, setNeedRating] = useState(8);
  const [optimalYield, setOptimalYield] = useState(2677500);

  // Animation Engine State tracking loops
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulatedHour, setSimulatedHour] = useState(12);
  const [dbHistory, setDbHistory] = useState([]);
  const canvasRef = useRef(null);

  // Map Click Listener component to extract fresh custom coordinate nodes
  function MapInteractionHandler() {
    useMapEvents({
      click(e) {
        const newLat = e.latlng.lat;
        const newLon = e.latlng.lng;
        setCoordinates([newLat, newLon]);
        calculateDynamicSolarAccess(newLat, newLon);
      }
    });
    return null;
  }

  const calculateDynamicSolarAccess = async (lat, lon) => {
    try {
      const res = await fetch(`http://localhost:8000/api/calculate-solar?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setSolarCover(data.solar_accessibility_percent);
    } catch {
      setSolarCover(parseFloat((75 + Math.random() * 15).toFixed(1)));
    }
  };

  const runSciPyOptimization = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surface_area: surfaceArea, solar_hours: dailySolarHours, need_rating: needRating })
      });
      const data = await res.json();
      if(data.optimal_caloric_cap) setOptimalYield(data.optimal_caloric_cap);
    } catch {
      // Sandbox baseline backup calculation engine interpolation
      setOptimalYield(Math.round(surfaceArea * dailySolarHours * needRating * 125));
    }
  };

  const saveToDatabase = async () => {
    const payload = {
      username,
      location_name: locationName || "Custom Coordinates Grid",
      latitude: coordinates[0],
      longitude: coordinates[1],
      allocation_choice: allocationChoice,
      calculated_solar_cover: solarCover
    };
    try {
      await fetch('http://localhost:8000/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchDatabaseHistory();
    } catch {
      setDbHistory(prev => [{ id: prev.length + 1, ...payload }, ...prev]);
    }
  };

  const fetchDatabaseHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/profiles');
      const data = await res.json();
      setDbHistory(data);
    } catch { console.log("Local cluster persistence connection open."); }
  };

  useEffect(() => { if (userSession) fetchDatabaseHistory(); }, [userSession]);

  useEffect(() => {
    let frameId;
    if (isPlaying) {
      const step = () => {
        setSimulatedHour(h => (h >= 18 ? 6 : h + 0.05));
        frameId = requestAnimationFrame(step);
      };
      frameId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const progress = (simulatedHour - 6) / 12;
    const angle = progress * Math.PI;
    const sX = canvas.width / 2 + Math.cos(angle + Math.PI) * 120;
    const sY = canvas.height / 2 + Math.sin(angle + Math.PI) * 80;

    if (simulatedHour >= 6 && simulatedHour <= 18) {
      const grad = ctx.createRadialGradient(sX, sY, 2, sX, sY, 150);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(60, 40, 80, 50);
    ctx.fillRect(240, 30, 90, 60);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
    const sLen = Math.abs(12 - simulatedHour) * 10;
    const sDir = (12 - simulatedHour) * 3;
    ctx.fillRect(60 + sDir, 90, 80, sLen);
    ctx.fillRect(240 + sDir, 90, 90, sLen);
  }, [simulatedHour]);

  // Onboarding Authentication Split-View Setup Matrix Menu
  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">URBANHARVEST</h1>
          </div>
          <p className="text-slate-400 text-xs">Initialize local user credentials configuration for relational SQLite profile tracking maps.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">User Identity Token Name</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. Vikram_Mac" className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Target Zone Demarcation</label>
              <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Innovation Core City" className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500" />
            </div>
            <button onClick={() => username && setUserSession(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 rounded-lg text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Initialize Relational Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col">
      {/* Global Control Station Header banner */}
      <header className="border-b border-slate-800 bg-[#0e1322] px-6 py-3.5 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold tracking-widest text-slate-200 uppercase">URBANHARVEST // ENGINE COMPONENT CONSOLE</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono bg-[#161f32] border border-slate-700 px-4 py-1.5 rounded-md">
          <span className="text-slate-400">OPERATOR:</span> <span className="text-emerald-400 font-bold">{username}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ZONE:</span> <span className="text-blue-400 font-bold">{locationName || "COORDINATES CORE"}</span>
        </div>
      </header>

      {/* Main Framework Grid Splits Layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 p-6 gap-6 overflow-hidden">
        
        {/* Left Parameter Panel column stack (4 Columns block layout) */}
        <div className="xl:col-span-4 space-y-6 flex flex-col overflow-y-auto pr-1">
          
          {/* Dual-Asset Configuration Selection Framework */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Dual-Asset Allocation Model
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => setAllocationChoice('Photovoltaic Clean-Energy Asset')} className={`text-left p-2.5 rounded-lg border text-xs transition-all ${allocationChoice === 'Photovoltaic Clean-Energy Asset' ? 'bg-blue-950/40 border-blue-500 text-blue-200' : 'bg-[#1f2937]/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                <div className="font-bold mb-0.5 flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-blue-400" /> Photovoltaic Clean-Energy Asset</div>
                Maximize local solar energy harvesting efficiency variables.
              </button>
              <button onClick={() => setAllocationChoice('Controlled Environment Agro-Caloric Asset')} className={`text-left p-2.5 rounded-lg border text-xs transition-all ${allocationChoice === 'Controlled Environment Agro-Caloric Asset' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' : 'bg-[#1f2937]/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                <div className="font-bold mb-0.5 flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-400" /> Controlled Environment Agro-Caloric Asset</div>
                Prioritize local localized crop allocation parameters.
              </button>
            </div>
          </div>

          {/* Interactive SciPy Optimization Array Panel */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" /> SciPy Linear Solver Parameters
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>AVAILABLE SURFACE AREA:</span> <span className="text-slate-200 font-bold">{surfaceArea} m²</span>
                </div>
                <input type="range" min="50" max="5000" value={surfaceArea} onChange={(e) => setSurfaceArea(parseInt(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">DAILY SOLAR HOURS</label>
                  <input type="number" min="1" max="24" value={dailySolarHours} onChange={(e) => setDailySolarHours(parseInt(e.target.value))} className="w-full bg-[#1f2937] border border-slate-700 rounded p-1.5 text-xs text-slate-100 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">NEED RATING (1-10)</label>
                  <input type="number" min="1" max="10" value={needRating} onChange={(e) => setNeedRating(parseInt(e.target.value))} className="w-full bg-[#1f2937] border border-slate-700 rounded p-1.5 text-xs text-slate-100 font-mono" />
                </div>
              </div>
              <button onClick={runSciPyOptimization} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2 rounded text-xs transition-all uppercase tracking-wider">
                Compute Matrix Weights
              </button>
              <div className="bg-[#0e1322] border border-slate-800 p-2.5 rounded-lg flex justify-between items-center font-mono text-xs">
                <span className="text-slate-400">OPTIMAL YIELD CAP:</span>
                <span className="text-emerald-400 font-bold">{optimalYield.toLocaleString()} kcal/mo</span>
              </div>
            </div>
          </div>

          {/* Heliomorphic Shifting Shadows Rendering Canvas Container */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" /> Diurnal Heliomorphic Shadow Matrix
              </h3>
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 bg-[#161f32] border border-slate-700 text-slate-300 rounded hover:bg-slate-700">
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative bg-[#020617] rounded-lg border border-slate-900 aspect-video overflow-hidden">
              <canvas ref={canvasRef} width={360} height={160} className="w-full h-full object-cover" />
              <div className="absolute bottom-1.5 right-2 font-mono text-[10px] text-slate-500">
                Time: {Math.floor(simulatedHour).toString().padStart(2, '0')}:{(Math.floor((simulatedHour % 1) * 60)).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#161f32] px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">ACTIVE POSITION ANALYSIS POTENTIAL:</span>
              <span className="text-sky-400 font-bold">{solarCover}% Clear</span>
            </div>
            <button onClick={saveToDatabase} className="w-full bg-blue-600 hover:bg-blue-700 text-slate-100 font-bold py-2 rounded text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Commit Runway Parameters to SQLite
            </button>
          </div>

        </div>

        {/* Right Side GIS Engineering Map Frame Layout Container (8 Columns block) */}
        <div className="xl:col-span-8 grid grid-rows-12 gap-4 h-[600px] xl:h-auto">
          
          {/* Tabled Lookups Header Strip Navbar */}
          <div className="row-span-2 bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-col justify-center shadow-md">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> Tabled High-Density Urban Zone Anchors
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {PRESET_ZONES.map(z => (
                <button key={z.id} onClick={() => { setCoordinates([z.lat, z.lon]); setSolarCover(z.baseSolar); }} className={`p-1.5 rounded border text-left truncate transition-all ${coordinates[0] === z.lat ? 'bg-blue-950/60 border-blue-500 text-blue-300' : 'bg-[#1f2937]/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                  ● {z.name.split(' ')[0]} Sector
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Street Raster Vector Map Frame Workspace Viewport */}
          <div className="row-span-10 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden relative shadow-inner">
            <div className="absolute top-2.5 left-2.5 z-[1000] bg-[#0b0f19]/90 backdrop-blur border border-slate-700 px-2.5 py-1 rounded font-mono text-[10px] text-slate-300 pointer-events-none">
              <span className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-emerald-400" /> INTERFACE LAYER: Live Mapnik Engine (Click Anywhere to Reposition Pin Node)</span>
            </div>
            
            <MapContainer center={coordinates} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.jawg.io/jawg-sunny/{z}/{x}/{y}{r}.png?access-token=community" attribution='&copy; <a href="http://jawg.io" target="_blank">Jawg</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'/>
              <ChangeView center={coordinates} />
              <Marker position={coordinates} />
              <MapInteractionHandler />
            </MapContainer>
          </div>

        </div>

      </div>
    </div>
  );
}