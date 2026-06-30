'use client';

import 'leaflet/dist/leaflet.css';
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  useMap,
  Marker,
  Rectangle,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import configuredBasemaps, { defaultBasemapId } from '../config/basemaps';
import configuredLayers from '../config/layers';

const basemapsById = Object.fromEntries(
  configuredBasemaps.map((basemap) => [basemap.id, basemap])
);

const layersById = Object.fromEntries(
  configuredLayers.map((layer) => [layer.id, layer])
);

function isLayerVisibleAtZoom(layerId, zoom) {
  const minZoom = layersById[layerId]?.minZoom;
  return minZoom === null || minZoom === undefined || zoom >= minZoom;
}

function isLayerLabelVisibleAtZoom(layerId, zoom) {
  const labelMinZoom = layersById[layerId]?.labelMinZoom;
  return (
    labelMinZoom !== null &&
    labelMinZoom !== undefined &&
    zoom >= labelMinZoom
  );
}

function getLayerSymbol(layerId) {
  return layersById[layerId]?.symbol || {};
}

function getStyleByProperty(layerId, styleId, propertyValue) {
  const styleRule = layersById[layerId]?.styleByProperty?.find(
    (rule) => rule.id === styleId
  );

  return (
    styleRule?.values?.[propertyValue] ||
    styleRule?.default ||
    {}
  );
}

