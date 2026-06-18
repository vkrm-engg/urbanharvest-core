import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import MapWorkspace from './pages/MapWorkspace';
import { useReportStore } from './store/useReportStore';
import { ShieldAlert, X } from 'lucide-react';

export default function Dashboard() {
  const [unlockedZone, setUnlockedZone] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLaunchEngine = (locationData) => {
    try {
      const store = useReportStore.getState();
      store.setCoordinates({ lat: locationData.lat, lng: locationData.lon });
      store.setResolvedAddress(locationData.addressText);
      const code = locationData.pinCode || '560001';
      store.setPinCode(code);
      setUnlockedZone(code);
    } catch (err) {
      setErrorMessage("Critical state engine allocation fault.");
    }
  };

  const handleResetDashboard = () => {
    setUnlockedZone(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#02050d] relative">
      {!unlockedZone ? (
        <LandingPage onLaunchEngine={handleLaunchEngine} />
      ) : (
        <MapWorkspace targetPin={unlockedZone} onBack={handleResetDashboard} />
      )}

      {/* ERROR MODAL */}
      {errorMessage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0b1224] border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative">
            <button 
              onClick={() => setErrorMessage(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black tracking-widest font-mono text-white uppercase">
                  SYSTEM CORE FAULT
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-2 leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-slate-950 rounded-xl text-[11px] font-mono font-bold text-red-400 transition-all cursor-pointer"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}