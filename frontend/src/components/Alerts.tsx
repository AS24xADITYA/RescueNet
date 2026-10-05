'use client';

import { useEffect, useState, useCallback } from 'react';

const API_BASE = "http://localhost:8000";

interface AlertItem {
  id: string | number;
  type: string;
  message: string;
  severity: 'CRITICAL' | 'SERIOUS' | 'STABLE' | 'INFO';
  timestamp?: string;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystemAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts`);
      if (res.ok) {
        const data = await res.json();
        const systemAlerts: AlertItem[] = (data.alerts || []).map((a: any, idx: number) => ({
          id: `sys-${idx}-${Date.now()}`,
          type: a.type,
          message: a.message,
          severity: a.severity || 'SERIOUS',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));

        setAlerts(prev => {
          // Keep live event alerts (those with event- prefixes) and refresh system rule alerts
          const liveEvents = prev.filter(p => typeof p.id === 'string' && p.id.startsWith('event-'));
          return [...liveEvents, ...systemAlerts];
        });
      }
    } catch (err) {
      console.error("Failed to fetch system alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemAlerts();

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws');

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            if (data.event === "NEW_VICTIM" && data.data) {
              const newAlert: AlertItem = {
                id: `event-vic-${Date.now()}`,
                type: 'NEW_EMERGENCY',
                message: `New ${data.data.severity} victim: ${data.data.name} at Node ${data.data.location_node_id}`,
                severity: data.data.severity === 'CRITICAL' ? 'CRITICAL' : 'SERIOUS',
                timestamp: now
              };
              setAlerts(prev => [newAlert, ...prev.slice(0, 30)]);
              // Re-check capacity deficit
              fetchSystemAlerts();
            } else if (data.event === "ROAD_TOGGLED" && data.data) {
              const isBlocked = data.data.status === 'BLOCKED';
              const newAlert: AlertItem = {
                id: `event-road-${Date.now()}`,
                type: 'ROAD_STATUS',
                message: `Road ${data.data.from} ↔ ${data.data.to} is now ${data.data.status}`,
                severity: isBlocked ? 'SERIOUS' : 'INFO',
                timestamp: now
              };
              setAlerts(prev => [newAlert, ...prev.slice(0, 30)]);
              // Re-check connected components
              fetchSystemAlerts();
            }
          } catch (e) {
            console.error("Error handling WS alert:", e);
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 3000);
        };
      } catch {
        reconnectTimer = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [fetchSystemAlerts]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'SERIOUS':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'INFO':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          Live Activity & Logic Rules
        </h2>
        <span className="text-[11px] text-slate-400 font-mono">
          ¬P∧¬Q→¬A
        </span>
      </div>

      <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-400 text-xs gap-2">
            <div className="w-5 h-5 border-2 border-slate-700 rounded-full border-t-rose-400 animate-spin"></div>
            <span>Evaluating logic rules...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-slate-400 text-xs italic flex flex-col items-center justify-center h-24 border border-dashed border-slate-700/60 rounded-xl">
            <span>System nominal. All zones accessible, capacities balanced.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="p-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-start gap-2.5 hover:bg-slate-800/60 transition-colors"
              >
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border tracking-wider flex-shrink-0 mt-0.5 ${getSeverityBadge(alert.severity)}`}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug text-slate-200">{alert.message}</p>
                  {alert.timestamp && (
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 inline-block">
                      {alert.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
