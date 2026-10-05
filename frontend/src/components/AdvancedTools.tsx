'use client';
import { useState } from 'react';

const API_BASE = "http://localhost:8000";

interface HuffmanResponse {
  dictionary: Record<string, string>;
  encoded_message: string;
  original_bits: number;
  encoded_bits: number;
  compression_ratio: number;
}

interface MSTEdge {
  from: string;
  to: string;
  weight: number;
}

export default function AdvancedTools() {
  // Huffman State
  const [huffmanInput, setHuffmanInput] = useState('MAYDAY SQUAD CUT OFF EVACUATE NOW');
  const [huffmanResult, setHuffmanResult] = useState<HuffmanResponse | null>(null);
  const [huffmanLoading, setHuffmanLoading] = useState(false);
  const [huffmanError, setHuffmanError] = useState<string | null>(null);

  // CRT State
  const [crtInput, setCrtInput] = useState('0,3 | 1,4 | 2,5'); // r,m | r,m
  const [crtResult, setCrtResult] = useState<number | null>(null);
  const [crtLoading, setCrtLoading] = useState(false);
  const [crtError, setCrtError] = useState<string | null>(null);

  // MST State
  const [mstEdges, setMstEdges] = useState<MSTEdge[] | null>(null);
  const [mstTotalWeight, setMstTotalWeight] = useState<number>(0);
  const [mstLoading, setMstLoading] = useState(false);
  const [mstError, setMstError] = useState<string | null>(null);

  const runHuffman = async () => {
    if (!huffmanInput.trim()) return;
    setHuffmanLoading(true);
    setHuffmanError(null);
    try {
      const res = await fetch(`${API_BASE}/api/advanced/huffman`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: huffmanInput })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setHuffmanResult(data);
    } catch (e: any) {
      console.error("Huffman encoding failed:", e);
      setHuffmanError("Failed to encode. Ensure backend is running.");
    } finally {
      setHuffmanLoading(false);
    }
  };

  const runCRT = async () => {
    setCrtLoading(true);
    setCrtError(null);
    try {
      const parsedShifts = crtInput
        .split('|')
        .map(pair => {
          const parts = pair.trim().split(',').map(s => parseInt(s.trim(), 10));
          if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] <= 0) {
            throw new Error(`Invalid format in pair "${pair}". Use "remainder,modulo"`);
          }
          return parts;
        });

      const res = await fetch(`${API_BASE}/api/advanced/crt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts: parsedShifts })
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.rendezvous_time === -1) {
        setCrtError("No solution exists for this system of congruences (conflicting non-coprime moduli).");
        setCrtResult(null);
      } else {
        setCrtResult(data.rendezvous_time);
      }
    } catch (e: any) {
      console.error("CRT computation failed:", e);
      setCrtError(e.message || "CRT calculation failed.");
      setCrtResult(null);
    } finally {
      setCrtLoading(false);
    }
  };

  const fetchMST = async () => {
    setMstLoading(true);
    setMstError(null);
    try {
      const res = await fetch(`${API_BASE}/api/mst`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const rawEdges: [string, string, number][] = data.mst_edges || [];
      const edges: MSTEdge[] = rawEdges.map(e => ({ from: e[0], to: e[1], weight: e[2] }));
      const total = edges.reduce((acc, curr) => acc + curr.weight, 0);
      setMstEdges(edges);
      setMstTotalWeight(total);
    } catch (e: any) {
      console.error("MST computation failed:", e);
      setMstError("Failed to compute MST. Ensure backend is running.");
    } finally {
      setMstLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-2">
        <div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Discrete Mathematics Applied Laboratories
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live interactive modules demonstrating Information Theory, Modular Arithmetic, and Graph Spanning Trees.
          </p>
        </div>
        <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/50 self-start sm:self-auto">
          Discrete Math Engine v2.0
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab 1: Huffman Coding */}
        <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Huffman Message Compression
              </h3>
              <span className="text-[10px] text-purple-400 font-mono">Prefix-Free Code</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Lossless greedy compression for bandwidth-constrained emergency tactical radios.
            </p>

            <div className="space-y-2">
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500 font-mono tracking-wider transition-colors"
                value={huffmanInput} 
                onChange={e => setHuffmanInput(e.target.value)}
                placeholder="Enter emergency transmission message"
              />
              <button 
                onClick={runHuffman} 
                disabled={huffmanLoading}
                className="w-full bg-purple-600/90 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {huffmanLoading ? 'Generating Tree...' : 'Generate Huffman Coding'}
              </button>
            </div>

            {huffmanError && (
              <p className="mt-2 text-xs text-red-400">{huffmanError}</p>
            )}

            {huffmanResult && (
              <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Compression:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {((1 - huffmanResult.compression_ratio) * 100).toFixed(1)}% Saved
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Bits (ASCII vs Huffman):</span>
                  <span className="font-mono text-purple-300">
                    {huffmanResult.original_bits}b → {huffmanResult.encoded_bits}b
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Encoded Stream:</span>
                  <p className="bg-slate-900 p-1.5 rounded font-mono text-[10px] text-cyan-300 break-all border border-slate-800 max-h-16 overflow-y-auto">
                    {huffmanResult.encoded_message}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Shannon Source Coding Bound: L = Σ p_i * l_i
          </div>
        </div>

        {/* Lab 2: Chinese Remainder Theorem */}
        <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                Rendezvous Sync (CRT)
              </h3>
              <span className="text-[10px] text-pink-400 font-mono">Modular Congruence</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Solves congruence system <span className="font-mono text-pink-300">t ≡ r_i (mod m_i)</span> to synchronize patrol schedules.
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-pink-500 font-mono transition-colors"
                  value={crtInput} 
                  onChange={e => setCrtInput(e.target.value)}
                  placeholder="r1,m1 | r2,m2 | r3,m3"
                />
                <button 
                  onClick={runCRT} 
                  disabled={crtLoading}
                  className="bg-pink-600/90 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {crtLoading ? 'Solving...' : 'Solve'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Format: <span className="text-slate-400 font-mono">remainder,modulus</span> separated by pipes (|)</p>
            </div>

            {crtError && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {crtError}
              </div>
            )}

            {crtResult !== null && (
              <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">First Simultaneous Sync:</span>
                  <span className="text-pink-400 font-bold font-mono text-base">
                    T + {crtResult} hours
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Next rendezvous recurring every <span className="font-mono text-pink-300">LCM(m_1, ..., m_k)</span> cycles.
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Extended Euclidean Alg: a·x + b·y = gcd(a,b)
          </div>
        </div>

        {/* Lab 3: Minimum Spanning Tree */}
        <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Minimum Spanning Tree (MST)
              </h3>
              <span className="text-[10px] text-amber-400 font-mono">Kruskal&apos;s Algorithm</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Computes minimal weight infrastructure network connecting all zones without cycles.
            </p>

            <button 
              onClick={fetchMST} 
              disabled={mstLoading}
              className="w-full bg-amber-600/90 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {mstLoading ? 'Computing MST...' : 'Compute Minimal Infrastructure (MST)'}
            </button>

            {mstError && (
              <p className="mt-2 text-xs text-red-400">{mstError}</p>
            )}

            {mstEdges && (
              <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Total MST Backbone Weight:</span>
                  <span className="text-amber-400 font-bold font-mono text-sm">
                    {mstTotalWeight} units
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {mstEdges.map((edge, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300 font-mono bg-slate-900/60 px-2 py-1 rounded">
                      <span>{edge.from} ⟷ {edge.to}</span>
                      <span className="text-amber-400/80">wt: {edge.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Greedy Selection |V| - 1 Edges | Acyclic Bound
          </div>
        </div>
      </div>
    </div>
  );
}
