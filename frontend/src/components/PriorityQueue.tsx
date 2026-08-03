'use client';
import { useEffect, useState } from 'react';

export default function PriorityQueue() {
  const [victims, setVictims] = useState<any[]>([]);

  useEffect(() => {
    // Listen for WebSocket events to update queue
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "NEW_VICTIM") {
        setVictims(prev => {
          const newQueue = [...prev, data.data];
          // Sort by discrete math priority logic (CRITICAL > HIGH > MEDIUM > LOW)
          const weight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return newQueue.sort((a, b) => weight[b.severity as keyof typeof weight] - weight[a.severity as keyof typeof weight]);
        });
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700/50 h-full">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        Priority Triage Queue
      </h2>
      
      {victims.length === 0 ? (
        <div className="text-slate-400 text-sm italic flex flex-col items-center justify-center h-32">
          <div className="w-10 h-10 border-2 border-slate-700 rounded-full border-t-cyan-500 animate-spin mb-3"></div>
          Queue empty. Awaiting signals...
        </div>
      ) : (
        <div className="space-y-3">
          {victims.map((v, i) => (
            <div key={i} className="group relative p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-slate-200 font-medium">{v.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Loc: {v.location_node_id}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm
                  ${v.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                  ${v.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                  ${v.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                  ${v.severity === 'LOW' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                `}>
                  {v.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
