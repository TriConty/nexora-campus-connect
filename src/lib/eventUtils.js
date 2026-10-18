import { differenceInSeconds, format } from 'date-fns';

export const CATEGORIES = [
  'Hackathon', 'Workshop', 'Startup', 'Cultural', 'Sports', 'Guest Lecture', 'Club Recruitment',
];

export const FORMATS = ['Offline', 'Online', 'Hybrid'];

export const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'upcoming', label: 'Upcoming date' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
];

export const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=70';

export function countdown(target) {
  if (!target) return null;
  const secs = differenceInSeconds(new Date(target), new Date());
  if (secs <= 0) return { over: true, text: 'Closed', urgent: false };
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const text = d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  return { over: false, text, urgent: secs < 86400 * 2 };
}

export function fmtDate(d) {
  return d ? format(new Date(d), 'EEE, d MMM · h:mm a') : '';
}

export function fmtDay(d) {
  return d ? format(new Date(d), 'd MMM yyyy') : '';
}

export function registrationState(event, alreadyRegistered) {
  const now = new Date();
  if (event.status === 'cancelled') return { open: false, reason: 'Event cancelled' };
  if (alreadyRegistered) return { open: false, reason: 'You are registered' };
  if (event.registration_opens && new Date(event.registration_opens) > now)
    return { open: false, reason: 'Registration not open yet' };
  const deadline = event.registration_deadline || event.start_date;
  if (deadline && new Date(deadline) < now) return { open: false, reason: 'Registration closed' };
  if (event.capacity && (event.registration_count || 0) >= event.capacity)
    return { open: false, reason: 'Event is full' };
  return { open: true, reason: '' };
}