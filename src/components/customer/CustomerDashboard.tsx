import React, { useEffect, useState } from 'react';
import Shell from '@/components/shared/Shell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, Badge, FullSpinner, StatCard } from '@/components/shared/UI';
import { createRequest, getMyRequests, logActivity } from '@/lib/api';
import { LayoutDashboard, PlusCircle, MapPin, Phone, Clock, FileText, ListChecks, CheckCircle2, Timer, Wrench } from 'lucide-react';

const ISSUES = ['Plumbing', 'Electrical', 'AC Repair', 'Appliance Repair', 'Carpentry', 'Painting', 'Pest Control', 'Cleaning'];

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState('home');
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', location: '', issue: ISSUES[0], preferred_time: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => { setLoading(true); setReqs(await getMyRequests(user!.id)); setLoading(false); };
  useEffect(() => { load(); setForm((f) => ({ ...f, name: user!.name })); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    if (!form.phone || !form.location) { push('Phone and location are required', 'error'); return; }
    setBusy(true);
    try {
      await createRequest({ ...form, customer_id: user!.id, status: 'Pending' });
      await logActivity(user!.id, user!.name, `Submitted request: ${form.issue}`);
      push('Service request submitted!', 'success');
      setForm({ name: user!.name, phone: '', location: '', issue: ISSUES[0], preferred_time: '' });
      setTab('requests'); load();
    } catch (e: any) { push(e.message, 'error'); } finally { setBusy(false); }
  };

  const stats = {
    total: reqs.length,
    active: reqs.filter((r) => !['Completed', 'Rejected'].includes(r.status)).length,
    done: reqs.filter((r) => r.status === 'Completed').length,
  };

  const nav = [
    { id: 'home', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'new', label: 'Book Service', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'requests', label: 'My Requests', icon: <ListChecks className="w-4 h-4" /> },
  ];

  return (
    <Shell nav={nav} active={tab} onNav={setTab}>
      {tab === 'home' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <h2 className="text-3xl font-bold relative">Hi {user!.name.split(' ')[0]}, need a fix?</h2>
            <p className="text-white/85 mt-2 relative max-w-lg">Book trusted technicians for plumbing, electrical, AC and more — track every step in real time.</p>
            <button onClick={() => setTab('new')} className="mt-6 bg-white text-sky-600 font-semibold px-6 py-3 rounded-xl hover:bg-sky-50 transition relative inline-flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> Book a Service
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <StatCard icon={<FileText className="w-7 h-7" />} label="Total Requests" value={stats.total} gradient="from-sky-500 to-cyan-500" />
            <StatCard icon={<Timer className="w-7 h-7" />} label="In Progress" value={stats.active} gradient="from-amber-500 to-orange-500" />
            <StatCard icon={<CheckCircle2 className="w-7 h-7" />} label="Completed" value={stats.done} gradient="from-emerald-500 to-teal-500" />
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {ISSUES.map((i) => (
              <button key={i} onClick={() => { setForm((f) => ({ ...f, issue: i })); setTab('new'); }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition text-left">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3"><Wrench /></div>
                <p className="font-semibold text-slate-700">{i}</p>
                <p className="text-xs text-slate-400 mt-1">Book now</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Book a Service</h2>
          <p className="text-slate-500 mb-6">Tell us what you need and we'll assign a technician.</p>
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <Inp label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Inp label="Phone number" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Inp label="Location / Address" icon={<MapPin className="w-4 h-4" />} value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <label className="block">
              <span className="text-sm font-medium text-slate-600 mb-1.5 block">Issue type</span>
              <select value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none">
                {ISSUES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </label>
            <Inp label="Preferred time" icon={<Clock className="w-4 h-4" />} value={form.preferred_time} onChange={(v) => setForm({ ...form, preferred_time: v })} placeholder="e.g. Tomorrow 10 AM" />
            <button disabled={busy} className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-95 transition disabled:opacity-60">
              {busy ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {tab === 'requests' && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">My Requests</h2>
          {loading ? <FullSpinner /> : reqs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <p className="text-slate-400">No requests yet. Book your first service!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {reqs.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">{r.issue}</h3>
                    <Badge value={r.status} />
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{r.location}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Clock className="w-4 h-4" />{r.preferred_time || 'Flexible'}</p>
                  <p className="text-xs text-slate-400 mt-3">Booked {new Date(r.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
};

const Inp: React.FC<{ label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode; placeholder?: string }> = ({ label, value, onChange, icon, placeholder }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-600 mb-1.5 block">{label}</span>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none`} />
    </div>
  </label>
);

export default CustomerDashboard;
