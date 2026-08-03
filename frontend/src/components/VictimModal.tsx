'use client';
import { useState } from 'react';

export default function VictimModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [location, setLocation] = useState('N1');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8000/api/victims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `VIC-${Date.now()}`,
          name,
          location_node_id: location,
          severity
        })
      });
      onClose();
    } catch (err) {
      console.error("Failed to register victim", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-[400px]">
        <h2 className="text-2xl font-bold text-white mb-4">Register Emergency</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Name</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500 transition-colors"
              value={name} onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Severity</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
              value={severity} onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="CRITICAL">Critical (Life Threatening)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Location Node</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500 transition-colors"
              value={location} onChange={(e) => setLocation(e.target.value)} 
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium shadow-lg hover:shadow-cyan-500/25 transition-all">Register Victim</button>
          </div>
        </form>
      </div>
    </div>
  );
}
