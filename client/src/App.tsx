import { useState, useEffect } from 'react';
import { Package, CheckCircle2, Server } from 'lucide-react';

export default function App() {
  const [serverHealth, setServerHealth] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setServerHealth(data.status === 'ok' ? 'Connected' : 'Error'))
      .catch(() => setServerHealth('Disconnected (Start server)'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          StockFlow MVP
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Multi-Tenant SaaS Inventory Management System
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Frontend (Vite + React + Tailwind)
            </span>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-medium">
              Ready
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              Backend (Express + TS)
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                serverHealth === 'Connected'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {serverHealth}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
