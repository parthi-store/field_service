import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X, Loader2 } from 'lucide-react';

// ---------- Toast System ----------
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }
interface ToastCtx { push: (msg: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastCtx>({ push: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const icon = { success: CheckCircle2, error: XCircle, info: Info };
  const color = {
    success: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    error: 'border-red-500 bg-red-50 text-red-800',
    info: 'border-blue-500 bg-blue-50 text-blue-800',
  };
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-80 max-w-[90vw]">
        {toasts.map((t) => {
          const I = icon[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-xl border-l-4 ${color[t.type]} bg-white shadow-lg px-4 py-3 animate-[slideIn_0.25s_ease]`}>
              <I className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><X className="w-4 h-4 opacity-50" /></button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </ToastContext.Provider>
  );
};

// ---------- Spinner ----------
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <Loader2 className={`animate-spin ${className}`} />
);

export const FullSpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    {label && <p className="text-sm font-medium">{label}</p>}
  </div>
);

// ---------- Modal ----------
export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; accent?: string }> = ({ open, onClose, title, children, accent = 'from-indigo-500 to-violet-500' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fade_0.2s_ease]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[pop_0.25s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-r ${accent} px-6 py-4 flex items-center justify-between`}>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style>{`@keyframes fade{from{opacity:0}to{opacity:1}}@keyframes pop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
};

// ---------- Badge ----------
const badgeMap: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Assigned: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-indigo-100 text-indigo-700',
  'On The Way': 'bg-cyan-100 text-cyan-700',
  'In Progress': 'bg-violet-100 text-violet-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-emerald-100 text-emerald-700',
};
export const Badge: React.FC<{ value: string }> = ({ value }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeMap[value] || 'bg-slate-100 text-slate-600'}`}>{value}</span>
);

// ---------- StatCard ----------
export const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; gradient: string }> = ({ icon, label, value, gradient }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>{icon}</div>
    </div>
  </div>
);

// ---------- Input ----------
export const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }> = ({ label, icon, ...props }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-600 mb-1.5 block">{label}</span>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input {...props} className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition text-slate-700`} />
    </div>
  </label>
);
