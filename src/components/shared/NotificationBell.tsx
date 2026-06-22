import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Inbox, ClipboardList, Hammer, RefreshCw, Info } from 'lucide-react';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';

const iconFor = (t: AppNotification['type']) => {
  switch (t) {
    case 'request': return <ClipboardList className="w-4 h-4" />;
    case 'task': return <Hammer className="w-4 h-4" />;
    case 'status': return <RefreshCw className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
};

const timeAgo = (t: number) => {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const NotificationBell: React.FC<{ accent: string }> = ({ accent }) => {
  const { notifications, unread, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = () => { setOpen((o) => { if (!o) setTimeout(markAllRead, 1200); return !o; }); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-[pop_0.18s_ease]">
          <div className={`px-4 py-3 bg-gradient-to-r ${accent} flex items-center justify-between`}>
            <span className="text-white font-semibold text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clear} className="text-white/80 hover:text-white text-xs font-medium flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" />Clear</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                <Inbox className="w-8 h-8" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? 'bg-indigo-50/40' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">{iconFor(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                  <p className="text-xs text-slate-500 truncate">{n.body}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.time)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
