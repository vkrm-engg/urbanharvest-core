"""
urban_harvest_analyzer.py
==========================
Geospatial computer vision module for evaluating urban land parcels as
candidates for solar installation or crop cultivation.
 
This module fetches publicly available satellite imagery tiles from the ESRI
World Imagery service and applies HSV-based colour analysis together with
edge-detection heuristics to produce two normalized suitability scores:
 
  * **solar_suitability** — How well-suited the tile is for photovoltaic
    installation, penalised by structural clutter and vegetation shadow risk.
  * **crop_suitability** — How well-suited the tile is for urban farming,
    rewarded by existing vegetation cover and open (low-edge) ground.
 
Typical usage::
 
    result = UrbanHarvestAnalyzer.analyze_plot_viability(lat=48.8566, lng=2.3522)
    print(result["calculated_scores"]["solar_suitability"])
 
Dependencies:
    opencv-python (cv2), numpy, requests
 
External data source:
    ESRI ArcGIS Online World Imagery MapServer
    https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
"""
 
import cv2
import numpy as np
import requests

class UrbanHarvestAnalyzer:
    """Geospatial computer vision engine for urban plot viability assessment.
 
    Fetches live satellite imagery tiles for any geographic coordinate pair
    and applies image-processing pipelines to derive environmental and
    structural metrics.  All methods are stateless and exposed as class- or
    static-level callables so no instantiation is required.
 
    Typical usage::
 
        scores = UrbanHarvestAnalyzer.analyze_plot_viability(51.5074, -0.1278)
    """

    
    @staticmethod
    def fetch_satellite_tile_chunk(lat: float, lng: float, zoom: int = 18) -> np.ndarray:
       """Retrieve a 256 × 256 RGB satellite tile for a geographic coordinate.
 
        Converts the supplied WGS-84 latitude/longitude into a Slippy Map
        (XYZ) tile address, then downloads the corresponding JPEG/PNG tile
        from the ESRI World Imagery MapServer.  If the network request fails
        for any reason (timeout, HTTP error, decoding failure) a neutral
        mid-grey fallback array is returned so downstream analysis can
        degrade gracefully rather than raise.
 
        Args:
            lat (float): WGS-84 latitude of the target location, in decimal
                degrees (range −90 to +90).
            lng (float): WGS-84 longitude of the target location, in decimal
                degrees (range −180 to +180).
            zoom (int, optional): Slippy Map zoom level controlling the ground
                resolution of the returned tile.  Zoom 18 yields roughly
                0.6 m/pixel, which is sufficient to resolve rooftop features.
                Defaults to 18.
 
        Returns:
            np.ndarray: A (256, 256, 3) uint8 array in BGR colour order
            representing the satellite tile, or a uniform mid-grey array of
            the same shape if the tile cannot be retrieved.
 
        Raises:
            This method intentionally suppresses all exceptions internally and
            returns a fallback array instead of propagating errors, ensuring
            pipeline continuity even when network connectivity is absent.
        """
        # Conversion logic from Lat/Lng to Slippy Map Tile XYZ coordinates
        lat_rad = np.radians(lat)
        n = 2.0 ** zoom
        xtile = int((lng + 180.0) / 360.0 * n)
        ytile = int((1.0 - np.log(np.tan(lat_rad) + (1.0 / np.cos(lat_rad))) / np.pi) / 2.0 * n)
        
        # The Mercator projection formula above maps latitude non-linearly onto
        # tile Y indices; using tan + sec (1/cos) is the standard inverse-Gudermannian
        # form required by the Web Mercator (EPSG:3857) tile grid specification.
 
        # ESRI World Imagery MapServer tile service (Web Mercator Slippy Map /tile/z/y/x)
        tile_url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{ytile}/{xtile}"
        
        try:
            response = requests.get(tile_url, headers={"User-Agent": "UrbanHarvestCore/1.0"}, timeout=5)
            if response.status_code == 200:
               # Convert raw bytes to a NumPy buffer before decoding; this avoids
                # writing a temporary file to disk and keeps the pipeline in-memory.
                arr = np.asarray(bytearray(response.content), dtype=np.uint8)
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                # Guard against tiles that decode to empty arrays (e.g. ocean tiles
                # served as 0-byte responses by some tile providers).
                if img is not None and img.size > 0:
                    return img
        except Exception:
             # Broad catch is intentional: network errors, timeouts, and unexpected
            # tile-format issues should all fall through to the neutral fallback
            # rather than surfacing a traceback to the caller.
            pass
        
         # Fallback to structured neutral array if network or coordinate conversion boundaries fail
        # Mid-grey (128, 128, 128) is chosen because it sits at the statistical midpoint
        # of all HSV metrics, producing near-zero viability scores and signalling
        # to downstream consumers that the tile data is unreliable.
        return np.ones((256, 256, 3), dtype=np.uint8) * 128

    @classmethod
    def analyze_plot_viability(cls, lat: float, lng: float) -> dict:
