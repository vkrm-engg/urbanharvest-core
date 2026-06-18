import React from 'react';
import { Sun, Leaf, Cpu } from 'lucide-react';

export default function StrategyModal({ isOpen, tracedArea, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="space-y-1">
          <h3 className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">Boundary Core Verified</h3>
          <h2 className="text-lg font-bold text-slate-100">Select Allocation Strategy</h2>
          <p className="text-xs text-slate-400">
            Traced Footprint Enclosed: <span className="text-slate-200 font-bold font-mono">{tracedArea} m²</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 font-mono text-xs">
          <button 
            onClick={() => onSelect('solar')} 
            className="w-full bg-[#0e1322] hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 py-3 rounded-xl text-left px-4 text-slate-200 font-bold flex items-center justify-between transition-all"
          >
            <span>1. SOLAR ARCHITECTURE PLAN</span> <Sun className="w-4 h-4 text-amber-400" />
          </button>
          
          <button 
            onClick={() => onSelect('crops')} 
            className="w-full bg-[#0e1322] hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500 py-3 rounded-xl text-left px-4 text-slate-200 font-bold flex items-center justify-between transition-all"
          >
            <span>2. CLIMATIC RESILIENT CROPS</span> <Leaf className="w-4 h-4 text-emerald-400" />
          </button>
          
          <button 
            onClick={() => onSelect('hybrid')} 
            className="w-full bg-[#0e1322] hover:bg-blue-500/20 border border-slate-800 hover:border-blue-500 py-3 rounded-xl text-left px-4 text-slate-200 font-bold flex items-center justify-between transition-all"
          >
            <span>3. CO-LOCATED HYBRID ARRAY</span> <Cpu className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );
}