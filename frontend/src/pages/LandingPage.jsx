import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Globe, ShieldCheck, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export default function LandingPage({ onLaunchEngine }) {
  const [activeTab, setActiveTab] = useState('address'); // 'address' | 'pincode'
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // PIN Code verification states
  const [pinCode, setPinCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(null);

  const dropdownRef = useRef(null);

  // Close recommendations dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPredictions([]);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // OpenStreetMap Nominatim Address Autocomplete Query Stream
  useEffect(() => {
    if (activeTab !== 'address' || searchQuery.trim().length < 3) {
      setPredictions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`,
          {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'UrbanHarvestCore/1.0' }
          }
        );
        const data = await response.json();
        setPredictions(data);
      } catch (err) {
        console.error("Geocoding fetch pipeline failure:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  // Handle PIN Code Verification & Geocoding
  const handlePinVerify = async (e) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);
    const cleanPin = pinCode.trim();

    // Indian PINs are strictly 6 numeric digits
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(cleanPin)) {
      setPinError(`"${cleanPin}" does not follow valid 6-digit formatting guidelines.`);
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Verify against Open Government Postal Registry Mirror
      const postalUrl = `https://api.postalpincode.in/pincode/${cleanPin}`;
      const postalRes = await fetch(postalUrl);
      if (!postalRes.ok) throw new Error("Government registry node latency timeout.");
      
      const postalData = await postalRes.json();
      const isValidPin = postalData && postalData[0] && postalData[0].Status === "Success";

      if (!isValidPin) {
        setPinError(`PIN Code ${cleanPin} was not found inside the official Open Government Data postal registry files.`);
        setIsVerifying(false);
        return;
      }

      const postOfficeInfo = postalData[0].PostOffice[0];
      const regionName = `${postOfficeInfo.Name}, ${postOfficeInfo.District}, ${postOfficeInfo.State}, India`;
      setPinSuccess(`Verified! District: ${postOfficeInfo.District} (${postOfficeInfo.State})`);

      // 2. Geocode PIN Code to get Coordinates
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanPin}&country=India&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'UrbanHarvestCore/1.0' }
      });
      const geoData = await geoRes.json();

      let lat = 13.0827; // Fallback coordinates
      let lon = 80.2707;
      let addressText = regionName;

      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lon = parseFloat(geoData[0].lon);
        addressText = `${cleanPin} - ${geoData[0].display_name}`;
      }

      // Delay transition briefly so user sees the verification checkmark
      setTimeout(() => {
        onLaunchEngine({
          addressText,
          lat,
          lon,
          pinCode: cleanPin
        });
      }, 1000);

    } catch (err) {
      setPinError("Government verification link failure. Please check internet telemetry.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#02050d] text-slate-100 flex flex-col justify-center items-center relative font-sans overflow-hidden p-6">
      {/* Animated Matrix cyber-grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] opacity-70 pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-8 z-10 relative">

        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-console text-cyan-400 font-bold tracking-[0.25em] uppercase bg-cyan-500/10 border border-cyan-400/30 px-3.5 py-1.5 rounded-full text-glow-cyan">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            UrbanHarvest Portal
          </span>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight pt-2 font-tech glitch-wrapper">
            <span className="glitch bg-gradient-to-r from-cyan-400 via-emerald-400 to-pink-500 bg-clip-text text-transparent text-glow-cyan" data-text="ROOFTOP RESOURCE OPTIMISATION">
              ROOFTOP RESOURCE OPTIMISATION
            </span>
          </h1>
          
          <p className="text-slate-400 text-xs md:text-sm font-console max-w-lg mx-auto pt-2 leading-relaxed uppercase tracking-wider">
            Search for an address or enter a postal PIN code to start evaluating rooftop solar and agricultural potential.
          </p>
        </div>

        {/* Liquid Glass Tab Selection */}
        <div className="flex justify-center gap-2 max-w-sm mx-auto bg-slate-950/80 border border-cyan-500/20 rounded-xl p-1.5 font-console text-[10px] tracking-widest uppercase shadow-[inset_0_0_12px_rgba(0,240,255,0.05)]">
          <button
            onClick={() => { setActiveTab('address'); setSearchQuery(''); setPredictions([]); setPinError(null); setPinSuccess(null); }}
            className={`flex-1 py-2.5 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'address'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-glow-cyan shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Address Search
          </button>
          <button
            onClick={() => { setActiveTab('pincode'); setPinCode(''); setPinError(null); setPinSuccess(null); }}
            className={`flex-1 py-2.5 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'pincode'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-glow-cyan shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Postal PIN Code
          </button>
        </div>

        {/* Tab 1: Address Autocomplete Panel */}
        {activeTab === 'address' && (
          <div ref={dropdownRef} className="w-full max-w-lg mx-auto relative font-console text-left">
            <div className="liquid-glass neon-border-cyan rounded-xl p-4 flex items-center gap-3.5 transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Local region..."
                className="bg-transparent text-xs text-white placeholder-slate-600 outline-none w-full tracking-widest uppercase font-console"
              />
              {isSearching && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />}
            </div>

            {/* Recommendations Dropdown */}
            {predictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 liquid-glass border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8)] z-50 text-left max-h-64 overflow-y-auto divide-y divide-cyan-500/10">
                {predictions.map((item, index) => {
                  const pCode = item.address ? item.address.postcode : null;
                  return (
                    <button
                      key={index}
                      onClick={() => onLaunchEngine({
                        addressText: item.display_name,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                        pinCode: pCode
                      })}
                      className="w-full px-5 py-3.5 text-left hover:bg-cyan-500/10 text-[10px] text-slate-300 hover:text-white flex items-start gap-3 transition-all duration-200 cursor-pointer uppercase tracking-wider"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="truncate leading-tight">{item.display_name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: OGD PIN Code Verification Panel */}
        {activeTab === 'pincode' && (
          <form onSubmit={handlePinVerify} className="w-full max-w-lg mx-auto relative font-console text-left space-y-4">
            <div className="liquid-glass neon-border-cyan rounded-xl p-4 flex items-center gap-3.5 transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit postal PIN code..."
                className="bg-transparent text-xs text-white placeholder-slate-600 outline-none w-full tracking-widest uppercase font-console"
              />
              <button
                type="submit"
                disabled={isVerifying || pinCode.length !== 6}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 rounded-lg text-[10px] font-bold tracking-widest hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 uppercase font-tech"
              >
                {isVerifying ? 'VERIFYING...' : 'VERIFY'}
              </button>
            </div>

            {/* Error State */}
            {pinError && (
              <div className="p-3.5 bg-pink-950/20 border border-pink-500/30 rounded-xl text-left text-pink-400 text-[10px] flex items-start gap-2.5 animate-fadeIn shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-pink-500" />
                <span className="uppercase tracking-wider leading-relaxed">{pinError}</span>
              </div>
            )}

            {/* Success State */}
            {pinSuccess && (
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-left text-emerald-400 text-[10px] flex items-start gap-2.5 animate-fadeIn shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse animate-bounce" />
                <span className="uppercase tracking-wider leading-relaxed text-glow-green">{pinSuccess}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
