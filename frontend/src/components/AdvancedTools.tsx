'use client';
import { useState } from 'react';

export default function AdvancedTools() {
  const [huffmanInput, setHuffmanInput] = useState('MAYDAY SEND HELP');
  const [huffmanResult, setHuffmanResult] = useState<any>(null);

  const [crtInput, setCrtInput] = useState('0,3|1,4|2,5'); // remainder,modulo
  const [crtResult, setCrtResult] = useState<number | null>(null);

  const runHuffman = async () => {
    const res = await fetch('http://localhost:8000/api/advanced/huffman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: huffmanInput })
    });
    setHuffmanResult(await res.json());
  };

  const runCRT = async () => {
    const shifts = crtInput.split('|').map(s => s.split(',').map(Number));
    const res = await fetch('http://localhost:8000/api/advanced/crt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shifts })
    });
    const data = await res.json();
    setCrtResult(data.rendezvous_time);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700/50 mt-6">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        Advanced Analytics Labs
      </h2>

      <div className="space-y-6">
        {/* Huffman Compression */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Radio Msg Compression (Huffman)</h3>
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-purple-500"
              value={huffmanInput} onChange={e => setHuffmanInput(e.target.value)}
            />
            <button onClick={runHuffman} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm transition-colors">Encode</button>
          </div>
          {huffmanResult && (
            <div className="mt-3 text-xs text-slate-400">
              <p><strong className="text-purple-300">Encoded:</strong> {huffmanResult.encoded_message}</p>
              <p><strong className="text-purple-300">Ratio:</strong> {huffmanResult.compression_ratio * 100}% of original size</p>
            </div>
          )}
        </div>

        {/* CRT Scheduling */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Team Rendezvous Sync (CRT)</h3>
          <p className="text-xs text-slate-500 mb-2">Format: rem,mod | rem,mod ...</p>
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-pink-500"
              value={crtInput} onChange={e => setCrtInput(e.target.value)}
            />
            <button onClick={runCRT} className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded text-sm transition-colors">Sync</button>
          </div>
          {crtResult !== null && (
            <div className="mt-3 text-sm">
              <strong className="text-pink-300">Next Joint Rendezvous Time:</strong> T+{crtResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
