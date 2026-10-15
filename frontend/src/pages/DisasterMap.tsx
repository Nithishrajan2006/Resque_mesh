import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Navigation, 
  Home, 
  Boxes, 
  AlertTriangle, 
  Users,
  Grid,
  Map as MapIcon,
  RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapFeatures } from '../lib/api';
import { MapFeature } from '../types';

// Custom colored SVG pin markers for Leaflet without external asset dependencies
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 11px;
          font-weight: bold;
        ">${label}</span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
};

export const DisasterMap: React.FC = () => {
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'map' | 'offline-grid'>('map');
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);

  // Layer filters
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showDepots, setShowDepots] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showTeams, setShowTeams] = useState<boolean>(true);

  const centerLat = 40.7128;
  const centerLon = -74.0060;

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await getMapFeatures();
      setFeatures(res.data.features || []);
    } catch (err) {
      console.error('Failed to fetch map features:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const filteredFeatures = features.filter((f) => {
    if (f.feature_type === 'incident' && !showIncidents) return false;
    if (f.feature_type === 'shelter' && !showShelters) return false;
    if (f.feature_type === 'depot' && !showDepots) return false;
    if (f.feature_type === 'blocked_road' && !showRoads) return false;
    if (f.feature_type === 'team' && !showTeams) return false;
    return true;
  });

  const getMarkerIcon = (feat: MapFeature) => {
    switch (feat.feature_type) {
      case 'drone':
        return createCustomIcon('#a855f7', '🚁');
      case 'team':
        return createCustomIcon('#0284c7', '▲');
      case 'shelter':
        return createCustomIcon('#10b981', '⌂');
      case 'depot':
        return createCustomIcon('#8b5cf6', '📦');
      case 'blocked_road':
        return createCustomIcon('#0f172a', '✕');
      case 'incident':
      default:
        if (feat.severity === 'critical') return createCustomIcon('#ef4444', '!');
        if (feat.severity === 'high') return createCustomIcon('#f97316', '!');
        return createCustomIcon('#eab308', '!');
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto pb-16">
      {/* Top Banner and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            TACTICAL DISASTER SPATIAL MAP
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Offline spatial coordination • Fictional Millbrook Valley synthetic grid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center p-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition ${
                viewMode === 'map'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Leaflet Tile Map</span>
            </button>
            <button
              onClick={() => setViewMode('offline-grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition ${
                viewMode === 'offline-grid'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Offline Radar Grid</span>
            </button>
          </div>

          <button
            onClick={fetchFeatures}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 border border-white/[0.08]"
            title="Refresh Map Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Layer Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono shrink-0">
        <span className="text-slate-500 flex items-center gap-1 mr-2 text-[11px]">
          <Layers className="w-3.5 h-3.5" /> Layers:
        </span>

        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
            showIncidents
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-500 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400" />
          Incidents ({features.filter((f) => f.feature_type === 'incident').length})
        </button>

        <button
          onClick={() => setShowShelters(!showShelters)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
            showShelters
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-500 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Shelters ({features.filter((f) => f.feature_type === 'shelter').length})
        </button>

        <button
          onClick={() => setShowDepots(!showDepots)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
            showDepots
              ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-500 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          Depots ({features.filter((f) => f.feature_type === 'depot').length})
        </button>

        <button
          onClick={() => setShowRoads(!showRoads)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
            showRoads
              ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-500 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          Blockades ({features.filter((f) => f.feature_type === 'blocked_road').length})
        </button>

        <button
          onClick={() => setShowTeams(!showTeams)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
            showTeams
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-500 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Rescue Units ({features.filter((f) => f.feature_type === 'team').length})
        </button>
      </div>

      {/* Main Map View Container */}
      <div className="h-[600px] min-h-[480px] rounded-2xl overflow-hidden border border-white/[0.08] relative bg-[#071120]">
        {/* LIVE Indicator Overlay */}
        <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#071324]/90 backdrop-blur-md border border-cyan-500/30 text-xs font-mono shadow-xl pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold">MAP STATUS: LIVE</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300">P2P MESH POSITIONING</span>
        </div>

        {viewMode === 'map' ? (
          <MapContainer
            center={[centerLat, centerLon]}
            zoom={13}
            zoomControl={false}
            className="w-full h-full"
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Tactical 2km Response Perimeter Circle */}
            <Circle
              center={[centerLat, centerLon]}
              radius={2000}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.04,
                weight: 1,
                dashArray: '4, 4',
              }}
            />

            {/* Tactical Rescue Mission Dispatch Route (Animated Dash) */}
            <Polyline
              positions={[
                [centerLat + 0.012, centerLon - 0.015],
                [centerLat + 0.005, centerLon - 0.008],
                [centerLat, centerLon],
              ]}
              pathOptions={{
                color: '#10b981',
                weight: 3.5,
                dashArray: '8, 6',
                opacity: 0.85,
              }}
            />

            {/* Feature Markers */}
            {filteredFeatures.map((feat) => (
              <Marker
                key={feat.id}
                position={[feat.latitude, feat.longitude]}
                icon={getMarkerIcon(feat)}
                eventHandlers={{
                  click: () => setSelectedFeature(feat),
                }}
              >
                <Popup>
                  <div className="space-y-1.5 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase font-bold">
                        {feat.feature_type.replace('_', ' ')}
                      </span>
                      {feat.severity && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 uppercase">
                          {feat.severity}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-white">{feat.name}</div>
                    <p className="text-xs text-slate-300 leading-tight">
                      {feat.description || 'Synthetic position marker'}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      GPS: {feat.latitude.toFixed(4)}, {feat.longitude.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          /* Offline Tactical Radar / Fallback Grid View (Zero-Tile Fallback) */
          <div className="w-full h-full p-6 flex flex-col items-center justify-center relative overflow-hidden bg-[#050d1a]">
            {/* Radar Circular Grid Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-96 rounded-full border border-cyan-500/20" />
              <div className="w-[550px] h-[550px] rounded-full border border-cyan-500/10 absolute" />
              <div className="w-full h-[1px] bg-cyan-500/10 absolute" />
              <div className="h-full w-[1px] bg-cyan-500/10 absolute" />
            </div>

            <div className="absolute top-4 left-4 z-10 p-3 rounded-xl bg-black/60 border border-white/[0.08] backdrop-blur-md">
              <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <Grid className="w-4 h-4" /> ZERO-TILE OFFLINE VECTOR GRID
              </span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                Rendering local coordinates relative to Sector Center (40.7128°N, 74.0060°W). Operates with zero network tiles.
              </p>
            </div>

            {/* Tactical Grid Node Markers Canvas */}
            <div className="relative w-full max-w-2xl h-96 border border-cyan-500/30 rounded-xl bg-black/30 backdrop-blur-sm overflow-hidden">
              {filteredFeatures.map((feat) => {
                // Map lat/lon delta (-0.03 to +0.03) to 0% - 100%
                const deltaLat = feat.latitude - centerLat;
                const deltaLon = feat.longitude - centerLon;
                const topPct = Math.min(Math.max(50 - (deltaLat / 0.03) * 50, 5), 95);
                const leftPct = Math.min(Math.max(50 + (deltaLon / 0.03) * 50, 5), 95);

                return (
                  <div
                    key={feat.id}
                    onClick={() => setSelectedFeature(feat)}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg transition-transform group-hover:scale-150 ${
                        feat.feature_type === 'incident'
                          ? 'bg-red-500 ring-2 ring-red-400/50 animate-pulse'
                          : feat.feature_type === 'shelter'
                          ? 'bg-cyan-500 ring-2 ring-cyan-400/50'
                          : feat.feature_type === 'depot'
                          ? 'bg-violet-500 ring-2 ring-violet-400/50'
                          : feat.feature_type === 'team'
                          ? 'bg-emerald-500 ring-2 ring-emerald-400/50'
                          : 'bg-orange-500'
                      }`}
                    >
                      {feat.feature_type[0].toUpperCase()}
                    </div>
                    <div className="hidden group-hover:block absolute left-5 top-0 z-20 whitespace-nowrap p-2 rounded-lg bg-black/90 border border-white/20 text-[10px] text-white">
                      <div className="font-bold">{feat.name}</div>
                      <div className="text-slate-400">{feat.feature_type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Marker Details Drawer */}
        {selectedFeature && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[1000] glass-card bg-[#0a1628]/95 border-cyan-500/40 p-4 shadow-2xl space-y-2.5 animate-slide-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                  {selectedFeature.feature_type.replace('_', ' ')}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedFeature.name}</h3>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedFeature.description || 'Synthetic disaster simulation feature.'}
            </p>

            <div className="pt-2 border-t border-white/[0.08] text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-cyan-300">
                  {selectedFeature.latitude.toFixed(4)}, {selectedFeature.longitude.toFixed(4)}
                </span>
              </div>
              {selectedFeature.distance_from_center !== undefined && (
                <div className="flex justify-between">
                  <span>Distance to HQ:</span>
                  <span className="text-slate-200">{selectedFeature.distance_from_center} km</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Integrity:</span>
                <span className="text-emerald-400">✓ Mesh Synchronized</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
