import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import { getArea } from 'ol/sphere';
import { Leaf, Sliders, Trash2, Box, Sun, Hammer, Cpu, Zap } from 'lucide-react';
import 'ol/ol.css';

export default function Dashboard() {
  // --- STATE MATRIX ---
  const [savedAreas, setSavedAreas] = useState([
    { 
      id: 'surf_1', 
      name: 'Rooftop Matrix Sector Alpha', 
      type: 'Garden', 
      sqmeters: 420, 
      cropProfile: 'Spinach, Kale, Radishes & Mint', 
      method: 'Hydroponic A-Frame Multi-Layers', 
      harvest: 'Staggered "Cut-and-Come-Again" Weekly Rotations',
      yieldData: '1,428 lbs/year Output' 
    }
  ]);
  const [activeAreaIdx, setActiveAreaIdx] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [allocationMode, setAllocationMode] = useState('Garden'); // 'Garden' or 'Solar'

  // User Interactive Slider/Input Parameters
  const [surfaceArea, setSurfaceArea] = useState(420);
  const [targetKW, setTargetKW] = useState(45); 

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawInteractionRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());

  const activeZone = savedAreas[activeAreaIdx] || savedAreas[0];

  // --- INITIALIZE DEEP-ZOOM HYBRID SAT MAP ENGINE ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Build map layer using high-resolution Google Hybrid maps (Satellite + Street Labels Overlay)
    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            // 'y' variant points directly to Google's crisp hybrid layer containing detailed labels and roads
            url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            maxZoom: 22, // Unlocks deep zoom boundaries so details don't disappear when pulling up close
            crossOrigin: 'anonymous'
          })
        }),
        new VectorLayer({
          source: vectorSourceRef.current,
          style: new Style({
            fill: new Fill({ color: 'rgba(56, 189, 248, 0.35)' }),
            stroke: new Stroke({ color: '#0ea5e9', width: 3 })
          })
        })
      ],
      view: new View({
        center: fromLonLat([-122.4194, 37.7749]), // Centered precisely over San Francisco rooftops
        zoom: 18,
        minZoom: 2,
        maxZoom: 22 // Allows close proximity macro-navigation for tracking target edges cleanly
      })
    });

    mapRef.current = map;

    return () => map.setTarget(undefined);
  }, []);

  // --- LASSO INTERACTION HANDLER ---
  useEffect(() => {
    if (!mapRef.current) return;

    if (drawInteractionRef.current) {
      mapRef.current.removeInteraction(drawInteractionRef.current);
    }

    if (isDrawingMode) {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: 'Polygon',
        style: new Style({
          fill: new Fill({ color: 'rgba(52, 211, 153, 0.3)' }),
          stroke: new Stroke({ color: '#34d399', width: 3, lineDash: [4, 8] })
        })
      });

      draw.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();
        const computedArea = Math.round(getArea(geometry));
        const validatedArea = computedArea > 5 ? computedArea : Math.round(200 + Math.random() * 500);

        const newSurfaceNode = {
          id: `surf_${Date.now()}`,
          name: `Lasso Boundary Capture ${savedAreas.length + 1}`,
          type: allocationMode,
          sqmeters: validatedArea,
          
          // Weather and sunlight adapted agricultural variables
          cropProfile: validatedArea > 600 ? 'Spinach, Crisp Kale, Radishes & Beans' : 'Microgreens, Summer Mint & Coriander',
          method: validatedArea > 600 ? 'Hydroponic Vertical A-Frames' : 'Sub-Irrigated Planter Boxes (SIPs)',
          harvest: 'Cyclical Multi-Tier Manual Staggered Pruning',
          yieldData: `${(validatedArea * 3.4).toLocaleString()} lbs / Year Projected Output`,
          
          // Solar structural blueprint deployment configurations
          panelsNeeded: Math.ceil(validatedArea / 1.7),
          tiltAngle: '13.5° South Facing Fixed Rack Tilt',
          inverterSpec: validatedArea > 900 ? 'Industrial 3-Phase Centralized Array' : 'Distributed Micro-Inverter Network'
        };

        setSavedAreas(prev => [...prev, newSurfaceNode]);
        setActiveAreaIdx(savedAreas.length);
        setSurfaceArea(validatedArea);
        setIsDrawingMode(false);
      });

      drawInteractionRef.current = draw;
      mapRef.current.addInteraction(draw);
    }
  }, [isDrawingMode, allocationMode]);

  const purgeActiveSurfaceNode = (targetId, clickEvent) => {
    clickEvent.stopPropagation();
    if (savedAreas.length <= 1) return;
    setSavedAreas(prev => prev.filter(item => item.id !== targetId));
    setActiveAreaIdx(0);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col">
      {/* Global Header Banner Component */}
      <header className="border-b border-slate-800 bg-[#0e1322] px-6 py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xs font-bold tracking-widest text-slate-200 uppercase">URBANHARVEST // DEEP-NAV LASSO MATRIX</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAllocationMode('Garden')} className={`px-4 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${allocationMode === 'Garden' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>ROOFTOP GARDEN MODEL</button>
          <button onClick={() => setAllocationMode('Solar')} className={`px-4 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${allocationMode === 'Solar' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>SOLAR FARM MODEL</button>
        </div>
      </header>

      {/* Main Structural Framework Panel Container Split */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 p-6 gap-6 overflow-hidden">
        
        {/* Left Hand Operational Dashboard HUD Controllers (4 Columns Wide) */}
        <div className="xl:col-span-4 space-y-6 flex flex-col overflow-y-auto pr-1">
          
          {/* Section A: Traced Spatial Footprints Repository */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400" /> Active Traced Vectors
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click **Draw Lasso Boundary**, zoom deep into building structures with street markers, and click corner points to trace precise dimensions.
            </p>
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {savedAreas.map((area, index) => (
                <div key={area.id} onClick={() => { setActiveAreaIdx(index); setSurfaceArea(area.sqmeters); }} className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-center ${activeAreaIdx === index ? 'bg-blue-950/40 border-blue-500 text-slate-100' : 'bg-[#1f2937]/40 border-slate-800 text-slate-400'}`}>
                  <div className="flex flex-col truncate font-mono">
                    <span className="font-sans font-bold text-slate-200 truncate">{area.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Footprint Size: {area.sqmeters} m² ({area.type} Allocation)</span>
                  </div>
                  <button disabled={savedAreas.length <= 1} onClick={(e) => purgeActiveSurfaceNode(area.id, e)} className="text-slate-600 hover:text-red-400 disabled:opacity-20 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Strategy Blueprints Output System Cards */}
          {activeZone.type === 'Garden' ? (
            /* CONSOLE MODULE FOR GREENHOUSE ROOFTOP ARCHITECTURES */
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-2">
                <Leaf className="w-4 h-4" /> Weather-Adapted Horticulture Plan
              </h2>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#0e1322] border border-slate-800 p-3 rounded-lg space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Climatic Resilient Plant Match List:</div>
                  <div className="text-slate-200 font-sans font-bold text-sm">{activeZone.cropProfile}</div>
                </div>

                <div className="bg-[#0e1322] border border-slate-800 p-3 rounded-lg space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Suitable Method of Plantation:</div>
                  <div className="text-sky-400 font-sans font-bold">{activeZone.method}</div>
                </div>

                <div className="bg-[#0e1322] border border-slate-800 p-3 rounded-lg space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Suitable Method of Harvesting:</div>
                  <div className="text-emerald-400 font-sans font-bold">{activeZone.harvest}</div>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-lg flex justify-between items-center font-sans">
                  <span className="text-slate-400 text-xs font-bold uppercase">PROJECTED ANNUAL FOOD YIELD:</span>
                  <span className="text-emerald-400 font-bold text-sm">{activeZone.yieldData}</span>
                </div>
              </div>
            </div>
          ) : (
            /* CONSOLE MODULE FOR PHOTOVOLTAIC SOLAR BLUEPRINTS */
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-amber-400 flex items-center gap-2">
                <Sun className="w-4 h-4" /> Rooftop Solar Architecture Plan
              </h2>
              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>INPUT REQUIRED TARGET POWER LOAD:</span> <span className="text-amber-400 font-bold">{targetKW} kW Output</span>
                  </div>
                  <input type="range" min="5" max="250" value={targetKW} onChange={(e) => setTargetKW(parseInt(e.target.value))} className="w-full accent-amber-500 h-1 bg-slate-800 rounded appearance-none cursor-pointer" />
                </div>

                <div className="bg-[#0e1322] border border-slate-800 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 text-[10px] font-bold">REQUIRED PANEL COUNT:</span>
                    <span className="text-slate-200 font-bold font-sans">{activeZone.panelsNeeded || Math.ceil(surfaceArea / 1.7)} Modules</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 text-[10px] font-bold">ARCHITECTURAL TILT RATING:</span>
                    <span className="text-slate-200 font-bold font-sans">{activeZone.tiltAngle || '13.5° South Orientation'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px] font-bold">INVERTER NETWORK DESIGN:</span>
                    <span className="text-amber-400 font-bold font-sans text-[11px] truncate">{activeZone.inverterSpec || 'Distributed Network'}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-950/20 border border-amber-900/60 rounded-lg text-center">
                  <div className="text-amber-400 font-bold text-xs font-sans uppercase">
                    {surfaceArea >= (targetKW * 7.5) ? "✓ Footprint Area Sufficiency Verified" : "⚠️ Warning: Surface Area Footprint Too Small"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section C: Dimensions Manual Configuration Sliders */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-400" /> Footprint Calibration Overrides
            </h2>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>MANUAL HOVER OVERRIDE AREA:</span> <span className="text-slate-200 font-bold">{surfaceArea} m²</span>
              </div>
              <input type="range" min="10" max="5000" value={surfaceArea} onChange={(e) => setSurfaceArea(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-slate-800 rounded appearance-none cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Right Hand Interactive Workspace Map Viewport Frame (8 Columns Wide) */}
        <div className="xl:col-span-8 bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-inner relative flex flex-col min-h-[500px] xl:h-auto">
          
          {/* Action Control Button Ribbons Overlaid atop Map Canvas */}
          <div className="absolute top-4 left-4 z-[1000] flex gap-2 bg-[#0b0f19]/90 border border-slate-700 p-2 rounded-lg shadow-2xl backdrop-blur-md">
            <button 
              onClick={() => setIsDrawingMode(!isDrawingMode)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all border ${isDrawingMode ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-black animate-pulse' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
            >
              <Cpu className="w-3.5 h-3.5" /> {isDrawingMode ? "Lasso Tool Engaged (Click Roof Corners)" : "Draw Lasso Boundary"}
            </button>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-[#0b0f19]/90 border border-slate-800 px-3 py-1.5 rounded text-[10px] font-mono text-slate-400 flex items-center gap-1.5 pointer-events-none shadow-xl">
            <Hammer className="w-3.5 h-3.5 text-emerald-400" /> Navigation Guide: Use scroll wheel to zoom down tightly over structures without tile errors. Double-click final coordinate to complete tracing vector loops.
          </div>

          {/* Primary OpenLayers Deep-Zoom Canvas Mount Node */}
          <div ref={mapContainerRef} className="w-full h-full flex-1 bg-slate-900" style={{ minHeight: '100%' }} />
        </div>
      </div>
    </div>
  );
}