import React, { useEffect, useState } from 'react';
import Shell from '@/components/shared/Shell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, Badge, FullSpinner, StatCard, Modal, Field, Spinner } from '@/components/shared/UI';
import { getTasks, getRequests, getSalaries, getProfilesByRole, createSubUser, upsertSalary, getLogs, logActivity, Profile } from '@/lib/api';
import { LayoutDashboard, BarChart3, Wallet, UserPlus, Activity, Users, CheckCircle2, XCircle, ClipboardList, TrendingUp } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState('home');
  const [tasks, setTasks] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [techs, setTechs] = useState<Profile[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [nName, setNName] = useState(''); const [nEmail, setNEmail] = useState(''); const [nPass, setNPass] = useState('');
  const [edit, setEdit] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const [t, r, s, tc, mg, lg] = await Promise.all([getTasks(), getRequests(), getSalaries(), getProfilesByRole('technician'), getProfilesByRole('manager'), getLogs()]);
    setTasks(t); setReqs(r); setSalaries(s); setTechs(tc); setManagers(mg); setLogs(lg); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const rejected = tasks.filter((t) => t.status === 'Rejected').length;
  const inProgress = tasks.filter((t) => ['Accepted', 'On The Way', 'In Progress'].includes(t.status)).length;
  const techName = (id: string) => techs.find((t) => t.id === id)?.name || 'Unknown';

  const perf = techs.map((t) => {
    const done = tasks.filter((x) => x.assigned_technician === t.id && x.status === 'Completed').length;
    const rej = tasks.filter((x) => x.assigned_technician === t.id && x.status === 'Rejected').length;
    return { ...t, done, rej };
  }).sort((a, b) => b.done - a.done);

  const addManager = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await createSubUser(nName, nEmail.trim(), nPass, 'manager', user!.id);
      await logActivity(user!.id, user!.name, `Created manager ${nName}`);
      push('Manager added!', 'success'); setShowAdd(false); setNName(''); setNEmail(''); setNPass(''); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const saveSalary = async () => {
    setBusy(true);
    try {
      await upsertSalary(edit.technician_id, {
        base_salary: Number(edit.base_salary), pay_per_task: Number(edit.pay_per_task),
        completed_tasks: Number(edit.completed_tasks), bonus: Number(edit.bonus), penalty: Number(edit.penalty),
      });
      await logActivity(user!.id, user!.name, `Updated salary for ${techName(edit.technician_id)}`);
      push('Salary updated!', 'success'); setEdit(null); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const liveTotal = edit ? Number(edit.base_salary) + Number(edit.completed_tasks) * Number(edit.pay_per_task) + Number(edit.bonus) - Number(edit.penalty) : 0;

  const nav = [
    { id: 'home', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'perf', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'salary', label: 'Salaries', icon: <Wallet className="w-4 h-4" /> },
    { id: 'managers', label: 'Managers', icon: <Users className="w-4 h-4" /> },
    { id: 'logs', label: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
  ];

  const Bar = ({ label, value, max, color }: any) => (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-slate-500 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
        <div className={`h-full ${color} rounded-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all`} style={{ width: `${max ? (value / max) * 100 : 0}%`, minWidth: value ? '28px' : '0' }}>{value}</div>
      </div>
    </div>
  );
  const maxBar = Math.max(total, 1);

  return (
    <Shell nav={nav} active={tab} onNav={setTab}>
      {loading ? <FullSpinner label="Crunching analytics..." /> : <>
        {tab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-3xl p-8 text-white">
              <h2 className="text-3xl font-bold">Admin Analytics</h2>
              <p className="text-white/85 mt-2">Real-time overview of platform operations and performance.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard icon={<ClipboardList className="w-7 h-7" />} label="Total Tasks" value={total} gradient="from-purple-600 to-violet-600" />
              <StatCard icon={<CheckCircle2 className="w-7 h-7" />} label="Completed" value={completed} gradient="from-emerald-500 to-teal-500" />
              <StatCard icon={<XCircle className="w-7 h-7" />} label="Rejected" value={rejected} gradient="from-red-500 to-rose-500" />
              <StatCard icon={<Users className="w-7 h-7" />} label="Technicians" value={techs.length} gradient="from-orange-500 to-amber-500" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">Task Distribution</h3>
                <div className="space-y-3">
                  <Bar label="Completed" value={completed} max={maxBar} color="bg-emerald-500" />
                  <Bar label="In Progress" value={inProgress} max={maxBar} color="bg-blue-500" />
                  <Bar label="Rejected" value={rejected} max={maxBar} color="bg-red-500" />
                  <Bar label="Assigned" value={tasks.filter((t) => t.status === 'Assigned').length} max={maxBar} color="bg-amber-500" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">Platform Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[['Requests', reqs.length, 'text-purple-600'], ['Managers', managers.length, 'text-blue-600'], ['Technicians', techs.length, 'text-orange-600'], ['Completion Rate', `${total ? Math.round((completed / total) * 100) : 0}%`, 'text-emerald-600']].map(([l, v, c]: any) => (
                    <div key={l} className="bg-slate-50 rounded-xl p-4">
                      <p className={`text-2xl font-bold ${c}`}>{v}</p>
                      <p className="text-xs text-slate-500 mt-1">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'perf' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Technician Performance</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>{['#', 'Technician', 'Completed', 'Rejected', 'Score'].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {perf.map((t, i) => (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{t.name}</td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">{t.done}</td>
                      <td className="px-4 py-3 text-red-500">{t.rej}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{t.done * 10 - t.rej * 3}</span></td>
                    </tr>
                  ))}
                  {perf.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No technicians yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'salary' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Salary Management</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salaries.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="font-bold text-slate-800">{techName(s.technician_id)}</p>
                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <Row l="Base" v={s.base_salary} />
                    <Row l="Tasks × Pay" v={`${s.completed_tasks} × ${s.pay_per_task}`} />
                    <Row l="Bonus" v={`+${s.bonus}`} />
                    <Row l="Penalty" v={`-${s.penalty}`} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total</span>
                    <span className="text-xl font-bold text-purple-600">₹{Number(s.total_salary).toLocaleString()}</span>
                  </div>
                  <button onClick={() => setEdit({ ...s })} className="w-full mt-3 bg-purple-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-purple-700">Edit Salary</button>
                </div>
              ))}
              {salaries.length === 0 && <p className="text-slate-400">No salary records yet.</p>}
            </div>
          </div>
        )}

        {tab === 'managers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Managers</h2>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-purple-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-700"><UserPlus className="w-4 h-4" />Add Manager</button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {managers.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center text-white font-bold text-lg">{m.name[0]?.toUpperCase()}</div>
                  <div><p className="font-semibold text-slate-700">{m.name}</p><p className="text-xs text-slate-400">{m.email}</p></div>
                </div>
              ))}
              {managers.length === 0 && <p className="text-slate-400">No managers yet. Add one!</p>}
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Activity Logs</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
              {logs.map((l) => (
                <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Activity className="w-4 h-4" /></div>
                    <div><p className="text-sm font-medium text-slate-700">{l.action}</p><p className="text-xs text-slate-400">{l.user_name}</p></div>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(l.timestamp).toLocaleString()}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="px-5 py-10 text-center text-slate-400">No activity yet.</p>}
            </div>
          </div>
        )}
      </>}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Manager" accent="from-purple-600 to-violet-600">
        <form onSubmit={addManager} className="space-y-4">
          <Field label="Name" value={nName} onChange={(e) => setNName(e.target.value)} required />
          <Field label="Email" type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} required />
          <Field label="Password" type="password" value={nPass} onChange={(e) => setNPass(e.target.value)} required />
          <button disabled={busy} className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Spinner className="w-5 h-5" />}Create Manager</button>
        </form>
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Salary" accent="from-purple-600 to-violet-600">
        {edit && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{techName(edit.technician_id)}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base Salary" type="number" value={edit.base_salary} onChange={(e) => setEdit({ ...edit, base_salary: e.target.value })} />
              <Field label="Pay / Task" type="number" value={edit.pay_per_task} onChange={(e) => setEdit({ ...edit, pay_per_task: e.target.value })} />
              <Field label="Completed Tasks" type="number" value={edit.completed_tasks} onChange={(e) => setEdit({ ...edit, completed_tasks: e.target.value })} />
              <Field label="Bonus" type="number" value={edit.bonus} onChange={(e) => setEdit({ ...edit, bonus: e.target.value })} />
              <Field label="Penalty" type="number" value={edit.penalty} onChange={(e) => setEdit({ ...edit, penalty: e.target.value })} />
            </div>
            <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700">Computed Total</span>
              <span className="text-2xl font-bold text-purple-600">₹{liveTotal.toLocaleString()}</span>
            </div>
            <button onClick={saveSalary} disabled={busy} className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Spinner className="w-5 h-5" />}Save Salary</button>
          </div>
        )}
      </Modal>
    </Shell>
  );
};

const Row: React.FC<{ l: string; v: any }> = ({ l, v }) => (
  <div className="flex justify-between"><span>{l}</span><span className="text-slate-700 font-medium">{v}</span></div>
);

export default AdminDashboard;
