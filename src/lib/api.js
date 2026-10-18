import { base44 } from '@/api/base44Client';
import { addDays } from 'date-fns';

export async function callFn(name, payload) {
  try {
    const res = await base44.functions.invoke(name, payload);
    return res.data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || e.message || 'Something went wrong');
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rx = (s) => ({ $regex: esc(s.trim()), $options: 'i' });

export const SORT_MAP = {
  relevance: 'registration_deadline',
  upcoming: 'start_date',
  newest: '-created_date',
  popular: '-registration_count',
};

export const EMPTY_FILTERS = { q: '', category: '', format: '', club: '', venue: '', when: '', reg: '', sort: 'relevance' };

export function buildEventQuery(f) {
  const now = new Date();
  const q = { status: 'published', start_date: { $gte: now.toISOString() } };
  if (f.category) q.category = f.category;
  if (f.format) q.format = f.format;
  if (f.club?.trim()) q.organizer_name = rx(f.club);
  if (f.venue?.trim()) q.venue = rx(f.venue);
  if (f.when === 'week') q.start_date = { $gte: now.toISOString(), $lte: addDays(now, 7).toISOString() };
  if (f.when === 'month') q.start_date = { $gte: now.toISOString(), $lte: addDays(now, 30).toISOString() };
  if (f.reg === 'open') q.registration_deadline = { $gte: now.toISOString() };
  if (f.reg === 'closed') q.registration_deadline = { $lt: now.toISOString() };
  if (f.q?.trim()) {
    q.$or = ['title', 'organizer_name', 'short_description', 'category', 'description'].map((k) => ({ [k]: rx(f.q) }));
  }
  return q;
}

export const isFiltering = (f) => Object.entries(f).some(([k, v]) => k !== 'sort' && v);