// Copy button component for coordinates
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-gray-100 rounded transition-colors"
      title={`Kopier ${label}`}
    >
      {copied ? (
        <svg
          className="w-3.5 h-3.5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

// Coordinate display component with copy buttons
function CoordinateDisplay({ coordinates, utmX, utmY }) {
  const wgs84Coords = `${coordinates[1].toFixed(
    6
  )}, ${coordinates[0].toFixed(6)}`;
  const utmCoords =
    utmX && utmY ? `${utmX.toFixed(2)}, ${utmY.toFixed(2)}` : null;

  return (
    <div className="mt-3 pt-2 border-t border-gray-200 space-y-2">
      {/* WGS84 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 font-medium">
            WGS84 (GPS)
          </div>
          <div className="text-[11px] text-gray-600 font-mono">
            {wgs84Coords}
          </div>
        </div>
        <CopyButton text={wgs84Coords} label="WGS84" />
      </div>

      {/* UTM32N */}
      {utmCoords && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-500 font-medium">
              UTM Zone 32N (EUREF89)
            </div>
            <div className="text-[11px] text-gray-600 font-mono">
              {utmCoords}
            </div>
          </div>
          <CopyButton text={utmCoords} label="UTM32N" />
        </div>
      )}
    </div>
  );
}
// import MarkerClusterGroup from 'react-leaflet-cluster';

function FlyTo({ coords, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const currentZoom = map.getZoom();
    // Only zoom in, never zoom out - use max of current zoom and target zoom
    const targetZoom = Math.max(currentZoom, zoom);
    map.flyTo([coords[1], coords[0]], targetZoom, { duration: 0.8 });
  }, [coords, zoom, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    const handleClick = () => {
      onMapClick && onMapClick();
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  return null;
}

function ZoomLevelDisplay({ onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    // Set initial zoom
    onZoomChange(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// Component to auto-open popup when feature is selected from sidebar
function AutoOpenPopup({ selectedFeature }) {
  const map = useMap();
  const lastOpenedFid = useRef(null);

  useEffect(() => {
    if (!selectedFeature) {
      lastOpenedFid.current = null;
      return;
    }

    // Only works for Point geometries (prv_punkt, ult_punkt)
    if (selectedFeature.geometry?.type !== 'Point') return;

    const fid = selectedFeature.properties?.fid;
    // Only trigger for new selections (avoid re-opening on same feature)
    if (fid === lastOpenedFid.current) return;
    lastOpenedFid.current = fid;

    const targetCoords = selectedFeature.geometry.coordinates;
    const targetLat = targetCoords[1];
    const targetLng = targetCoords[0];

    // Wait for map to finish flying
    const timer = setTimeout(() => {
      // Find the layer that matches our selected feature's coordinates
      map.eachLayer((layer) => {
        if (layer.getPopup && layer.getPopup() && layer.getLatLng) {
          const layerLatLng = layer.getLatLng();
          // Check if coordinates match (within small tolerance for floating point)
          if (
            Math.abs(layerLatLng.lat - targetLat) < 0.0000001 &&
            Math.abs(layerLatLng.lng - targetLng) < 0.0000001
          ) {
            layer.openPopup();
          }
        }
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [selectedFeature, map]);

  return null;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Format distance for display
function formatDistance(meters) {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

// Available label positions (8 directions like a compass)
const LABEL_POSITIONS = [
  { x: 1, y: -1, angle: -45 }, // top-right
  { x: 1, y: 0, angle: 0 }, // right
  { x: 1, y: 1, angle: 45 }, // bottom-right
  { x: 0, y: 1, angle: 90 }, // bottom
  { x: -1, y: 1, angle: 135 }, // bottom-left
  { x: -1, y: 0, angle: 180 }, // left
  { x: -1, y: -1, angle: -135 }, // top-left
  { x: 0, y: -1, angle: -90 }, // top
];

// Calculate the best label position for a point based on nearby points
// This positions the label away from clusters of nearby points
function getBestLabelOffset(
  currentCoords,
  allPoints,
  currentIndex,
  baseDistance = 22
) {
  const [currentLng, currentLat] = currentCoords;

  // Find nearby points (within ~100m at typical zoom levels)
  const nearbyThreshold = 0.001; // roughly 100m in degrees
  const nearbyPoints = allPoints.filter((p, idx) => {
    if (idx === currentIndex) return false;
    const [lng, lat] = p.geometry.coordinates;
    const dx = lng - currentLng;
    const dy = lat - currentLat;
    return Math.sqrt(dx * dx + dy * dy) < nearbyThreshold;
  });

  // If no nearby points, use default top-right
  if (nearbyPoints.length === 0) {
    return {
      x: baseDistance,
      y: -baseDistance,
    };
  }

  // Calculate the "center of mass" of nearby points relative to current point
  let avgDx = 0,
    avgDy = 0;
  nearbyPoints.forEach((p) => {
    const [lng, lat] = p.geometry.coordinates;
    avgDx += lng - currentLng;
    avgDy += lat - currentLat;
  });
  avgDx /= nearbyPoints.length;
  avgDy /= nearbyPoints.length;

  // The angle pointing AWAY from the cluster of nearby points
  const awayAngle = Math.atan2(-avgDy, -avgDx) * (180 / Math.PI);

  // Find the closest predefined position to this angle
  let bestPosition = LABEL_POSITIONS[0];
  let smallestAngleDiff = 360;

  LABEL_POSITIONS.forEach((pos) => {
    let angleDiff = Math.abs(pos.angle - awayAngle);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    if (angleDiff < smallestAngleDiff) {
      smallestAngleDiff = angleDiff;
      bestPosition = pos;
    }
  });

  return {
    x: bestPosition.x * baseDistance,
    y: bestPosition.y * baseDistance,
  };
}

// Measure tool component
function MeasureTool({
  isActive,
  onMeasurement,
  onCancel,
  addPointRef,
}) {
  const [points, setPoints] = useState([]);
  const [mousePosition, setMousePosition] = useState(null);
  const map = useMap();

  // Function to add a measurement point (can be called externally via ref)
  const addPoint = (latlng) => {
    if (!isActive) return;

    if (points.length === 0) {
      setPoints([latlng]);
      onMeasurement({ points: [latlng], distance: null });
    } else if (points.length === 1) {
      const distance = calculateDistance(
        points[0].lat,
        points[0].lng,
        latlng.lat,
        latlng.lng
      );
      setPoints([points[0], latlng]);
      onMeasurement({ points: [points[0], latlng], distance });
      setMousePosition(null);
    } else {
      // Reset and start new measurement
      setPoints([latlng]);
      onMeasurement({ points: [latlng], distance: null });
    }
  };

  // Expose addPoint function via ref
  useEffect(() => {
    if (addPointRef) {
      addPointRef.current = addPoint;
    }
    return () => {
      if (addPointRef) {
        addPointRef.current = null;
      }
    };
  });

  // Change cursor when measure mode is active
  useEffect(() => {
    const container = map.getContainer();
    if (isActive) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
    return () => {
      container.style.cursor = '';
    };
  }, [isActive, map]);

  // Handle Escape key to cancel measurement
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel && onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onCancel]);

  useMapEvents({
    click: (e) => {
      if (!isActive) return;
      addPoint(e.latlng);
    },
    contextmenu: (e) => {
      // Right-click cancels measurement
      if (isActive) {
        e.originalEvent.preventDefault();
        onCancel && onCancel();
      }
    },
    mousemove: (e) => {
      // Only track mouse when we have one point (waiting for second click)
      if (isActive && points.length === 1) {
        setMousePosition(e.latlng);
      }
    },
  });

  // Calculate live distance while mouse is moving
  const liveDistance =
    points.length === 1 && mousePosition
      ? calculateDistance(
          points[0].lat,
          points[0].lng,
          mousePosition.lat,
          mousePosition.lng
        )
      : null;

  // Update measurement with live distance (must be in useEffect to avoid updating parent during render)
  useEffect(() => {
    if (liveDistance !== null) {
      onMeasurement({
        points: [points[0]],
        distance: liveDistance,
        isLive: true,
      });
    }
  }, [liveDistance, points, onMeasurement]);

  if (!isActive || points.length === 0) return null;

  return (
    <>
      {/* First point marker */}
      <CircleMarker
        center={points[0]}
        radius={6}
        pathOptions={{
          color: '#4782cb',
          fillColor: '#4782cb',
          fillOpacity: 1,
          weight: 2,
        }}
      />

      {/* Dynamic line following mouse (when waiting for second point) */}
      {points.length === 1 && mousePosition && (
        <Polyline
          positions={[points[0], mousePosition]}
          pathOptions={{
            color: '#4782cb',
            weight: 2,
            dashArray: '5, 5',
            opacity: 0.7,
          }}
        />
      )}

      {/* Second point and final line */}
      {points.length === 2 && (
        <>
          <CircleMarker
            center={points[1]}
            radius={6}
            pathOptions={{
              color: '#4782cb',
              fillColor: '#4782cb',
              fillOpacity: 1,
              weight: 2,
            }}
          />
          <Polyline
            positions={[points[0], points[1]]}
            pathOptions={{
              color: '#4782cb',
              weight: 3,
              dashArray: '10, 5',
            }}
          />
        </>
      )}
    </>
  );
}

export default function Map({
  selectedFeature,
  onSelect,
  allLayers = {},
  activeLayer = 'prv_punkt',
}) {
  const [basemap, setBasemap] = useState(defaultBasemapId);
  const [currentZoom, setCurrentZoom] = useState(11);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureKey, setMeasureKey] = useState(0);
  const [measurement, setMeasurement] = useState(null);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDataType, setExportDataType] = useState('prv_punkt');
  const [exportFormat, setExportFormat] = useState('geojson');

  // Ref to hold the addMeasurePoint function from MeasureTool
  const addMeasurePointRef = useRef(null);

  // Export data function
  const handleExport = () => {
    const data =
      exportDataType === 'prv_punkt'
        ? allLayers.prv_punkt
        : allLayers.ult_punkt;

    if (!data || data.length === 0) {
      alert('Ingen data å eksportere');
      return;
    }

    let content, filename, mimeType;

    if (exportFormat === 'geojson') {
      // Create GeoJSON FeatureCollection
      const geojson = {
        type: 'FeatureCollection',
        name:
          exportDataType === 'prv_punkt'
            ? 'prøvetakingspunkter'
            : 'overløpspunkter',
        features: data.map((f) => ({
          type: 'Feature',
          properties: { ...f.properties },
          geometry: f.geometry,
        })),
      };
      content = JSON.stringify(geojson, null, 2);
      filename = `${
        exportDataType === 'prv_punkt'
          ? 'provetakingspunkter'
          : 'overlopspunkter'
      }.geojson`;
      mimeType = 'application/geo+json';
    } else {
      // Create CSV with semicolon delimiter (Excel-friendly for Norwegian locale)
      const headers =
        exportDataType === 'prv_punkt'
          ? [
              'fid',
              'navn',
              'vannlok-kode',
              'PSID',
              'vannprøve',
              'sedimentprøve',
              'Bløtbunnsfauna',
              'DATEREG',
              'utm_x',
              'utm_y',
              'lng',
              'lat',
            ]
          : [
              'fid',
              'REF',
              'STATION',
              'PSID',
              'DATEREG',
              'utm_x',
              'utm_y',
              'lng',
              'lat',
            ];

      const rows = data.map((f) => {
        const p = f.properties;
        const coords = f.geometry.coordinates;
        if (exportDataType === 'prv_punkt') {
          return [
            p.fid || '',
            `"${(p.navn || '').replace(/"/g, '""')}"`,
            `"${(p['vannlok-kode'] || '')
              .replace(/"/g, '""')
              .trim()}"`,
            p.PSID || '',
            p.vannprøve ? 'Ja' : 'Nei',
            p.sedimentprøve ? 'Ja' : 'Nei',
            p.Bløtbunnsfauna ? 'Ja' : 'Nei',
            p.DATEREG || '',
            p.utm_x || '',
            p.utm_y || '',
            coords[0],
            coords[1],
          ].join(';');
        } else {
          return [
            p.fid || '',
            `"${(p.REF || '').replace(/"/g, '""')}"`,
            `"${(p.STATION || '').replace(/"/g, '""')}"`,
            p.PSID || '',
            p.DATEREG || '',
            p.utm_x || '',
            p.utm_y || '',
            coords[0],
            coords[1],
          ].join(';');
        }
      });

      // Add UTF-8 BOM for proper Norwegian character support in Excel
      const BOM = '\uFEFF';
      content = BOM + [headers.join(';'), ...rows].join('\n');
      filename = `${
        exportDataType === 'prv_punkt'
          ? 'provetakingspunkter'
          : 'overlopspunkter'
      }.csv`;
      mimeType = 'text/csv;charset=utf-8';
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
  };

  // Toggle measure mode
  const toggleMeasure = () => {
    if (isMeasuring) {
      setIsMeasuring(false);
      setMeasurement(null);
      setMeasureKey((k) => k + 1); // Reset the MeasureTool component
    } else {
      setIsMeasuring(true);
      onSelect && onSelect(null); // Deselect any feature
    }
  };

  // Handler for when a feature is clicked during measuring
  const handleMeasureClick = (latlng) => {
    if (addMeasurePointRef.current) {
      addMeasurePointRef.current(latlng);
    }
  };

  // Combine all layers for rendering on the map, adding layer source to each feature.
  const allFeatures = configuredLayers
    .slice()
    .sort((a, b) => a.renderOrder - b.renderOrder)
    .flatMap((layer) =>
      (allLayers[layer.id] || []).map((f, idx) => ({
        ...f,
        _layer: layer.id,
        _index: idx,
      }))
    );

  // Compute initial center and zoom to fit bounds
  const pointFeatures = allFeatures.filter(
    (f) => f.geometry.type === 'Point'
  );
  const latlngs = pointFeatures.map((f) => [
    f.geometry.coordinates[1],
    f.geometry.coordinates[0],
  ]);
  const center = latlngs.length ? latlngs[0] : [59.2, 10.4];

  const selectedBasemap =
    basemapsById[basemap] || basemapsById[defaultBasemapId];

  return (
    <div className="h-full relative">
      {/* TEMP: Zoom Level Display - REMOVE WHEN DONE */}
      {/* <div className="absolute top-4 left-4 z-1000 bg-pink-500 text-white font-bold rounded-lg shadow-lg p-3 text-2xl">
        ZOOM: {currentZoom.toFixed(1)}
      </div> */}

      {/* Basemap selector */}
      <div
        className="absolute top-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-3 border"
        style={{ borderColor: '#e5e7eb' }}
      >
        <label
          className="text-xs font-semibold block mb-2"
          style={{ color: '#656263' }}
        >
          Bakgrunnskart
        </label>
        <select
          value={basemap}
          onChange={(e) => setBasemap(e.target.value)}
          className="text-sm rounded px-2 py-1.5 bg-white cursor-pointer w-full border"
          style={{ borderColor: '#4782cb', color: '#656263' }}
        >
          {configuredBasemaps.map((configuredBasemap) => (
            <option key={configuredBasemap.id} value={configuredBasemap.id}>
              {configuredBasemap.label}
            </option>
          ))}
        </select>
      </div>

      {/* Verktøy (Tools) menu - collapsible toolbox */}
      <div className="absolute bottom-8 left-4 z-1000 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Toolbox toggle button */}
          <button
            onClick={() => setIsToolboxOpen(!isToolboxOpen)}
            className={`flex items-center gap-2 px-3 py-2 transition-colors ${
              isToolboxOpen || isMeasuring ? '' : 'hover:bg-gray-50'
            }`}
            style={{
              color: isMeasuring ? '#4782cb' : '#656263',
              backgroundColor: isToolboxOpen
                ? '#f9fafb'
                : 'transparent',
            }}
            title="Verktøy"
          >
            {/* Toolbox icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
              />
            </svg>
            {isToolboxOpen && (
              <span className="text-xs font-semibold">Verktøy</span>
            )}
            {isToolboxOpen && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>

          {/* Expanded tools panel */}
          {isToolboxOpen && (
            <div className="border-t border-gray-200">
              <button
                onClick={toggleMeasure}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                  isMeasuring ? 'text-white' : 'hover:bg-gray-50'
                }`}
                style={
                  isMeasuring
                    ? { backgroundColor: '#4782cb', color: 'white' }
                    : { color: '#656263' }
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {/* Ruler/measure icon */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 6h18M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6M3 6l3 0m0 0v4m0-4l3 0m0 0v2m0-2l3 0m0 0v4m0-4l3 0m0 0v2m0-2l3 0m0 0v4"
                  />
                </svg>
                {isMeasuring ? 'Avslutt måling' : 'Mål avstand'}
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors hover:bg-gray-50"
                style={{ color: '#656263' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Eksporter data
              </button>
            </div>
          )}
        </div>

        {/* Measurement result display */}
        {isMeasuring && (
          <div
            className="bg-white rounded-lg shadow-lg p-3 border min-w-[140px]"
            style={{ borderColor: '#4782cb' }}
          >
            <div
              className="text-xs font-semibold mb-1"
              style={{ color: '#4782cb' }}
            >
              Avstandsmåling
            </div>
            {measurement?.distance ? (
              <div
                className="text-lg font-bold"
                style={{ color: '#656263' }}
              >
                {formatDistance(measurement.distance)}
              </div>
            ) : (
              <div className="text-xs" style={{ color: '#656263' }}>
                {measurement?.points?.length === 1
                  ? 'Klikk på sluttpunkt'
                  : 'Klikk på startpunkt'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-8 right-4 z-1000 bg-white rounded-lg shadow-lg p-3 border"
        style={{ borderColor: '#e5e7eb' }}
      >
        <div
          className="text-xs font-semibold mb-2"
          style={{ color: '#656263' }}
        >
          Tegnforklaring
        </div>
        <div className="space-y-1.5 text-xs">
          {/* Prøvetakingspunkt heading */}
          <div
            className="font-semibold mt-1"
            style={{ color: '#656263' }}
          >
            Prøvetakingspunkt
          </div>
          <div className="ml-2 space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full bg-fuchsia-400 border-2"
                style={{ borderColor: '#c026d3' }}
              ></div>
              <span style={{ color: '#656263' }}>Færder kommune</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full bg-fuchsia-400 border-2"
                style={{ borderColor: '#22c55e' }}
              ></div>
              <span style={{ color: '#656263' }}>
                Tønsberg kommune
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full bg-fuchsia-400 border-2"
                style={{ borderColor: '#ff4500' }}
              ></div>
              <span style={{ color: '#656263' }}>
                Tønsberg renseanlegg
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="w-3 h-3 bg-orange-400 border-2 border-orange-600"></div>
            <span style={{ color: '#656263' }}>Overløpspunkt</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="4" className="flex-shrink-0">
              <line
                x1="0"
                y1="2"
                x2="24"
                y2="2"
                stroke="#22c55e"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
            </svg>
            <span style={{ color: '#656263' }}>SPO ledning</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="4" className="flex-shrink-0">
              <line
                x1="0"
                y1="2"
                x2="24"
                y2="2"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
            </svg>
            <span style={{ color: '#656263' }}>AFO ledning</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={11}
        maxZoom={19}
        style={{ height: '100%', minHeight: '500px' }}
      >
        <MapClickHandler
          onMapClick={() => onSelect && onSelect(null)}
        />
        <ZoomLevelDisplay onZoomChange={setCurrentZoom} />
        <TileLayer
          key={basemap}
          attribution={selectedBasemap.attribution}
          url={selectedBasemap.tileUrl}
          maxZoom={19}
          maxNativeZoom={selectedBasemap.maxNativeZoom}
        />

        {/* Render lines (not clustered) - hide at configured min zoom */}
        {allFeatures
            .filter(
              (f) =>
                (f.geometry.type === 'LineString' ||
                  f.geometry.type === 'MultiLineString') &&
                isLayerVisibleAtZoom(f._layer, currentZoom)
            )
            .map((f) => {
              const isSelected =
                selectedFeature &&
                selectedFeature.properties &&
                selectedFeature.properties.fid === f.properties.fid;

              // Create unique key using layer and index
              const uniqueKey = `${f._layer}-${f._index}`;

              // Render lines (MultiLineString or LineString)
              let positions;
              if (f.geometry.type === 'MultiLineString') {
                // MultiLineString has nested arrays
                positions = f.geometry.coordinates.map((lineCoords) =>
                  lineCoords.map((coord) => [coord[1], coord[0]])
                );
              } else {
                // LineString is a single array of coordinates
                positions = f.geometry.coordinates.map((coord) => [
                  coord[1],
                  coord[0],
                ]);
              }

              // Line styling based on FCODE
              const fcode = f.properties.FCODE;
              const lineSymbol = getLayerSymbol(f._layer);
              const lineStyle = getStyleByProperty(
                f._layer,
                'lineByFcode',
                fcode
              );
              const lineColor = lineStyle.color || lineSymbol.color;
              const lineDash =
                lineStyle.dashArray || lineSymbol.dashArray;

              return (
                <React.Fragment key={uniqueKey}>
                  {/* Glow effect for selected line */}
                  {isSelected && (
                    <Polyline
                      positions={positions}
                      pathOptions={{
                        color: lineSymbol.selectedGlowColor,
                        weight: lineSymbol.selectedWeight,
                        opacity: 0.4,
                        dashArray: lineDash,
                      }}
                    />
                  )}
                  {/* Actual line */}
                  <Polyline
                    positions={positions}
                    pathOptions={{
                      color: lineColor,
                      weight: lineSymbol.weight,
                      opacity: lineSymbol.opacity,
                      dashArray: lineDash,
                    }}
                    eventHandlers={{
                      click: (e) => {
                        if (e.originalEvent) {
                          e.originalEvent.stopPropagation();
                        }
                        if (!isMeasuring) {
                          onSelect && onSelect(f);
                        }
                      },
                    }}
                  >
                    {!isMeasuring && (
                      <Popup>
                        <div className="min-w-48">
                          <div
                            className="font-semibold text-sm pb-2 mb-2 border-b border-gray-200"
                            style={{ color: '#4782cb' }}
                          >
                            {f.properties.FCODE || 'Ledning'}
                          </div>
                          <table className="text-xs w-full">
                            <tbody className="text-gray-600">
                              <tr>
                                <td className="py-0.5 pr-3 font-medium">
                                  LSID
                                </td>
                                <td className="py-0.5">
                                  {f.properties.LSID}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-0.5 pr-3 font-medium">
                                  Lengde
                                </td>
                                <td className="py-0.5">
                                  {f.properties.LENGTH?.toFixed(0) ||
                                    '?'}{' '}
                                  m
                                </td>
                              </tr>
                              <tr>
                                <td className="py-0.5 pr-3 font-medium">
                                  Materiale
                                </td>
                                <td className="py-0.5">
                                  {f.properties.MATERIAL || 'Ukjent'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-0.5 pr-3 font-medium">
                                  Dimensjon
                                </td>
                                <td className="py-0.5">
                                  {f.properties.DIM || '?'} mm
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-blue-500">
                            Overløpsledning
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Polyline>
                </React.Fragment>
              );
            })}

        {/* Render points (clustering temporarily disabled) */}
        {/* <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={80}
          disableClusteringAtZoom={16}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            // Scale size based on count, but keep it reasonable
            const size = Math.min(40 + Math.sqrt(count) * 4, 80);
            return L.divIcon({
              html: `<div style="background-color: #22c55e; color: white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
              className: 'custom-cluster-icon',
              iconSize: [size, size],
            });
          }}
        > */}
        <>
          {(() => {
            // Get all visible point features for label collision detection
            const visiblePoints = allFeatures
              .filter((f) => f.geometry.type === 'Point')
              .filter(
                (f) => isLayerVisibleAtZoom(f._layer, currentZoom)
              );

            return visiblePoints.map((f, visibleIndex) => {
              const isSelected =
                selectedFeature &&
                selectedFeature.properties &&
                selectedFeature.properties.fid === f.properties.fid;

              // Create unique key using layer and index
              const uniqueKey = `${f._layer}-${f._index}`;

              // Render points with different styles based on layer
              const { coordinates } = f.geometry;
              const latlng = [coordinates[1], coordinates[0]];

              const fcode = f.properties.FCODE;
              const isOverflow = fcode === 'OVL' || f.properties.FUNC;
              const pointSymbol = getLayerSymbol(f._layer);
              const pointColor = pointSymbol.strokeColor;
              const pointFillColor = pointSymbol.fillColor;
              const pointRadius = pointSymbol.radius;

              // Owner-based stroke color (keep same thickness/style, only vary color)
              const owner = (f.properties.Eier || '').trim();
              const ownerStyle = getStyleByProperty(
                f._layer,
                'owner',
                owner
              );
              const strokeColor = ownerStyle.strokeColor || pointColor;

              // For overflow points, use a square marker (DivIcon)
              if (isOverflow) {
                const size = pointRadius * 2.1; // Convert radius to pixel size
                const glowSize = size + 14;
                const icon = L.divIcon({
                  html: `<div style="background-color: ${pointFillColor}; border: 2px solid ${strokeColor}; width: ${size}px; height: ${size}px;"></div>`,
                  className: 'square-marker',
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                });

                // Label text - use REF only
                const labelText = f.properties.REF || '';
                const showLabel =
                  isLayerLabelVisibleAtZoom(f._layer, currentZoom) &&
                  labelText;

                // Get label offset based on nearby points - position away from clusters
                const labelOffset = getBestLabelOffset(
                  coordinates,
                  visiblePoints,
                  visibleIndex,
                  22
                );
                const labelOffsetX = labelOffset.x;
                const labelOffsetY = labelOffset.y;
                // Calculate text position based on offset direction
                const textLeft =
                  labelOffset.x < 0
                    ? `${
                        labelOffsetX - 3
                      }px; text-align: right; transform: translateX(-100%)`
                    : `${labelOffsetX + 3}px`;
                const textTop =
                  labelOffset.y < 0
                    ? labelOffsetY - 10
                    : labelOffsetY + 2;

                return (
                  <React.Fragment key={uniqueKey}>
                    {/* Glow effect for selected square point */}
                    {isSelected && (
                      <Marker
                        position={latlng}
                        icon={L.divIcon({
                          html: `<div style="background-color: #fbbf24; opacity: 0.2; border: 3px solid #fbbf24; width: ${glowSize}px; height: ${glowSize}px;"></div>`,
                          className: 'square-marker-glow',
                          iconSize: [glowSize, glowSize],
                          iconAnchor: [glowSize / 2, glowSize / 2],
                        })}
                      />
                    )}
                    {/* Label with connecting line for overflow points at zoom >= 14 */}
                    {showLabel && (
                      <Marker
                        position={latlng}
                        icon={L.divIcon({
                          html: `
                            <div style="position: relative; pointer-events: none; font-family: inherit;">
                              <svg style="position: absolute; left: 0; top: 0; overflow: visible;" width="1" height="1">
                                <line x1="0" y1="0" x2="${labelOffsetX}" y2="${labelOffsetY}" 
                                  stroke="#fff" stroke-width="3" stroke-opacity="0.9"/>
                                <line x1="0" y1="0" x2="${labelOffsetX}" y2="${labelOffsetY}" 
                                  stroke="#333" stroke-width="1.5" stroke-opacity="0.8"/>
                              </svg>
                              <div style="
                                position: absolute;
                                left: ${textLeft};
                                top: ${textTop}px;
                                white-space: nowrap;
                                font-family: inherit;
                                font-size: 13px;
                                font-weight: 600;
                                color: #1f2937;
                                text-shadow: 
                                  -1px -1px 0 #fff,
                                  1px -1px 0 #fff,
                                  -1px 1px 0 #fff,
                                  1px 1px 0 #fff,
                                  0 -1px 0 #fff,
                                  0 1px 0 #fff,
                                  -1px 0 0 #fff,
                                  1px 0 0 #fff,
                                  -2px 0 3px rgba(255,255,255,0.9),
                                  2px 0 3px rgba(255,255,255,0.9),
                                  0 -2px 3px rgba(255,255,255,0.9),
                                  0 2px 3px rgba(255,255,255,0.9);
                              ">${labelText}</div>
                            </div>
                          `,
                          className: 'overflow-label',
                          iconSize: [0, 0],
                          iconAnchor: [0, 0],
                        })}
                        interactive={false}
                      />
                    )}
                    {/* Actual square point */}
                    <Marker
                      position={latlng}
                      icon={icon}
                      eventHandlers={{
                        click: (e) => {
                          if (e.originalEvent) {
                            e.originalEvent.stopPropagation();
                          }
                          if (isMeasuring) {
                            // When measuring, add this point to measurement
                            // Use the marker's actual position, not the click event position
                            handleMeasureClick(
                              L.latLng(latlng[0], latlng[1])
                            );
                          } else {
                            onSelect && onSelect(f);
                          }
                        },
                      }}
                    >
                      {!isMeasuring && (
                        <Popup>
                          <div className="min-w-52">
                            <div
                              className="font-semibold text-sm pb-2 mb-2 border-b border-gray-200"
                              style={{ color: '#4782cb' }}
                            >
                              {f.properties.navn ||
                                f.properties.REF ||
                                'Overløpspunkt'}
                            </div>
                            <table className="text-xs w-full">
                              <tbody className="text-gray-600">
                                {f.properties.PSID && (
                                  <tr>
                                    <td className="py-0.5 pr-3 font-medium">
                                      PSID
                                    </td>
                                    <td className="py-0.5">
                                      {f.properties.PSID}
                                    </td>
                                  </tr>
                                )}
                                {f.properties.STATION && (
                                  <tr>
                                    <td className="py-0.5 pr-3 font-medium">
                                      Stasjon
                                    </td>
                                    <td className="py-0.5">
                                      {f.properties.STATION}
                                    </td>
                                  </tr>
                                )}
                                {f.properties.FUNC && (
                                  <tr>
                                    <td className="py-0.5 pr-3 font-medium">
                                      Funksjon
                                    </td>
                                    <td className="py-0.5">
                                      {f.properties.FUNC}
                                    </td>
                                  </tr>
                                )}
                                {f.properties.DATEREG && (
                                  <tr>
                                    <td className="py-0.5 pr-3 font-medium">
                                      Registrert
                                    </td>
                                    <td className="py-0.5">
                                      {f.properties.DATEREG}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                            <CoordinateDisplay
                              coordinates={f.geometry.coordinates}
                              utmX={f.properties.utm_x}
                              utmY={f.properties.utm_y}
                            />
                            <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-blue-500">
                              Overløpspunkt
                            </div>
                          </div>
                        </Popup>
                      )}
                    </Marker>
                  </React.Fragment>
                );
              }

              // For sampling points, use circle markers
              // Label text for prøvetakingspunkt - use navn
              const prvLabelText = f.properties.navn || '';
              const showPrvLabel =
                isLayerLabelVisibleAtZoom(f._layer, currentZoom) &&
                prvLabelText;

              // Get label offset based on nearby points - position away from clusters
              const prvLabelOffset = getBestLabelOffset(
                coordinates,
                visiblePoints,
                visibleIndex,
                22
              );
              const prvLabelOffsetX = prvLabelOffset.x;
              const prvLabelOffsetY = prvLabelOffset.y;
              // Calculate text position based on offset direction
              const prvTextLeft =
                prvLabelOffset.x < 0
                  ? `${
                      prvLabelOffsetX - 3
                    }px; text-align: right; transform: translateX(-100%)`
                  : `${prvLabelOffsetX + 3}px`;
              const prvTextTop =
                prvLabelOffset.y < 0
                  ? prvLabelOffsetY - 10
                  : prvLabelOffsetY + 2;

              return (
                <React.Fragment key={uniqueKey}>
                  {/* Glow effect for selected point */}
                  {isSelected && (
                    <CircleMarker
                      center={latlng}
                      radius={pointRadius + 7}
                      pathOptions={{
                        color: pointSymbol.selectedGlowColor,
                        fillColor: pointSymbol.selectedGlowColor,
                        weight: 3,
                        opacity: 0.5,
                        fillOpacity: 0.2,
                      }}
                    />
                  )}
                  {/* Label with connecting line for prøvetakingspunkt at zoom >= 14 */}
                  {showPrvLabel && (
                    <Marker
                      position={latlng}
                      icon={L.divIcon({
                        html: `
                          <div style="position: relative; pointer-events: none; font-family: inherit;">
                            <svg style="position: absolute; left: 0; top: 0; overflow: visible;" width="1" height="1">
                              <line x1="0" y1="0" x2="${prvLabelOffsetX}" y2="${prvLabelOffsetY}" 
                                stroke="#fff" stroke-width="3" stroke-opacity="0.9"/>
                              <line x1="0" y1="0" x2="${prvLabelOffsetX}" y2="${prvLabelOffsetY}" 
                                stroke="#333" stroke-width="1.5" stroke-opacity="0.8"/>
                            </svg>
                            <div style="
                              position: absolute;
                              left: ${prvTextLeft};
                              top: ${prvTextTop}px;
                              white-space: nowrap;
                              font-family: inherit;
                              font-size: 13px;
                              font-weight: 600;
                              color: #1f2937;
                              text-shadow: 
                                -1px -1px 0 #fff,
                                1px -1px 0 #fff,
                                -1px 1px 0 #fff,
                                1px 1px 0 #fff,
                                0 -1px 0 #fff,
                                0 1px 0 #fff,
                                -1px 0 0 #fff,
                                1px 0 0 #fff,
                                -2px 0 3px rgba(255,255,255,0.9),
                                2px 0 3px rgba(255,255,255,0.9),
                                0 -2px 3px rgba(255,255,255,0.9),
                                0 2px 3px rgba(255,255,255,0.9);
                            ">${prvLabelText}</div>
                          </div>
                        `,
                        className: 'prv-label',
                        iconSize: [0, 0],
                        iconAnchor: [0, 0],
                      })}
                      interactive={false}
                    />
                  )}
                  {/* Actual point */}
                  <CircleMarker
                    center={latlng}
                    radius={pointRadius}
                    pathOptions={{
                      color: strokeColor,
                      fillColor: pointFillColor,
                      weight: pointSymbol.strokeWidth,
                      opacity: 1,
                      fillOpacity: pointSymbol.fillOpacity,
                    }}
                    eventHandlers={{
                      click: (e) => {
                        if (e.originalEvent) {
                          e.originalEvent.stopPropagation();
                        }
                        if (isMeasuring) {
                          // When measuring, add this point to measurement
                          handleMeasureClick(
                            L.latLng(latlng[0], latlng[1])
                          );
                        } else {
                          onSelect && onSelect(f);
                        }
                      },
                    }}
                  >
                    {!isMeasuring && (
                      <Popup>
                        <div className="min-w-56">
                          <div
                            className="font-semibold text-sm pb-2 mb-2 border-b border-gray-200"
                            style={{ color: '#4782cb' }}
                          >
                            {f.properties.navn || 'Prøvetakingspunkt'}
                          </div>
                          <table className="text-xs w-full">
                            <tbody className="text-gray-600">
                              {f.properties['vannlok-kode'] && (
                                <tr>
                                  <td className="py-0.5 pr-3 font-medium">
                                    Vannlokalitetkode
                                  </td>
                                  <td className="py-0.5">
                                    {f.properties[
                                      'vannlok-kode'
                                    ].trim()}
                                  </td>
                                </tr>
                              )}
                              {f.properties.PSID && (
                                <tr>
                                  <td className="py-0.5 pr-3 font-medium">
                                    PSID
                                  </td>
                                  <td className="py-0.5">
                                    {f.properties.PSID}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td className="py-0.5 pr-3 font-medium align-top">
                                  Prøvetyper
                                </td>
                                <td className="py-0.5 whitespace-normal">
                                  {[
                                    f.properties.vannprøve && 'Vann',
                                    f.properties.sedimentprøve &&
                                      'Sediment',
                                    f.properties.Bløtbunnsfauna &&
                                      'Bløtbunn',
                                  ]
                                    .filter(Boolean)
                                    .join(', ') || (
                                    <span className="italic">
                                      Ingen registrert
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {f.properties.DATEREG && (
                                <tr>
                                  <td className="py-0.5 pr-3 font-medium">
                                    Registrert
                                  </td>
                                  <td className="py-0.5">
                                    {f.properties.DATEREG}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          <CoordinateDisplay
                            coordinates={f.geometry.coordinates}
                            utmX={f.properties.utm_x}
                            utmY={f.properties.utm_y}
                          />
                          <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-blue-500">
                            Prøvetakingspunkt
                          </div>
                        </div>
                      </Popup>
                    )}
                  </CircleMarker>
                </React.Fragment>
              );
            });
          })()}
        </>
        {/* </MarkerClusterGroup> */}

        {/* Fly to selected feature when it changes */}
        {selectedFeature && selectedFeature.geometry.coordinates && (
          <FlyTo
            coords={
              selectedFeature.geometry.type === 'Point'
                ? selectedFeature.geometry.coordinates
                : selectedFeature.geometry.coordinates[0][0]
            }
            zoom={16}
          />
        )}

        {/* Auto-open popup when feature is selected from sidebar */}
        <AutoOpenPopup selectedFeature={selectedFeature} />

        {/* Measure tool */}
        {isMeasuring && (
          <MeasureTool
            key={measureKey}
            isActive={isMeasuring}
            onMeasurement={setMeasurement}
            onCancel={toggleMeasure}
            addPointRef={addMeasurePointRef}
          />
        )}
      </MapContainer>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-80 max-w-[90vw]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3
                className="text-sm font-semibold"
                style={{ color: '#656263' }}
              >
                Eksporter data
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Data type selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Velg datatype
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dataType"
                      value="prv_punkt"
                      checked={exportDataType === 'prv_punkt'}
                      onChange={(e) =>
                        setExportDataType(e.target.value)
                      }
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Prøvetakingspunkter
                    </span>
                    <span className="text-xs text-gray-400">
                      ({allLayers.prv_punkt?.length || 0})
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dataType"
                      value="ult_punkt"
                      checked={exportDataType === 'ult_punkt'}
                      onChange={(e) =>
                        setExportDataType(e.target.value)
                      }
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Overløpspunkter
                    </span>
                    <span className="text-xs text-gray-400">
                      ({allLayers.ult_punkt?.length || 0})
                    </span>
                  </label>
                </div>
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Velg format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="geojson"
                      checked={exportFormat === 'geojson'}
                      onChange={(e) =>
                        setExportFormat(e.target.value)
                      }
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      GeoJSON
                    </span>
                    <span className="text-xs text-gray-400">
                      (.geojson)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) =>
                        setExportFormat(e.target.value)
                      }
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700">CSV</span>
                    <span className="text-xs text-gray-400">
                      (.csv)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs font-medium text-white rounded transition-colors"
                style={{ backgroundColor: '#4782cb' }}
              >
                Last ned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
