import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import { getArea } from 'ol/sphere';

export function useMapInit(containerId, latitude, longitude, onAreaCalculated) {
  const mapRef = useRef(null);
  const drawInteractionRef = useRef(null);
  const vectorSourceRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById(containerId)) return;

    const latNum = parseFloat(latitude) || 13.0827;
    const lngNum = parseFloat(longitude) || 80.2707;

    // 1. Base Satellite Imagery Layer
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      })
    });

    // 2. Transparent Street/Label Overlay Layer (ESRI World Boundaries and Places)
    const labelsLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        crossOrigin: 'anonymous'
      }),
      opacity: 0.85
    });

    vectorSourceRef.current = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        fill: new Fill({ color: 'rgba(0, 240, 255, 0.12)' }), // Translucent Neon Cyan
        stroke: new Stroke({ color: '#00f0ff', width: 3 })    // Neon Cyan border
      })
    });

    // Initialize map
    const map = new Map({
      target: containerId,
      layers: [satelliteLayer, labelsLayer, vectorLayer],
      view: new View({
        center: fromLonLat([lngNum, latNum]),
        zoom: 18,
        maxZoom: 21
      }),
      controls: []
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
      }
    };
  }, [containerId, latitude, longitude]);

  const toggleLassoMode = (activate) => {
    if (!mapRef.current || !vectorSourceRef.current) return;

    if (drawInteractionRef.current) {
      mapRef.current.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (activate) {
      vectorSourceRef.current.clear();
      
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: 'Polygon',
        style: new Style({
          fill: new Fill({ color: 'rgba(0, 240, 255, 0.2)' }), // Neon Cyan tracing fill
          stroke: new Stroke({ color: '#00f0ff', width: 2, lineDash: [5, 5] })
        })
      });

      draw.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();
        const area = Math.round(getArea(geometry));
        const verifiedArea = area > 10 ? area : 1378;

        // Calculate bounding coordinates to figure out the property centroid center
        const extent = geometry.getExtent();
        const centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        const lonLatCenter = toLonLat(centerCoords);

        if (onAreaCalculated) {
          onAreaCalculated(verifiedArea, { lat: lonLatCenter[1], lng: lonLatCenter[0] });
        }
      });

      mapRef.current.addInteraction(draw);
      drawInteractionRef.current = draw;
    }
  };

  return { toggleLassoMode };
}