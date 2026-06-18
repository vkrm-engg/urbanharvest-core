import React from 'react';
import { Eye, EyeOff, Download, HelpCircle } from 'lucide-react';

/**
 * Floating Toolkit Control Overlay
 * Houses interactive action hooks for tracing bounding areas and exporting GeoJSON assets.
 */
export default function MapControls({ isDrawingMode, setIsDrawingMode, onExportGeoJSON }) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 bg-[#0e1322]/90 border border-slate-800 p-4 rounded-xl shadow-2xl backdrop-blur-md w-72">
      {/* Structural Header Meta */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
        <h3 className="text-[10px] font-mono font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Workspace Toolkit
        </h3>
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-800">
          v1.0.4-live
        </span>
      </div>

      {/* Primary Interaction Option Toggle */}
      <button 
        onClick={() => setIsDrawingMode(!isDrawingMode)} 
        className={`w-full flex items-center justify-center gap-2.5 px-3 py-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all border ${
          isDrawingMode 
            ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/10' 
            : 'bg-[#111827] text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
        }`}
      >
        {isDrawingMode ? (
          <>
            <EyeOff className="w-4 h-4 animate-spin text-slate-950" />
            Lasso Tool Engaged
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 text-emerald-400" />
            Activate Boundary Lasso
          </>
        )}
      </button>

      {/* Open Interoperability Feature Action */}
      <button
        onClick={onExportGeoJSON}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0b0f19] text-[10px] font-mono font-bold text-sky-400 border border-slate-800 rounded-lg hover:border-sky-500 hover:bg-[#0e1322] transition-all uppercase tracking-wider"
      >
        <Download className="w-3.5 h-3.5" />
        Export Plot Bounds (GeoJSON)
      </button>

      {/* Inline Context Guidance Documentation Panel */}
      <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800/80 mt-1 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          <HelpCircle className="w-3 h-3 text-slate-500" />
          Operator Log Instructions
        </div>
        <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
          Toggle the lasso, then click single vector vertices directly across your structure's outer roof profile parameters. <span className="text-slate-300 font-medium">Double-click</span> the final coordinates node loop point to close the boundary array.
        </p>
      </div>
    </div>
  );
}