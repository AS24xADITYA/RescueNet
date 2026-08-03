import dynamic from 'next/dynamic';
import AlertsPanel from '../components/Alerts';

// Leaflet requires window, so we strictly client-side render the map
const RescueMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">RescueNet</h1>
            <p className="text-slate-500 mt-1">Discrete Mathematics Evacuation & Routing Engine</p>
          </div>
          <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            System Online
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Map (Takes up 2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <RescueMap mstEdges={[]} />
            </div>
          </div>

          {/* Right Column - Side Panels */}
          <div className="space-y-6">
            <AlertsPanel />
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Priority Queue</h2>
              <p className="text-slate-500 text-sm">Priority BST will render here...</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
