import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { logActivity, Profile } from '@/lib/api';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const registering = useRef(false);

  const loadProfile = useCallback(async (uid: string, email: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) { setUser(data as Profile); return data as Profile; }
    const fallback = { id: uid, name: email.split('@')[0], email, role: 'customer', created_by: null, created_at: new Date().toISOString() };
    await supabase.from('profiles').upsert(fallback, { onConflict: 'id', ignoreDuplicates: true });
    setUser(fallback as Profile);
    return fallback as Profile;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) await loadProfile(data.session.user.id, data.session.user.email || '');
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (registering.current) return;
      if (session?.user) loadProfile(session.user.id, session.user.email || '');
      else setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const p = await loadProfile(data.user.id, data.user.email || '');
      await logActivity(data.user.id, p.name, 'Logged in');
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    registering.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, name, email, role, created_by: null }, { onConflict: 'id' });
        if (role === 'technician') {
          await supabase.from('salaries').upsert({ technician_id: data.user.id, base_salary: 20000, pay_per_task: 500, total_salary: 20000 }, { onConflict: 'technician_id', ignoreDuplicates: true });
        }
        await logActivity(data.user.id, name, `Registered as ${role}`);
        setUser({ id: data.user.id, name, email, role, created_by: null, created_at: new Date().toISOString() });
      }
    } finally {
      registering.current = false;
    }
  };

  const logout = async () => {
    if (user) await logActivity(user.id, user.name, 'Logged out');
    await supabase.auth.signOut();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};
