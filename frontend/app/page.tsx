'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AlertsPanel from '../src/components/Alerts';
import PriorityQueue from '../src/components/PriorityQueue';
import VictimModal from '../src/components/VictimModal';
import AdvancedTools from '../src/components/AdvancedTools';

// Leaflet requires window, so we strictly client-side render the map
const RescueMap = dynamic(() => import('../src/components/Map'), { ssr: false });

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 p-8 font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 selection:bg-cyan-500/30">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight drop-shadow-sm">
              RescueNet Command
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Discrete Mathematics Evacuation & Routing Engine</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Report Emergency
            </button>
            <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Online
            </div>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Map */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm p-2 rounded-2xl shadow-xl border border-slate-800">
              <RescueMap />
            </div>
          </div>

          {/* Right Column - Side Panels */}
          <div className="space-y-6 flex flex-col h-[616px]">
            <div className="flex-1">
              <PriorityQueue />
            </div>
            <div className="h-[250px]">
              <AlertsPanel />
            </div>
          </div>
        </div>

        {/* Phase 6 Stretch Goals Row */}
        <AdvancedTools />
      </div>
      
      <VictimModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
