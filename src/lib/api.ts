import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Secondary client used to create sub-users WITHOUT replacing the current admin/manager session.
const SUPA_URL = 'https://rrzhmbqesbrggzwckfql.databasepad.com';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5NjZhMGViLWM0Y2ItNDNlYS1hNWIwLWU2YWMxOTVkOTM5YSJ9.eyJwcm9qZWN0SWQiOiJycnpobWJxZXNicmdnendja2ZxbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgyMDQ2NTY0LCJleHAiOjIwOTc0MDY1NjQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.vf2kM5_1iTv4WpEATr8P2M94pCaTiUGGIavur1Y3_mA';

export interface Profile {
  id: string; name: string; email: string; role: string; created_by: string | null; created_at: string;
}

export async function logActivity(userId: string, userName: string, action: string) {
  await supabase.from('activity_logs').insert({ user_id: userId, user_name: userName, action });
}

// Create a sub-user (manager/technician) using a throwaway client so the current session stays intact.
export async function createSubUser(name: string, email: string, password: string, role: string, createdBy: string) {
  const temp = createClient(SUPA_URL, SUPA_KEY, { auth: { storageKey: 'fixora-temp', persistSession: false, autoRefreshToken: false } });
  const { data, error } = await temp.auth.signUp({ email, password, options: { data: { name, role } } });
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('Could not create user');
  const { error: pErr } = await supabase.from('profiles').insert({ id: uid, name, email, role, created_by: createdBy });
  if (pErr) throw pErr;
  if (role === 'technician') {
    await supabase.from('salaries').insert({ technician_id: uid, base_salary: 20000, pay_per_task: 500, completed_tasks: 0, total_salary: 20000 });
  }
  return uid;
}

// ---------- Requests ----------
export const getRequests = async () =>
  (await supabase.from('requests').select('*').order('created_at', { ascending: false })).data || [];

export const getMyRequests = async (customerId: string) =>
  (await supabase.from('requests').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })).data || [];

export const createRequest = async (payload: any) =>
  (await supabase.from('requests').insert(payload).select().single()).data;

// ---------- Tasks ----------
export const getTasks = async () =>
  (await supabase.from('tasks').select('*').order('created_at', { ascending: false })).data || [];

export const getTechTasks = async (techId: string) =>
  (await supabase.from('tasks').select('*').eq('assigned_technician', techId).order('created_at', { ascending: false })).data || [];

export const assignTask = async (payload: any) =>
  (await supabase.from('tasks').insert(payload).select().single()).data;

export const updateTaskStatus = async (id: string, fields: any) =>
  (await supabase.from('tasks').update(fields).eq('id', id).select().single()).data;

// ---------- Salaries ----------
export const getSalaries = async () =>
  (await supabase.from('salaries').select('*')).data || [];

export const upsertSalary = async (techId: string, fields: any) => {
  const total = Number(fields.base_salary) + Number(fields.completed_tasks) * Number(fields.pay_per_task) + Number(fields.bonus) - Number(fields.penalty);
  return (await supabase.from('salaries').update({ ...fields, total_salary: total, updated_at: new Date().toISOString() }).eq('technician_id', techId).select().single()).data;
};

// ---------- Profiles ----------
export const getProfilesByRole = async (role: string) =>
  (await supabase.from('profiles').select('*').eq('role', role).order('created_at', { ascending: false })).data as Profile[] || [];

export const getLogs = async () =>
  (await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(60)).data || [];

// ---------- Realtime ----------
type RTEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export function subscribeTable(
  table: string,
  onChange: (payload: { eventType: RTEvent; new: any; old: any }) => void,
) {
  const channel = supabase
    .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: any) => {
      onChange({ eventType: payload.eventType, new: payload.new, old: payload.old });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