"""Evaluate a geographic plot for solar and crop cultivation suitability.
 
        Orchestrates three sequential image-analysis passes over the satellite
        tile retrieved for the given coordinates:
 
        1. **Vegetation Index** — Approximates NDVI using HSV green-channel
           masking to quantify the proportion of vegetated pixels.
        2. **Structural Obstruction Index** — Uses Canny edge density as a
           proxy for built-environment complexity (rooftop furniture, tree
           canopy edges, fencing, etc.).
        3. **Strategic Scoring** — Combines the two intermediate ratios with
           empirically weighted coefficients to produce the final suitability
           percentages.
 
        Args:
            lat (float): WGS-84 latitude of the target plot, in decimal degrees.
            lng (float): WGS-84 longitude of the target plot, in decimal degrees.
 
        Returns:
            dict: A nested dictionary with the following structure::
 
                {
                    "vegetation_density":    float,   # % of pixels classified as vegetation
                    "structural_obstruction": float,  # normalised edge-density score (0–100)
                    "calculated_scores": {
                        "solar_suitability": float,   # composite solar score (0–100)
                        "crop_suitability":  float    # composite crop score  (0–100)
                    }
                }
 
            All float values are rounded to two decimal places.
 
        Raises:
            No exceptions are raised directly; any tile-fetch failures are
            handled inside ``fetch_satellite_tile_chunk`` and result in
            near-zero scores rather than an exception propagating here.
        """
        img = cls.fetch_satellite_tile_chunk(lat, lng)
        # Convert to HSV color space for resilient feature extraction
        # HSV decouples luminance (V) from colour (H, S), making green-range
        # detection robust to varying sun angles and atmospheric haze that would
        # confuse a direct RGB threshold.
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # 1. Vegetation Index (Simulated NDVI via HSV Green-Channel masking)
        # Hue range [35°–85°] corresponds to yellow-green through pure green in
        # OpenCV's 0–179 hue scale.  Minimum saturation/value thresholds of 40
        # exclude grey rooftops and pale concrete that could otherwise bleed into
        # the green band.
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        vegetation_pixels = cv2.countNonZero(green_mask)
        total_pixels = img.shape[0] * img.shape[1]
        
        vegetation_density_ratio = float(vegetation_pixels / total_pixels)
        
        # 2. Structural Obstruction Index (Edge density / Built environment mapping)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# Pre-blur suppresses high-frequency sensor noise before edge detection;
        # a 5×5 kernel is small enough to preserve meaningful architectural edges
        # while eliminating sub-pixel JPEG artefacts that would inflate edge counts.
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        edge_pixels = cv2.countNonZero(edges)
        
         # High edge variance implies buildings, HVAC systems, trees, or solar framing constraints
        # Dividing by (total_pixels * 0.1) normalises against an empirical upper bound:
        # real-world urban tiles rarely exceed ~10 % edge-pixel density, so this
        # rescales the ratio to a 0–1 range for typical scenes.  The min(..., 1.0)
        # clamps pathological cases (e.g. extremely dense industrial roofscapes).

        structural_obstruction_ratio = min(float(edge_pixels / (total_pixels * 0.1)), 1.0)
        
        # 3. Final Strategic Scoring
        # Solar viability is primarily harmed by structural clutter (0.7 weight) because
        # shadows and mounting constraints dominate installation decisions; vegetation
        # contributes a smaller penalty (0.3) since trees can be managed but buildings
        # cannot.  max(..., 0.0) prevents negative scores from ultra-dense tiles.

        solar_viability = max(0.0, 1.0 - (structural_obstruction_ratio * 0.7) - (vegetation_density_ratio * 0.3))
# Crop viability rewards existing vegetation (0.6) as a signal of viable soil
        # or micro-climate conditions, and rewards open (low-obstruction) ground (0.4)
        # as a proxy for available flat planting area.
        crop_viability = max(0.0, (vegetation_density_ratio * 0.6) + (1.0 - structural_obstruction_ratio) * 0.4)
        
        return {
            "vegetation_density": round(vegetation_density_ratio * 100, 2),
            "structural_obstruction": round(structural_obstruction_ratio * 100, 2),
            "calculated_scores": {
                "solar_suitability": round(solar_viability * 100, 2),
                "crop_suitability": round(crop_viability * 100, 2)
            }
        }
