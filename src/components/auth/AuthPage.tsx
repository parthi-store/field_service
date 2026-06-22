import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, Field, Spinner } from '@/components/shared/UI';
import { Wrench, Mail, Lock, User, ShieldCheck } from 'lucide-react';

const ADMIN_CODE = 'FIXORA-ADMIN';

const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const { push } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        push('Welcome back to Fixora!', 'success');
      } else {
        if (!name.trim()) throw new Error('Name is required');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const role = adminCode.trim() === ADMIN_CODE ? 'admin' : 'customer';
        await register(name.trim(), email.trim(), password, role);
        push(`Account created as ${role}!`, 'success');
      }
    } catch (err: any) {
      push(err.message || 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden p-12 flex-col justify-between text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="flex items-center gap-3 relative">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
          <span className="text-2xl font-bold tracking-tight">Fixora</span>
        </div>
        <div className="relative">
          <h1 className="text-5xl font-extrabold leading-tight">Smart Field Service,<br />Managed Beautifully.</h1>
          <p className="mt-6 text-white/80 text-lg max-w-md">Connect customers, managers, technicians and admins on a single intelligent platform. Assign tasks, track progress and run payroll — all in real time.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            {[['Customers', 'Book services instantly'], ['Managers', 'Assign & supervise tasks'], ['Technicians', 'Work on the go'], ['Admins', 'Analytics & payroll']].map(([t, d]) => (
              <div key={t} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/50 text-sm relative">© 2026 Fixora Platform</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><Wrench className="w-6 h-6" /></div>
            <span className="text-2xl font-bold text-slate-800">Fixora</span>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <p className="text-slate-500 text-sm mt-1">{mode === 'login' ? 'Access your Fixora dashboard' : 'Register as a customer to book services'}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <Field label="Full name" icon={<User className="w-4 h-4" />} value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              )}
              <Field label="Email" icon={<Mail className="w-4 h-4" />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              <Field label="Password" icon={<Lock className="w-4 h-4" />} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              {mode === 'register' && (
                <Field label="Admin code (optional)" icon={<ShieldCheck className="w-4 h-4" />} value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="Leave blank for customer" />
              )}
              <button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 rounded-xl hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60">
                {busy && <Spinner className="w-5 h-5" />} {mode === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-indigo-600 font-semibold hover:underline">
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
            <p className="text-center text-xs text-slate-400 mt-3">Tip: use admin code <span className="font-mono font-semibold">FIXORA-ADMIN</span> to create an admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
