import React, { useEffect, useState } from 'react';
import Shell from '@/components/shared/Shell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, Badge, FullSpinner, StatCard, Modal, Field, Spinner } from '@/components/shared/UI';
import { getRequests, getTasks, getProfilesByRole, assignTask, updateTaskStatus, createSubUser, logActivity, subscribeTable, Profile } from '@/lib/api';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, ClipboardList, Users, UserPlus, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const { add } = useNotifications();
  const [tab, setTab] = useState('home');
  const [requests, setRequests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [techs, setTechs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignFor, setAssignFor] = useState<any | null>(null);
  const [reassignFor, setReassignFor] = useState<any | null>(null);
  const [tech, setTech] = useState(''); const [priority, setPriority] = useState('Medium'); const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [nName, setNName] = useState(''); const [nEmail, setNEmail] = useState(''); const [nPass, setNPass] = useState('');

  const load = async () => {
    setLoading(true);
    const [r, t, tc] = await Promise.all([getRequests(), getTasks(), getProfilesByRole('technician')]);
    setRequests(r); setTasks(t); setTechs(tc); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Realtime: new customer requests + technician task updates
  useEffect(() => {
    const unsubR = subscribeTable('requests', ({ eventType, new: row }) => {
      if (eventType === 'INSERT') {
        add({ type: 'request', title: 'New service request', body: `${row.name || 'Customer'} · ${row.issue}` });
        push(`New request: ${row.issue}`, 'info');
      }
      getRequests().then(setRequests);
    });
    const unsubT = subscribeTable('tasks', ({ eventType, new: row, old }) => {
      if (eventType === 'UPDATE' && row?.status === 'Rejected' && old?.status !== 'Rejected') {
        add({ type: 'status', title: 'Task rejected', body: row.rejection_reason || 'A technician rejected a task' });
        push('A task was rejected — reassign needed', 'error');
      }
      getTasks().then(setTasks);
    });
    return () => { unsubR(); unsubT(); };
  }, [add, push]);

  const assignedReqIds = new Set(tasks.map((t) => t.request_id));
  const techName = (id: string) => techs.find((t) => t.id === id)?.name || '—';

  const doAssign = async () => {
    if (!tech) { push('Select a technician', 'error'); return; }
    setBusy(true);
    try {
      await assignTask({ request_id: assignFor.id, assigned_technician: tech, manager_id: user!.id, priority, deadline, status: 'Assigned' });
      await supabase.from('requests').update({ status: 'Assigned' }).eq('id', assignFor.id);
      await logActivity(user!.id, user!.name, `Assigned ${assignFor.issue} to ${techName(tech)}`);
      push('Task assigned successfully!', 'success');
      setAssignFor(null); setTech(''); setDeadline(''); setPriority('Medium'); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const doReassign = async () => {
    if (!tech) { push('Select a technician', 'error'); return; }
    setBusy(true);
    try {
      await updateTaskStatus(reassignFor.id, { assigned_technician: tech, status: 'Assigned', rejection_reason: null, priority, deadline });
      await logActivity(user!.id, user!.name, `Reassigned task to ${techName(tech)}`);
      push('Task reassigned!', 'success');
      setReassignFor(null); setTech(''); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const addTech = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await createSubUser(nName, nEmail.trim(), nPass, 'technician', user!.id);
      await logActivity(user!.id, user!.name, `Created technician ${nName}`);
      push('Technician added!', 'success');
      setShowAdd(false); setNName(''); setNEmail(''); setNPass(''); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const stats = {
    requests: requests.length,
    assigned: tasks.length,
    rejected: tasks.filter((t) => t.status === 'Rejected').length,
    techs: techs.length,
  };

  const nav = [
    { id: 'home', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'requests', label: 'Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'techs', label: 'Technicians', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <Shell nav={nav} active={tab} onNav={setTab}>
      {loading ? <FullSpinner label="Loading workspace..." /> : <>
        {tab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-700 rounded-3xl p-8 text-white">
              <h2 className="text-3xl font-bold">Manager Console</h2>
              <p className="text-white/80 mt-2">Triage requests, assign technicians, and keep operations flowing.</p>
            </div>
            <div className="grid sm:grid-cols-4 gap-5">
              <StatCard icon={<ClipboardList className="w-7 h-7" />} label="Requests" value={stats.requests} gradient="from-blue-700 to-indigo-600" />
              <StatCard icon={<RefreshCw className="w-7 h-7" />} label="Tasks Assigned" value={stats.assigned} gradient="from-violet-600 to-purple-600" />
              <StatCard icon={<AlertTriangle className="w-7 h-7" />} label="Rejected" value={stats.rejected} gradient="from-red-500 to-rose-500" />
              <StatCard icon={<Users className="w-7 h-7" />} label="Technicians" value={stats.techs} gradient="from-emerald-500 to-teal-500" />
            </div>
            {stats.rejected > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <p className="text-red-700 text-sm font-medium">{stats.rejected} rejected task(s) need reassignment. Go to Tasks tab.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Customer Requests</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>{['Customer', 'Issue', 'Location', 'Time', 'Status', 'Action'].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.name}<div className="text-xs text-slate-400">{r.phone}</div></td>
                      <td className="px-4 py-3">{r.issue}</td>
                      <td className="px-4 py-3 text-slate-500">{r.location}</td>
                      <td className="px-4 py-3 text-slate-500">{r.preferred_time || '—'}</td>
                      <td className="px-4 py-3"><Badge value={r.status} /></td>
                      <td className="px-4 py-3">
                        {assignedReqIds.has(r.id) ? <span className="text-xs text-emerald-600 font-medium">Assigned</span> :
                          <button onClick={() => setAssignFor(r)} className="text-xs font-semibold text-white bg-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-800">Assign</button>}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No requests yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Tasks</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((t) => {
                const req = requests.find((r) => r.id === t.request_id);
                return (
                  <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-800">{req?.issue || 'Task'}</h3>
                      <Badge value={t.status} />
                    </div>
                    <p className="text-sm text-slate-500">Tech: <span className="font-medium text-slate-700">{techName(t.assigned_technician)}</span></p>
                    <div className="flex gap-2 mt-2"><Badge value={t.priority} />{t.deadline && <span className="text-xs text-slate-400 self-center">Due {t.deadline}</span>}</div>
                    {t.status === 'Rejected' && (
                      <div className="mt-3">
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-2">Reason: {t.rejection_reason || 'N/A'}</p>
                        <button onClick={() => { setReassignFor(t); setPriority(t.priority); setDeadline(t.deadline || ''); }} className="w-full text-sm font-semibold text-white bg-blue-700 py-2 rounded-lg hover:bg-blue-800">Reassign</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {tasks.length === 0 && <p className="text-slate-400">No tasks assigned yet.</p>}
            </div>
          </div>
        )}

        {tab === 'techs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Technicians</h2>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800"><UserPlus className="w-4 h-4" />Add Technician</button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {techs.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">{t.name[0]?.toUpperCase()}</div>
                  <div><p className="font-semibold text-slate-700">{t.name}</p><p className="text-xs text-slate-400">{t.email}</p></div>
                </div>
              ))}
              {techs.length === 0 && <p className="text-slate-400">No technicians yet. Add one!</p>}
            </div>
          </div>
        )}
      </>}

      {/* Assign modal */}
      <Modal open={!!assignFor} onClose={() => setAssignFor(null)} title="Assign Task" accent="from-blue-800 to-indigo-700">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Assign <b>{assignFor?.issue}</b> for <b>{assignFor?.name}</b></p>
          <TechSelect techs={techs} value={tech} onChange={setTech} />
          <PrioritySelect value={priority} onChange={setPriority} />
          <Field label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button onClick={doAssign} disabled={busy} className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Spinner className="w-5 h-5" />}Assign</button>
        </div>
      </Modal>

      {/* Reassign modal */}
      <Modal open={!!reassignFor} onClose={() => setReassignFor(null)} title="Reassign Task" accent="from-blue-800 to-indigo-700">
        <div className="space-y-4">
          <TechSelect techs={techs} value={tech} onChange={setTech} />
          <PrioritySelect value={priority} onChange={setPriority} />
          <Field label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button onClick={doReassign} disabled={busy} className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Spinner className="w-5 h-5" />}Reassign</button>
        </div>
      </Modal>

      {/* Add tech modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Technician" accent="from-orange-500 to-amber-500">
        <form onSubmit={addTech} className="space-y-4">
          <Field label="Name" value={nName} onChange={(e) => setNName(e.target.value)} required />
          <Field label="Email" type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} required />
          <Field label="Password" type="password" value={nPass} onChange={(e) => setNPass(e.target.value)} required />
          <button disabled={busy} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Spinner className="w-5 h-5" />}Create Technician</button>
        </form>
      </Modal>
    </Shell>
  );
};

const TechSelect: React.FC<{ techs: Profile[]; value: string; onChange: (v: string) => void }> = ({ techs, value, onChange }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-600 mb-1.5 block">Technician</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none">
      <option value="">Select technician...</option>
      {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  </label>
);
const PrioritySelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-600 mb-1.5 block">Priority</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none">
      {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
    </select>
  </label>
);

export default ManagerDashboard;
