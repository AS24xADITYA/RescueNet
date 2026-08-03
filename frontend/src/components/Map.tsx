'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Using a dramatic dark map tile layer for the premium look
const MAP_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

interface RescueMapProps {
  mstEdges?: Array<[string, string, number]>;
}

export default function RescueMap({ mstEdges = [] }: RescueMapProps) {
  const defaultCenter: [number, number] = [19.0760, 72.8777]; 
  const [maxFlowData, setMaxFlowData] = useState<any>(null);
  
  const demoNodes = [
    { id: 'N1', lat: 19.0760, lng: 72.8777, name: 'Mumbai HQ' },
    { id: 'N2', lat: 18.5204, lng: 73.8567, name: 'Pune Relief' },
    { id: 'N3', lat: 19.9975, lng: 73.7898, name: 'Nashik Base' },
    { id: 'N4', lat: 19.2183, lng: 72.9781, name: 'Thane' },
    { id: 'N5', lat: 18.6161, lng: 73.2809, name: 'Lonavala' }
  ];

  const [roads, setRoads] = useState([
    { id: 'R1', from: 'N1', to: 'N4', path: [[19.0760, 72.8777], [19.2183, 72.9781]], status: 'OPEN' },
    { id: 'R2', from: 'N4', to: 'N3', path: [[19.2183, 72.9781], [19.9975, 73.7898]], status: 'OPEN' },
    { id: 'R3', from: 'N1', to: 'N5', path: [[19.0760, 72.8777], [18.6161, 73.2809]], status: 'OPEN' },
    { id: 'R4', from: 'N5', to: 'N2', path: [[18.6161, 73.2809], [18.5204, 73.8567]], status: 'OPEN' },
    { id: 'R5', from: 'N2', to: 'N3', path: [[18.5204, 73.8567], [19.9975, 73.7898]], status: 'OPEN' }
  ]);

  const toggleRoad = async (fromId: string, toId: string) => {
    try {
      await fetch(`http://localhost:8000/api/roads/${fromId}/${toId}/toggle`, { method: 'POST' });
      setRoads(prev => prev.map(r => (r.from === fromId && r.to === toId) ? { ...r, status: r.status === 'OPEN' ? 'BLOCKED' : 'OPEN' } : r));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMaxFlow = async () => {
    const res = await fetch('http://localhost:8000/api/advanced/max-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'N1', sink: 'N3' })
    });
    setMaxFlowData(await res.json());
  };

  const isBottleneck = (from: string, to: string) => {
    if (!maxFlowData || !maxFlowData.bottleneck_edges) return false;
    return maxFlowData.bottleneck_edges.some((edge: any) => edge[0] === from && edge[1] === to);
  };

  return (
    <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 relative">
      <button 
        onClick={fetchMaxFlow}
        className="absolute top-4 right-4 z-[400] bg-red-600/90 hover:bg-red-500 text-white px-4 py-2 rounded shadow-lg backdrop-blur text-sm font-bold border border-red-400"
      >
        Compute Max-Flow
      </button>

      {maxFlowData && (
        <div className="absolute top-16 right-4 z-[400] bg-slate-900/90 text-white p-3 rounded shadow-lg border border-slate-600 text-sm">
          <div className="text-red-400 font-bold mb-1">Max Evacuation Capacity:</div>
          <div className="text-2xl">{maxFlowData.max_flow}</div>
        </div>
      )}

      <MapContainer center={defaultCenter} zoom={8} scrollWheelZoom={true} className="w-full h-full z-0">
        <TileLayer attribution='&copy; CARTO' url={MAP_TILES} />
        
        {demoNodes.map((node) => (
          <CircleMarker key={node.id} center={[node.lat, node.lng]} radius={8} pathOptions={{ color: '#06b6d4', fillColor: '#0891b2', fillOpacity: 0.7 }}>
            <Popup className="dark-popup"><div className="text-slate-800 font-bold">{node.name}</div></Popup>
          </CircleMarker>
        ))}

        {roads.map((road) => (
          <Polyline 
            key={road.id}
            positions={road.path as any} 
            eventHandlers={{ click: () => toggleRoad(road.from, road.to) }}
            pathOptions={{ 
              color: isBottleneck(road.from, road.to) ? '#ef4444' : (road.status === 'BLOCKED' ? '#64748b' : '#0ea5e9'), 
              weight: isBottleneck(road.from, road.to) ? 8 : 4, 
              dashArray: road.status === 'BLOCKED' ? '5, 10' : undefined, 
              opacity: road.status === 'BLOCKED' ? 0.4 : 0.8 
            }} 
          >
            <Popup className="dark-popup text-center">
              <div>Road {road.id}</div>
              <div className={road.status === 'BLOCKED' ? 'text-slate-400' : 'text-emerald-400'}>{road.status}</div>
              <div className="text-xs text-slate-500 mt-1">Click to toggle</div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
}
