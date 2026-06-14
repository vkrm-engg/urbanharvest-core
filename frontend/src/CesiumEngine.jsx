import React, { useEffect, useRef, useState } from 'react';
import { Viewer, Cartesian3, Color, Rectangle, ScreenSpaceEventHandler, ScreenSpaceEventType, CallbackProperty, ShadowMode, JulianDate } from 'cesium';
import "cesium/Source/Widgets/widgets.css";
import { Play, Pause, Square, Download } from 'lucide-react';

// Insert your free Cesium Ion Access Token here
window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';
const CESIUM_ION_TOKEN = "YOUR_FREE_CESIUM_ION_TOKEN";

export default function CesiumEngine({ onAreaSelected }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  
  // Selection Tool State Matrix
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPlayingShadows, setIsPlayingShadows] = useState(true);
  const [currentHour, setCurrentHour] = useState(12);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize the 3D Global Viewer with Real-World Shadows Enabled
    const viewer = new Viewer(containerRef.current, {
      terrainProvider: null, // Swap to CesiumTerrainProvider if elevation analysis is required
      animation: false,
      timeline: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: true, // Crucial: Activates the native shadow engine
    });
    
    viewerRef.current = viewer;

    // Enable high-fidelity soft shadows resembling Shadowmap.org
    viewer.shadowMap.enabled = true;
    viewer.shadowMap.softShadows = true;
    viewer.shadowMap.size = 2048; // Crisp shadow resolution maps

    // Fly camera view directly over your hackathon coordinate space (Chennai Core)
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(80.2707, 13.0827, 1500.0),
      orientation: { heading: 0.0, pitch: -0.78, roll: 0.0 }
    });

    // 2. Set up the Click-and-Drag Bounding Box Selection Mechanism
    let shadowRectangle = null;
    let firstPoint = null;
    let rectangleCoords = new Rectangle();

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Mouse Press Down Event Listener
    handler.setInputAction((click) => {
      if (!isDrawing) return;
      
      const ray = viewer.camera.getPickRay(click.position);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      
      if (cartesian) {
        firstPoint = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        
        // Remove old selection models
        if(shadowRectangle) viewer.entities.remove(shadowRectangle);

        // Add an elastic outline visualization layer box
        shadowRectangle = viewer.entities.add({
          rectangle: {
            coordinates: new CallbackProperty(() => rectangleCoords, false),
            material: Color.SKYBLUE.withAlpha(0.25),
            outline: true,
            outlineColor: Color.SKYBLUE,
            outlineWidth: 3,
            shadows: ShadowMode.DISABLED
          }
        });
      }
    }, ScreenSpaceEventType.LEFT_DOWN);

    // Mouse Movement Tracking Event Listener
    handler.setInputAction((movement) => {
      if (!isDrawing || !firstPoint) return;

      const ray = viewer.camera.getPickRay(movement.endPosition);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);

      if (cartesian) {
        const currentPoint = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        
        // Compute bounding box extremities on the fly
        rectangleCoords.west = Math.min(firstPoint.longitude, currentPoint.longitude);
        rectangleCoords.east = Math.max(firstPoint.longitude, currentPoint.longitude);
        rectangleCoords.south = Math.min(firstPoint.latitude, currentPoint.latitude);
        rectangleCoords.north = Math.max(firstPoint.latitude, currentPoint.latitude);
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // Mouse Click Release Event Listener
    handler.setInputAction(() => {
      if (!isDrawing || !firstPoint) return;
      
      // Dispatch boundaries back into top-level state components for metrics parsing
      if (onAreaSelected) {
        onAreaSelected({
          west: rectangleCoords.west * (180 / Math.PI),
          east: rectangleCoords.east * (180 / Math.PI),
          south: rectangleCoords.south * (180 / Math.PI),
          north: rectangleCoords.north * (180 / Math.PI),
        });
      }

      // Reset selection vector locks
      firstPoint = null;
      setIsDrawing(false);
    }, ScreenSpaceEventType.LEFT_UP);

    return () => {
      handler.destroy();
      viewer.destroy();
    };
  }, [isDrawing]);

  // 3. Dynamic Sun Vector Core Simulation Loop
  useEffect(() => {
    if (!viewerRef.current || !isPlayingShadows) return;

    let frameId;
    let hourOffset = currentHour;

    const runShadowTimelapse = () => {
      hourOffset = hourOffset >= 18 ? 6 : hourOffset + 0.04;
      setCurrentHour(hourOffset);

      // Create a Julian Date time structure matching the timeline clock cycle
      const baseDate = Date.UTC(2026, 5, 21, Math.floor(hourOffset), Math.floor((hourOffset % 1) * 60));
      viewerRef.current.clock.currentTime = JulianDate.fromDate(new Date(baseDate));

      frameId = requestAnimationFrame(runShadowTimelapse);
    };

    frameId = requestAnimationFrame(runShadowTimelapse);
    return () => cancelAnimationFrame(frameId);
  }, [isPlayingShadows]);

  // 4. Capture Frame Image Sequence Engine Functionality
  const captureAreaCanvasSequence = () => {
    if (!viewerRef.current) return;
    // Direct capture of the active WebGL rendering engine viewport
    const canvas = viewerRef.current.scene.canvas;
    const dataUrl = canvas.toDataURL("image/png");
    
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataUrl;
    downloadAnchor.download = `Heliomorphic_Analysis_Frame_${Math.floor(currentHour)}.png`;
    downloadAnchor.click();
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-[#0e1322] rounded-xl overflow-hidden border border-slate-800">
      {/* Floating Spatial Action Control Center Navbar Strip */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2 bg-[#0b0f19]/95 border border-slate-700 p-2 rounded-lg shadow-xl backdrop-blur-md">
        <button 
          onClick={() => setIsDrawing(true)} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${isDrawing ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
        >
          <Square className="w-3.5 h-3.5" /> {isDrawing ? "Drawing Active..." : "Select Custom Area Box"}
        </button>

        <button 
          onClick={() => setIsPlayingShadows(!isPlayingShadows)} 
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded flex items-center gap-1.5 font-mono text-xs tracking-wider"
        >
          {isPlayingShadows ? <Pause className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          TIME STUDY LOOP
        </button>

        <button 
          onClick={captureAreaCanvasSequence} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider"
        >
          <Download className="w-3.5 h-3.5" /> EXPORT AREA SNAPSHOT
        </button>
      </div>

      {/* Floating Simulated Time Data Readout Watermark */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[#0b0f19]/90 border border-slate-800 px-4 py-2 rounded-lg font-mono text-xs text-sky-400 shadow-md">
        SOLAR TIMELINE: {Math.floor(currentHour).toString().padStart(2, '0')}:{(Math.floor((currentHour % 1) * 60)).toString().padStart(2, '0')} {currentHour >= 12 ? 'PM' : 'AM'}
      </div>

      {/* Core WebGL Earth Container Canvas Viewport */}
      <div ref={containerRef} className="w-full flex-1" style={{ height: '550px' }} />
    </div>
  );
}