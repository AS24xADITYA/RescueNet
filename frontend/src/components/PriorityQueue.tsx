'use client';
import { useEffect, useState, useCallback } from 'react';

const API_BASE = "http://localhost:8000";

interface Victim {
  id: string;
  name: string;
  location_node_id: string;
  severity: 'CRITICAL' | 'SERIOUS' | 'STABLE';
  registered_at?: string;
}

const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 3,
  SERIOUS: 2,
  STABLE: 1,
};

export default function PriorityQueue() {
  const [victims, setVictims] = useState<Victim[]>([]);
  const [nodeNames, setNodeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const sortQueue = (items: Victim[]): Victim[] => {
    return [...items].sort((a, b) => {
      const weightA = SEVERITY_WEIGHTS[a.severity] ?? 0;
      const weightB = SEVERITY_WEIGHTS[b.severity] ?? 0;
      if (weightB !== weightA) {
        return weightB - weightA; // Descending by severity
      }
      return (a.registered_at || '').localeCompare(b.registered_at || '');
    });
  };

  const fetchVictims = useCallback(async () => {
    try {
      const [victimsRes, nodesRes] = await Promise.all([
        fetch(`${API_BASE}/api/victims`),
        fetch(`${API_BASE}/api/nodes`),
      ]);
      if (nodesRes.ok) {
        const nodesData = await nodesRes.json();
        const map: Record<string, string> = {};
        nodesData.forEach((n: any) => { map[n.id] = n.name || n.id; });
        setNodeNames(map);
      }
      if (victimsRes.ok) {
        const data: Victim[] = await victimsRes.json();
        setVictims(sortQueue(data));
      }
    } catch (err) {
      console.error("Failed to fetch triage queue:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVictims();

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws');
        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === "NEW_VICTIM" && payload.data) {
              setVictims(prev => sortQueue([...prev.filter(v => v.id !== payload.data.id), payload.data]));
            }
          } catch (e) {
            console.error("Error processing WebSocket message in PriorityQueue:", e);
          }
        };
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch {
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [fetchVictims]);

  const getBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'SERIOUS':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'STABLE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col h-full max-h-[350px]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Priority Triage Queue
        </h2>
        <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-mono border border-slate-700">
          Heap Order O(log n)
        </span>
      </div>

      <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-28 text-slate-400 text-xs gap-2">
            <div className="w-6 h-6 border-2 border-slate-700 rounded-full border-t-amber-400 animate-spin"></div>
            <span>Loading priority heap...</span>
          </div>
        ) : victims.length === 0 ? (
          <div className="text-slate-400 text-xs italic flex flex-col items-center justify-center h-28 border border-dashed border-slate-700/60 rounded-xl">
            <span>Queue empty. Awaiting emergency signals...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {victims.map((v, i) => (
              <div 
                key={v.id || i} 
                className="group relative p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl hover:border-cyan-500/50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 font-bold w-4 text-center">
                    #{i + 1}
                  </span>
                  <div>
                    <h3 className="text-slate-200 text-sm font-semibold">{v.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sector: <span className="text-cyan-300 font-medium">{nodeNames[v.location_node_id] || v.location_node_id}</span>
                      <span className="text-slate-600 ml-1.5 font-mono">({v.location_node_id})</span>
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border tracking-wider ${getBadgeStyle(v.severity)}`}>
                  {v.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
