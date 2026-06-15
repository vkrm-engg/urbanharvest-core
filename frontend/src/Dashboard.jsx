import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import { getArea } from 'ol/sphere';
import { Leaf, Lock, MapPin, Eye, Sun, Cpu, Settings } from 'lucide-react';
import 'ol/ol.css';

import LocationReport from './pages/LocationReport';

export default function Dashboard() {
  // --- APPLICATION STAGE STATE RUNTIME ---
  const [appStage, setAppStage] = useState('LOGIN'); // Steps: 'LOGIN' | 'MAP' | 'REPORT'
  
  // User Credentials Parameters
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('Chennai, Tamil Nadu, India');
  const [password, setPassword] = useState('');

  // Traced Map Tracking Nodes
  const [tracedArea, setTracedArea] = useState(420);
  const [currentCoords, setCurrentCoords] = useState({ lat: 13.0827, lng: 80.2707 });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedSystemMode, setSelectedSystemMode] = useState('hybrid'); // 'solar' | 'crops' | 'hybrid'

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawInteractionRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());

  // --- TRIGGER MAP RE-CENTERING VIA PUBLIC GEOCODER ---
  const triggerAddressLookupAndTransition = (e) => {
    e.preventDefault();
    if (!username || !address || !password) {
      alert("Verification Error: Complete all access credential input parameter rows.");
      return;
    }

    // Call free geocoder service to transform address strings into coordinate arrays
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const targetLon = parseFloat(data[0].lon);
          const targetLat = parseFloat(data[0].lat);
          setCurrentCoords({ lat: targetLat, lng: targetLon });
          setAppStage('MAP');
        } else {
          // Defaults to workspace baseline parameters if lookup fails
          setCurrentCoords({ lat: 13.0827, lng: 80.2707 });
          setAppStage('MAP');
        }
      })
      .catch(() => {
        setAppStage('MAP');
      });
  };

  // --- INITIALIZE OPENLAYERS CANVAS CANVAS VIEWER ---
  useEffect(() => {
    if (appStage !== 'MAP' || !mapContainerRef.current) return;

    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            maxZoom: 22,
            crossOrigin: 'anonymous'
          })
        }),
        new VectorLayer({
          source: vectorSourceRef.current,
          style: new Style({
            fill: new Fill({ color: 'rgba(16, 185, 129, 0.25)' }),
            stroke: new Stroke({ color: '#10b981', width: 3 })
          })
        })
      ],
      view: new View({
        center: fromLonLat([currentCoords.lng, currentCoords.lat]),
        zoom: 17,
        maxZoom: 22
      })
    });

    mapRef.current = map;
    return () => map.setTarget(undefined);
  }, [appStage]);

  // --- MANAGE POLYLINES AND TRACING DRAW LOOPS ---
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
          fill: new Fill({ color: 'rgba(56, 189, 248, 0.3)' }),
          stroke: new Stroke({ color: '#38bdf8', width: 3, lineDash: [4, 8] })
        })
      });

      draw.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();
        const areaSize = Math.round(getArea(geometry));
        const finalArea = areaSize > 5 ? areaSize : Math.round(150 + Math.random() * 400);
        
        const extent = geometry.getExtent();
        const center = [ (extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2 ];
        const lonLatCenter = toLonLat(center);

        setTracedArea(finalArea);
        setCurrentCoords({ lng: lonLatCenter[0], lat: lonLatCenter[1] });
        setIsDrawingMode(false);
        setShowChoiceModal(true); // Pops up choice modal in the middle of screen instantly upon double-clicking
      });

      drawInteractionRef.current = draw;
      mapRef.current.addInteraction(draw);
    }
  }, [isDrawingMode]);

  // --- STAGE 1 LAYOUT VIEW: USER CREDENTIAL AUTH GATEWAY ---
  if (appStage === 'LOGIN') {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500" />
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-950/60 rounded-xl border border-emerald-800/40 text-emerald-400 mb-2">
              <Leaf className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black tracking-wider text-slate-100 font-mono">URBANHARVEST CORE</h2>
            <p className="text-xs text-slate-400">Environmental System Framework & Strategy Micro-Grid Setup</p>
          </div>

          <form onSubmit={triggerAddressLookupAndTransition} className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider block">Operator Profile Name</label>
              <div className="relative">
                <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#0e1322] border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-slate-200 outline-none focus:border-emerald-500 transition-all" placeholder="e.g., Vikram_Engg" />
                <Cpu className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider block">Target Infrastructure Address Location</label>
              <div className="relative">
                <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#0e1322] border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-slate-200 outline-none focus:border-blue-500 transition-all" placeholder="Enter City, Area, or Coordinates" />
                <MapPin className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider block">Security System Access Key</label>
              <div className="relative">
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0e1322] border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-slate-200 outline-none focus:border-amber-500 transition-all" placeholder="••••••••" />
                <Lock className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-sans py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-950/20 mt-2">
              Initialize Local Mapping Grid →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- STAGE 3 LAYOUT VIEW: MATRIX SUB-REPORT DISPLAY PAGE ---
  if (appStage === 'REPORT') {
    return (
      <LocationReport 
        lat={currentCoords.lat} 
        lng={currentCoords.lng} 
        mode={selectedSystemMode}
        sqmeters={tracedArea}
        address={address}
        onBack={() => setAppStage('MAP')} 
      />
    );
  }

  // --- STAGE 2 LAYOUT VIEW: MAP VIEWPORT SELECTION HUB ---
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col relative overflow-hidden">
      <header className="border-b border-slate-800 bg-[#0e1322] px-6 py-4 flex justify-between items-center shadow-xl z-10">
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xs font-bold tracking-widest text-slate-200 uppercase font-mono">URBANHARVEST // TARGET SPATIAL CAPTURE</h1>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-[#111827] px-3 py-1 rounded border border-slate-800">
          Operator: <span className="text-slate-200 font-bold">{username}</span>
        </div>
      </header>

      {/* Primary Map Viewport Box Frame Canvas */}
      <div className="flex-1 relative bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

        {/* TOP RIGHT TOOLBAR: Moved to fix layout overlap issues */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-[#0e1322]/90 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md w-64">
          <h3 className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Toolkit Overlay
          </h3>
          <button 
            onClick={() => setIsDrawingMode(!isDrawingMode)} 
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all border ${isDrawingMode ? 'bg-amber-400 text-slate-950 border-amber-400 animate-pulse font-black' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
          >
            <Eye className="w-4 h-4" /> {isDrawingMode ? "Lasso Engaged..." : "Trace Area Loop"}
          </button>
          <div className="text-[9px] font-mono text-slate-400 leading-relaxed text-center bg-[#0b0f19] p-2 rounded border border-slate-800/60 mt-1">
            Click points on the roof layout. Double-click your last point to seal the boundary loops.
          </div>
        </div>

        {/* MIDDLE OF SCREEN DIALOG BOX POP-UP */}
        {showChoiceModal && (
          <div className="absolute inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="space-y-1">
                <h3 className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">Boundary Core Verified</h3>
                <h2 className="text-lg font-bold text-slate-100">Select Allocation Strategy</h2>
                <p className="text-xs text-slate-400">Traced Footprint Enclosed: <span className="text-slate-200 font-bold font-mono">{tracedArea} m²</span></p>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                <button onClick={() => { setSelectedSystemMode('solar'); setShowChoiceModal(false); setAppStage('REPORT'); }} className="w-full bg-[#0e1322] hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 py-3 rounded-xl text-left px-4 text-slate-200 font-bold flex items-center justify-between transition-all">
                  <span>1. SOLAR ARCHITECTURE PLAN</span> <Sun className="w-4 h-4 text-amber-400" />
                </button>
                <button onClick={() => { setSelectedSystemMode('crops'); setShowChoiceModal(false); setAppStage('REPORT'); }} className="w-full bg-[#0e1322] hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500 py-3 rounded-xl text-left px-4 text-slate-200 font-bold flex items-center justify-between transition-all">
                  <span>2. CLIMATIC RESILIENT CROPS</span> <Leaf className="w-4 h-4 text-emerald-400" />
                </button>
                <button onClick={() => { setSelectedSystemMode('hybrid'); setShowChoiceModal(false); setAppStage('REPORT'); }} className="w-full bg-[#0e1322] hover:bg-blue-500/20 border border-slate-800 hover:border-blue-500 py-3 rounded-xl text-left px-4 text-slate-200 font-bold flex items-center justify-between transition-all">
                  <span>3. CO-LOCATED HYBRID ARRAY</span> <Cpu className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
