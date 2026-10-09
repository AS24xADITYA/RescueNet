'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

function MapAutoResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

// Fix for default marker icon in Leaflet + Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 100% Free, No-API-Key Tile Providers (No watermarks)
const TILE_PROVIDERS = {
  dark: {
    name: 'Tactical Dark',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  },
  osm: {
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

const API_BASE = "http://localhost:8000";

// Node type → color mapping for distinct visual identification
const NODE_COLORS: Record<string, { stroke: string; fill: string; label: string }> = {
  RESCUE_BASE: { stroke: '#06b6d4', fill: '#0891b2', label: '🏢 Rescue Base' },
  SHELTER:     { stroke: '#22c55e', fill: '#16a34a', label: '🏕️ Relief Shelter' },
  HOSPITAL:    { stroke: '#3b82f6', fill: '#2563eb', label: '🏥 Trauma Hospital' },
  DISASTER_ZONE: { stroke: '#ef4444', fill: '#dc2626', label: '⚠️ Disaster Hazard' },
  CITY:        { stroke: '#f59e0b', fill: '#d97706', label: '🏙️ Transit Junction' },
};

interface NodeData {
  id: string;
  name?: string;
  type: string;
  lat: number;
  lng: number;
  degree: number;
}

interface RoadData {
  id: string;
  from_node_id: string;
  to_node_id: string;
  weight: number;
  capacity: number;
  status: string;
  bidirectional: boolean;
}

interface RouteResult {
  accessible: boolean;
  distance?: number;
  path?: string[];
}

export default function RescueMap() {
  // Geographic Center of Mumbai - Pune Metropolitan corridor
  const defaultCenter: [number, number] = [18.84, 73.35]; 
  const [tileTheme, setTileTheme] = useState<'dark' | 'osm'>('dark');
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [roads, setRoads] = useState<RoadData[]>([]);
  const [maxFlowData, setMaxFlowData] = useState<any>(null);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routeSource, setRouteSource] = useState('M4');
  const [routeTarget, setRouteTarget] = useState('P4');
  const [flowSource, setFlowSource] = useState('M4');
  const [flowSink, setFlowSink] = useState('P1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build node lookup map for coordinate resolution
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [nodesRes, roadsRes] = await Promise.all([
        fetch(`${API_BASE}/api/nodes`),
        fetch(`${API_BASE}/api/roads`),
      ]);
      if (!nodesRes.ok || !roadsRes.ok) throw new Error('Failed to load network data');
      const nodesData = await nodesRes.json();
      const roadsData = await roadsRes.json();
      setNodes(nodesData);
      setRoads(roadsData);

      if (nodesData.length > 0) {
        if (!nodesData.some((n: any) => n.id === routeSource)) setRouteSource(nodesData[0].id);
        if (!nodesData.some((n: any) => n.id === routeTarget)) setRouteTarget(nodesData[nodesData.length - 1].id);
      }
    } catch (e) {
      setError('Could not connect to backend. Is the server running on port 8000?');
      console.error('Failed to load network data:', e);
    } finally {
      setLoading(false);
    }
  }, [routeSource, routeTarget]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Listen for WebSocket events to refresh data
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws');
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.event === 'ROAD_TOGGLED') {
            fetch(`${API_BASE}/api/roads`).then(r => r.json()).then(setRoads).catch(() => {});
          }
        };
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch { /* retry on next timer */ }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const getRoadPath = (road: RoadData): [number, number][] => {
    const from = nodeMap.get(road.from_node_id);
    const to = nodeMap.get(road.to_node_id);
    if (!from || !to) return [];
    return [[from.lat, from.lng], [to.lat, to.lng]];
  };

  const toggleRoad = async (fromId: string, toId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/roads/${fromId}/${toId}/toggle`, { method: 'POST' });
      if (res.ok) {
        const roadsRes = await fetch(`${API_BASE}/api/roads`);
        if (roadsRes.ok) setRoads(await roadsRes.json());
      }
    } catch (e) {
      console.error('Failed to toggle road:', e);
    }
  };

  const fetchMaxFlow = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/advanced/max-flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: flowSource, sink: flowSink })
      });
      if (res.ok) setMaxFlowData(await res.json());
    } catch (e) {
      console.error('Max-flow computation failed:', e);
    }
  };

  const fetchRoute = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: routeSource, target: routeTarget })
      });
      if (res.ok) setRouteData(await res.json());
    } catch (e) {
      console.error('Route computation failed:', e);
    }
  };

  const isBottleneck = (from: string, to: string) => {
    if (!maxFlowData || !maxFlowData.bottleneck_edges) return false;
    return maxFlowData.bottleneck_edges.some((edge: any) => edge[0] === from && edge[1] === to);
  };

  const isOnRoute = (from: string, to: string) => {
    if (!routeData || !routeData.path || routeData.path.length < 2) return false;
    for (let i = 0; i < routeData.path.length - 1; i++) {
      if (
        (routeData.path[i] === from && routeData.path[i + 1] === to) ||
        (routeData.path[i] === to && routeData.path[i + 1] === from)
      ) return true;
    }
    return false;
  };

  const getNodeStyle = (type: string) => NODE_COLORS[type] || NODE_COLORS.CITY;

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700/50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-700 rounded-full border-t-cyan-500 animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading regional topology...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] bg-slate-900 rounded-xl flex items-center justify-center border border-red-500/30">
        <div className="text-center px-8">
          <p className="text-red-400 font-medium mb-2">⚠️ Connection Error</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 text-sm transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 relative">
      {/* Control Panels */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 max-w-[320px]">
        {/* Route Finder */}
        <div className="bg-slate-900/95 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-600 text-sm">
          <div className="text-cyan-400 font-bold mb-2 text-xs uppercase tracking-wider flex items-center justify-between">
            <span>Dijkstra Shortest Route</span>
            <span className="text-[10px] text-slate-500 font-mono">O((V+E)logV)</span>
          </div>
          <div className="space-y-1.5 mb-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Origin (Source):</label>
              <select value={routeSource} onChange={e => setRouteSource(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 outline-none">
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id}: {n.name || n.type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Destination (Target):</label>
              <select value={routeTarget} onChange={e => setRouteTarget(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 outline-none">
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id}: {n.name || n.type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={fetchRoute} className="w-full bg-cyan-600/90 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
            Calculate Optimal Route
          </button>
          {routeData && (
            <div className="mt-2.5 pt-2 border-t border-slate-700/70 text-xs">
              {routeData.accessible ? (
                <>
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                    <span>✓ Evacuation Path:</span>
                  </div>
                  <div className="text-cyan-300 text-[11px] leading-relaxed max-h-24 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                    {routeData.path?.map((id, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-mono text-[9px]">{idx + 1}.</span>
                        <span className="font-semibold text-slate-200">{nodeMap.get(id)?.name || id}</span>
                        <span className="text-slate-500 font-mono text-[9px]">({id})</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1.5 pt-1 border-t border-slate-800 flex justify-between">
                    <span>Cumulative Distance:</span>
                    <span className="text-cyan-300 font-bold font-mono">{routeData.distance} km</span>
                  </div>
                </>
              ) : (
                <div className="text-red-400 text-xs font-semibold">✗ No accessible route (path is severed by road blocks)</div>
              )}
            </div>
          )}
        </div>

        {/* Max-Flow */}
        <div className="bg-slate-900/95 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-600 text-sm">
          <div className="text-red-400 font-bold mb-2 text-xs uppercase tracking-wider flex items-center justify-between">
            <span>Max-Flow / Min-Cut</span>
            <span className="text-[10px] text-slate-500 font-mono">Ford-Fulkerson</span>
          </div>
          <div className="space-y-1.5 mb-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Evacuation Origin:</label>
              <select value={flowSource} onChange={e => setFlowSource(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 outline-none">
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id}: {n.name || n.type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Safe Haven Sink:</label>
              <select value={flowSink} onChange={e => setFlowSink(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 outline-none">
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id}: {n.name || n.type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={fetchMaxFlow} className="w-full bg-red-600/90 hover:bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
            Compute Max Throughput
          </button>
          {maxFlowData && !maxFlowData.error && (
            <div className="mt-2.5 pt-2 border-t border-slate-700/70">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Max Evac Capacity:</span>
                <span className="text-red-400 font-bold font-mono text-base">{maxFlowData.max_flow} units/hr</span>
              </div>
              <div className="text-slate-400 text-[10px] mt-0.5">
                Bottlenecks highlighted in <span className="text-red-400 font-bold">thick red</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Theme Switcher */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/95 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-600 text-xs max-w-[240px]">
        <div className="text-slate-300 font-bold mb-2 uppercase tracking-wider">Topology Legend</div>
        {Object.entries(NODE_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: colors.fill }}></span>
            <span className="text-slate-300 text-[11px] truncate">{colors.label}</span>
          </div>
        ))}
        <div className="border-t border-slate-700 mt-2 pt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-0.5 inline-block bg-sky-500"></span>
            <span className="text-slate-400 text-[11px]">Open Highway</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-0.5 inline-block bg-slate-500 border-dashed border-t border-slate-400"></span>
            <span className="text-slate-400 text-[11px]">Blocked / Damaged</span>
          </div>
          <div className="text-slate-500 mt-1 italic text-[10px]">Click any road to toggle status</div>
        </div>

        {/* Map Theme Toggle */}
        <div className="border-t border-slate-700 mt-2 pt-2">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Map Theme</div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTileTheme('dark')}
              className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${tileTheme === 'dark' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tactical Dark
            </button>
            <button
              type="button"
              onClick={() => setTileTheme('osm')}
              className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${tileTheme === 'osm' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Street View
            </button>
          </div>
        </div>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={9} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%', minHeight: '600px' }}
      >
        <MapAutoResizer />
        <TileLayer
          key={tileTheme}
          attribution={TILE_PROVIDERS[tileTheme].attribution}
          url={TILE_PROVIDERS[tileTheme].url}
          maxZoom={TILE_PROVIDERS[tileTheme].maxZoom}
          tileSize={256}
        />
        
        {/* Render route highlight first (underneath) */}
        {routeData?.accessible && routeData.path && routeData.path.length >= 2 && (
          (() => {
            const routeCoords: [number, number][] = routeData.path!
              .map(id => nodeMap.get(id))
              .filter((n): n is NodeData => !!n)
              .map(n => [n.lat, n.lng] as [number, number]);
            return routeCoords.length >= 2 ? (
              <Polyline
                positions={routeCoords}
                pathOptions={{ color: '#22d3ee', weight: 7, opacity: 0.7, dashArray: '10, 6' }}
              />
            ) : null;
          })()
        )}

        {/* Render roads */}
        {roads.map((road) => {
          const path = getRoadPath(road);
          if (path.length < 2) return null;
          const bottleneck = isBottleneck(road.from_node_id, road.to_node_id);
          const onRoute = isOnRoute(road.from_node_id, road.to_node_id);
          return (
            <Polyline 
              key={road.id}
              positions={path}
              eventHandlers={{ click: () => toggleRoad(road.from_node_id, road.to_node_id) }}
              pathOptions={{ 
                color: bottleneck ? '#ef4444' : onRoute ? '#22d3ee' : (road.status === 'BLOCKED' ? '#64748b' : '#0ea5e9'), 
                weight: bottleneck ? 8 : onRoute ? 6 : 4, 
                dashArray: road.status === 'BLOCKED' ? '5, 10' : undefined, 
                opacity: road.status === 'BLOCKED' ? 0.4 : 0.85 
              }} 
            >
              <Popup className="dark-popup text-center">
                <div className="font-bold text-sm text-cyan-300">Highway {road.id}</div>
                <div className="text-xs text-slate-200 mt-1 font-medium">
                  {nodeMap.get(road.from_node_id)?.name || road.from_node_id} ↔ {nodeMap.get(road.to_node_id)?.name || road.to_node_id}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Length: <span className="text-white font-mono">{road.weight} km</span> | Capacity: <span className="text-white font-mono">{road.capacity} units/hr</span>
                </div>
                <div className={road.status === 'BLOCKED' ? 'text-red-400 font-bold mt-1 text-xs' : 'text-emerald-400 font-bold mt-1 text-xs'}>
                  Status: {road.status}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 italic">Click road to toggle status</div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const style = getNodeStyle(node.type);
          return (
            <CircleMarker 
              key={node.id} 
              center={[node.lat, node.lng]} 
              radius={8} 
              pathOptions={{ color: style.stroke, fillColor: style.fill, fillOpacity: 0.9, weight: 2.5 }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.92} sticky>
                <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">
                  {node.id}: {node.name || style.label}
                </div>
              </Tooltip>
              <Popup className="dark-popup">
                <div className="font-bold text-sm text-cyan-400">{node.id} - {node.name || style.label}</div>
                <div className="text-xs text-slate-300 mt-1">Role: <span className="font-semibold text-white">{style.label}</span></div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">Location: {node.lat.toFixed(4)}°N, {node.lng.toFixed(4)}°E</div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
