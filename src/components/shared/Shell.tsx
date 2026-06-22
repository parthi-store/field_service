import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Wrench, LogOut, Menu } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';

export interface NavItem { id: string; label: string; icon: React.ReactNode; }

export const ROLE_THEME: Record<string, { name: string; grad: string; ring: string; soft: string; text: string }> = {
  customer: { name: 'Customer', grad: 'from-sky-500 to-cyan-500', ring: 'sky', soft: 'bg-sky-50', text: 'text-sky-600' },
  manager: { name: 'Manager', grad: 'from-blue-800 to-indigo-700', ring: 'blue', soft: 'bg-blue-50', text: 'text-blue-700' },
  technician: { name: 'Technician', grad: 'from-orange-500 to-amber-500', ring: 'orange', soft: 'bg-orange-50', text: 'text-orange-600' },
  admin: { name: 'Admin', grad: 'from-purple-600 to-violet-600', ring: 'purple', soft: 'bg-purple-50', text: 'text-purple-600' },
};

const Shell: React.FC<{ nav: NavItem[]; active: string; onNav: (id: string) => void; children: React.ReactNode }> = ({ nav, active, onNav, children }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const theme = ROLE_THEME[user?.role || 'customer'];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-16 flex items-center gap-3 px-6 bg-gradient-to-r ${theme.grad}`}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white"><Wrench className="w-5 h-5" /></div>
          <span className="text-white font-bold text-lg">Fixora</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-3 mb-2">{theme.name} Panel</p>
          {nav.map((n) => (
            <button key={n.id} onClick={() => { onNav(n.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active === n.id ? `bg-gradient-to-r ${theme.grad} text-white shadow` : 'text-slate-600 hover:bg-slate-100'}`}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.grad} flex items-center justify-center text-white font-semibold`}>{user?.name?.[0]?.toUpperCase()}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl py-2.5 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <button className="lg:hidden text-slate-600" onClick={() => setOpen(true)}><Menu className="w-6 h-6" /></button>
          <h1 className="font-semibold text-slate-700 hidden sm:block">{nav.find((n) => n.id === active)?.label}</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold ${theme.soft} ${theme.text}`}>{theme.name} Workspace</span>
            <NotificationBell accent={theme.grad} />
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.grad} flex items-center justify-center text-white font-semibold text-sm`}>{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Shell;
