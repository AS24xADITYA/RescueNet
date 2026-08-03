'use client';

import { useEffect, useState } from 'react';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Connect to FastAPI WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "NEW_VICTIM") {
        setAlerts(prev => [{ 
          id: Date.now(), 
          message: `New ${data.data.severity} emergency: ${data.data.name} at Node ${data.data.location_node_id}`, 
          type: data.data.severity 
        }, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700/50 h-[300px] overflow-y-auto custom-scrollbar">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        Live Activity Stream
      </h2>
      
      {alerts.length === 0 ? (
        <p className="text-slate-400 text-sm italic">System nominal. Monitoring network...</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-3 bg-slate-900/40 border border-slate-700/50 rounded-lg text-sm text-slate-300 flex items-start gap-3 hover:bg-slate-800/60 transition-colors">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
