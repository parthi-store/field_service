import React, { useEffect, useState } from 'react';
import Shell from '@/components/shared/Shell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, Badge, FullSpinner, StatCard, Modal, Spinner } from '@/components/shared/UI';
import { getTechTasks, getRequests, updateTaskStatus, logActivity, subscribeTable } from '@/lib/api';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Hammer, MapPin, Clock, CheckCircle2, Truck, Loader, XCircle, Check } from 'lucide-react';

const NEXT: Record<string, string> = { Accepted: 'On The Way', 'On The Way': 'In Progress', 'In Progress': 'Completed' };
const REASONS = ['Not available at that time', 'Outside my service area', 'Lacking required equipment', 'Personal emergency', 'Other'];

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const { add } = useNotifications();
  const [tab, setTab] = useState('home');
  const [tasks, setTasks] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, r] = await Promise.all([getTechTasks(user!.id), getRequests()]);
    setTasks(t); setReqs(r); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Realtime: live task assignments/updates for this technician
  useEffect(() => {
    const unsub = subscribeTable('tasks', ({ eventType, new: row }) => {
      if (row?.assigned_technician !== user!.id) return;
      if (eventType === 'INSERT') {
        add({ type: 'task', title: 'New task assigned', body: 'A manager assigned you a new job' });
        push('New task assigned to you!', 'info');
      } else if (eventType === 'UPDATE' && row?.status === 'Assigned') {
        add({ type: 'task', title: 'Task reassigned to you', body: 'You have a job to action' });
        push('A task was assigned to you', 'info');
      }
      getTechTasks(user!.id).then(setTasks);
    });
    const unsubReq = subscribeTable('requests', () => { getRequests().then(setReqs); });
    return () => { unsub(); unsubReq(); };
  }, [add, push, user]);

  const req = (id: string) => reqs.find((r) => r.id === id);

  const syncReq = async (taskRequestId: string, status: string) => {
    await supabase.from('requests').update({ status }).eq('id', taskRequestId);
  };

  const accept = async (t: any) => {
    setBusy(true);
    try {
      await updateTaskStatus(t.id, { status: 'Accepted' });
      await syncReq(t.request_id, 'Accepted');
      await logActivity(user!.id, user!.name, `Accepted task ${req(t.request_id)?.issue || ''}`);
      push('Task accepted!', 'success'); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const advance = async (t: any) => {
    const next = NEXT[t.status]; if (!next) return;
    setBusy(true);
    try {
      await updateTaskStatus(t.id, { status: next });
      await syncReq(t.request_id, next);
      await logActivity(user!.id, user!.name, `Updated task to ${next}`);
      if (next === 'Completed') {
        const { data: sal } = await supabase.from('salaries').select('*').eq('technician_id', user!.id).maybeSingle();
        if (sal) {
          const ct = (sal.completed_tasks || 0) + 1;
          const total = Number(sal.base_salary) + ct * Number(sal.pay_per_task) + Number(sal.bonus) - Number(sal.penalty);
          await supabase.from('salaries').update({ completed_tasks: ct, total_salary: total }).eq('technician_id', user!.id);
        }
        push('Task completed! Salary updated.', 'success');
      } else push(`Status: ${next}`, 'info');
      load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await updateTaskStatus(rejectFor.id, { status: 'Rejected', rejection_reason: reason });
      await syncReq(rejectFor.request_id, 'Pending');
      await logActivity(user!.id, user!.name, `Rejected task: ${reason}`);
      push('Task rejected.', 'info'); setRejectFor(null); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const active = tasks.filter((t) => !['Completed', 'Rejected'].includes(t.status));
  const stats = {
    assigned: tasks.length,
    active: active.length,
    done: tasks.filter((t) => t.status === 'Completed').length,
  };

  const nav = [
    { id: 'home', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', label: 'My Tasks', icon: <Hammer className="w-4 h-4" /> },
  ];

  const card = (t: any) => {
    const r = req(t.request_id);
    return (
      <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">{r?.issue || 'Service'}</h3>
          <Badge value={t.status} />
        </div>
        <div className="space-y-1.5 text-sm text-slate-500">
          <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{r?.location || '—'}</p>
          <p className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{r?.preferred_time || 'Flexible'}</p>
          <p>Customer: <span className="text-slate-700 font-medium">{r?.name}</span> · {r?.phone}</p>
        </div>
        <div className="flex gap-2 mt-3"><Badge value={t.priority} />{t.deadline && <span className="text-xs text-slate-400 self-center">Due {t.deadline}</span>}</div>
        <div className="flex gap-2 mt-4">
          {t.status === 'Assigned' && <>
            <button onClick={() => accept(t)} disabled={busy} className="flex-1 bg-emerald-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-1.5"><Check className="w-4 h-4" />Accept</button>
            <button onClick={() => { setRejectFor(t); setReason(REASONS[0]); }} className="flex-1 bg-red-50 text-red-600 text-sm font-semibold py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1.5"><XCircle className="w-4 h-4" />Reject</button>
          </>}
          {NEXT[t.status] && <button onClick={() => advance(t)} disabled={busy} className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-1.5">
            {t.status === 'In Progress' ? <CheckCircle2 className="w-4 h-4" /> : t.status === 'Accepted' ? <Truck className="w-4 h-4" /> : <Loader className="w-4 h-4" />}
            {NEXT[t.status]}
          </button>}
          {t.status === 'Completed' && <span className="flex-1 text-center text-sm text-emerald-600 font-semibold py-2 bg-emerald-50 rounded-lg">Done</span>}
          {t.status === 'Rejected' && <span className="flex-1 text-center text-sm text-red-500 font-semibold py-2 bg-red-50 rounded-lg">Rejected</span>}
        </div>
      </div>
    );
  };

  return (
    <Shell nav={nav} active={tab} onNav={setTab}>
      {loading ? <FullSpinner /> : <>
        {tab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white">
              <h2 className="text-3xl font-bold">Hello {user!.name.split(' ')[0]}!</h2>
              <p className="text-white/85 mt-2">You have {stats.active} active job(s) today. Keep up the great work.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              <StatCard icon={<Hammer className="w-7 h-7" />} label="Total Jobs" value={stats.assigned} gradient="from-orange-500 to-amber-500" />
              <StatCard icon={<Loader className="w-7 h-7" />} label="Active" value={stats.active} gradient="from-blue-500 to-cyan-500" />
              <StatCard icon={<CheckCircle2 className="w-7 h-7" />} label="Completed" value={stats.done} gradient="from-emerald-500 to-teal-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Active Jobs</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.length ? active.map(card) : <p className="text-slate-400">No active jobs. Nice!</p>}
            </div>
          </div>
        )}
        {tab === 'tasks' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">My Tasks</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.length ? tasks.map(card) : <p className="text-slate-400">No tasks assigned yet.</p>}
            </div>
          </div>
        )}
      </>}

      <Modal open={!!rejectFor} onClose={() => setRejectFor(null)} title="Reject Task" accent="from-orange-500 to-amber-500">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Please tell the manager why you're rejecting this task.</p>
          <label className="block">
            <span className="text-sm font-medium text-slate-600 mb-1.5 block">Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none">
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <button onClick={reject} disabled={busy} className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Spinner className="w-5 h-5" />}Confirm Rejection</button>
        </div>
      </Modal>
    </Shell>
  );
};

export default TechnicianDashboard;
