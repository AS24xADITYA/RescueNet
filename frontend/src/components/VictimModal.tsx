'use client';
import { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8000";

interface NodeItem {
  id: string;
  name?: string;
}

interface VictimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VictimModal({ isOpen, onClose, onSuccess }: VictimModalProps) {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'SERIOUS' | 'STABLE'>('CRITICAL');
  const [location, setLocation] = useState('N6');
  const [availableNodes, setAvailableNodes] = useState<NodeItem[]>([
    { id: 'N6', name: 'Kasara Ghat Landslide Hazard' },
    { id: 'N7', name: 'Nashik Godavari Flood Zone' },
    { id: 'N9', name: 'Mahad Savitri Flash Flood Zone' },
    { id: 'N5', name: 'Kalyan Central Transit Junction' },
    { id: 'N1', name: 'Mumbai BKC Command HQ' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE}/api/nodes`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted: NodeItem[] = data.map((n: any) => ({
            id: n.id,
            name: n.name || n.type
          }));
          setAvailableNodes(formatted);
          if (!data.some((n: any) => n.id === location)) {
            setLocation(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, location]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/victims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `VIC-${Date.now().toString().slice(-6)}`,
          name: name.trim(),
          location_node_id: location.trim(),
          severity
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with status ${res.status}`);
      }

      setName('');
      setSeverity('CRITICAL');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to register victim:", err);
      setError(err.message || 'Failed to connect to backend server on port 8000.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            Register Emergency
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Victim Name / Team Call-sign
            </label>
            <input 
              required
              placeholder="e.g. Kasara Ghat Rescue Squad Alpha"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Triage Severity (Discrete Math Priority)
            </label>
            <select 
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              value={severity} 
              onChange={(e) => setSeverity(e.target.value as any)}
            >
              <option value="CRITICAL">🔴 CRITICAL (Rank 1 - Immediate Evacuation)</option>
              <option value="SERIOUS">🟠 SERIOUS (Rank 2 - Urgent Medical Care)</option>
              <option value="STABLE">🟢 STABLE (Rank 3 - Delayed Observation)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Incident Location
            </label>
            <select 
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 font-medium"
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            >
              {availableNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.id}: {node.name || `Node ${node.id}`}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Select real-world hazard location or staging base.</p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Emergency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
