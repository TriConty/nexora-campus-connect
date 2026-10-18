import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { notifyUsers, activeRegistrantIds, audit, fail } from '../../shared/notify.ts';

const FIELDS = ['title', 'short_description', 'description', 'schedule', 'category', 'format', 'cover_image', 'gallery',
  'venue', 'location_details', 'start_date', 'end_date', 'registration_opens', 'registration_deadline', 'capacity', 'fee',
  'eligibility', 'eligible_years', 'eligible_departments', 'prerequisites', 'external_link', 'custom_questions', 'cancellation_allowed'];

async function profileOf(sr, userId) {
  const { items } = await sr.entities.OrganizerProfile.filter({ user_id: userId }, { limit: 1 });
  return items[0];
}

async function apply(sr, user, b) {
  const club = String(b.club_name || '').trim();
  if (club.length < 2 || club.length > 80) return fail('Enter your club name');
  const data = { club_name: club, description: String(b.description || '').slice(0, 1000), contact: String(b.contact || '').slice(0, 200) };
  const existing = await profileOf(sr, user.id);
  if (existing) {
    await sr.entities.OrganizerProfile.update(existing.id, data);
  } else {
    await sr.entities.OrganizerProfile.create({ ...data, user_id: user.id, user_email: user.email, verification_status: 'pending' });
  }
  return Response.json({ ok: true });
}

async function validate(sr, d) {
  if (!d.title || d.title.trim().length < 3 || d.title.length > 120) return 'Title must be 3–120 characters';
  if (!d.category) return 'Choose a category';
  const okCat = await sr.entities.EventCategory.count({ name: d.category });
  if (!okCat) return 'Unknown category';
  if (!['Offline', 'Online', 'Hybrid'].includes(d.format)) return 'Choose a format';
  if (!d.venue || !d.venue.trim()) return 'Add a venue or meeting link';
  if (!d.start_date || isNaN(new Date(d.start_date))) return 'Add a valid start date';
  if (d.registration_deadline && new Date(d.registration_deadline) > new Date(d.start_date)) return 'Deadline must be before the event starts';
  if (d.registration_opens && d.registration_deadline && new Date(d.registration_opens) > new Date(d.registration_deadline)) return 'Registration must open before it closes';
  if (d.capacity != null && (isNaN(d.capacity) || d.capacity < 0)) return 'Capacity must be 0 or more';
  if (d.fee != null && (isNaN(d.fee) || d.fee < 0)) return 'Fee must be 0 or more';
  if (d.external_link && !/^https?:\/\//i.test(d.external_link)) return 'External link must start with http(s)://';
  return null;
}

async function saveEvent(sr, user, b) {
  const prof = await profileOf(sr, user.id);
  if (!prof || prof.verification_status === 'rejected') return fail('Organizer access required', 403);
  const d = {};
  for (const k of FIELDS) if (b.event?.[k] !== undefined) d[k] = b.event[k];
  const err = await validate(sr, d);
  if (err) return fail(err);
  if (b.event?.id) {
    const ev = await sr.entities.Event.get(b.event.id).catch(() => null);
    if (!ev || (ev.organizer_id !== user.id && user.role !== 'admin')) return fail('Not allowed', 403);
    const saved = await sr.entities.Event.update(ev.id, d);
    if (ev.status === 'published' && (ev.venue !== d.venue || ev.start_date !== d.start_date)) {
      const ids = await activeRegistrantIds(sr, ev.id);
      await notifyUsers(sr, ids, {
        type: 'event_update', title: 'Event details changed', event_id: ev.id,
        message: `"${d.title}" has updated date/venue: ${d.venue}.`, key: `upd-${ev.id}-${d.start_date}-${d.venue}`,
      });
    }
    return Response.json({ ok: true, event: saved });
  }
  const created = await sr.entities.Event.create({
    ...d, status: 'draft', organizer_id: user.id, organizer_name: prof.club_name,
    registration_count: 0, save_count: 0, view_count: 0, is_sample: false,
  });
  return Response.json({ ok: true, event: created });
}

async function setStatus(sr, user, b) {
  const ev = await sr.entities.Event.get(b.id).catch(() => null);
  if (!ev || ev.organizer_id !== user.id) return fail('Not allowed', 403);
  const prof = await profileOf(sr, user.id);
  if (!prof || prof.verification_status === 'rejected') return fail('Organizer access required', 403);
  let status;
  if (b.to === 'publish') {
    if (ev.status === 'rejected' || ev.status === 'cancelled') return fail('This event cannot be published');
    status = prof.verification_status === 'verified' ? 'published' : 'pending';
  } else if (b.to === 'unpublish') status = 'draft';
  else if (b.to === 'cancel') status = 'cancelled';
  else return fail('Unknown status');
  await sr.entities.Event.update(ev.id, { status });
  if (status === 'cancelled') {
    const ids = await activeRegistrantIds(sr, ev.id);
    await notifyUsers(sr, ids, {
      type: 'event_cancelled', title: 'Event cancelled', event_id: ev.id,
      message: `"${ev.title}" has been cancelled by the organizer.`, key: `cxl-${ev.id}`,
    });
  }
  return Response.json({ ok: true, status });
}

async function checkIn(sr, user, b) {
  const reg = await sr.entities.Registration.get(b.registration_id).catch(() => null);
  if (!reg || (reg.organizer_id !== user.id && user.role !== 'admin')) return fail('Not allowed', 403);
  if (reg.status !== 'registered') return fail('Registration is cancelled');
  const attended = !!b.attended;
  await sr.entities.Registration.update(reg.id, { attended, checked_in_at: attended ? new Date().toISOString() : null });
  return Response.json({ ok: true });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail('Please sign in', 401);
    const sr = base44.asServiceRole;
    const body = await req.json();
    if (body.action === 'apply') return await apply(sr, user, body);
    if (body.action === 'saveEvent') return await saveEvent(sr, user, body);
    if (body.action === 'setStatus') return await setStatus(sr, user, body);
    if (body.action === 'checkIn') return await checkIn(sr, user, body);
    return fail('Unknown action');
  } catch (error) {
    console.error('organizerAction failed', error.message);
    return fail(error.message, 500);
  }
}
