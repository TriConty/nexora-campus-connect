import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { notifyUsers, fail } from '../../shared/notify.ts';

async function recount(sr, eventId) {
  const n = await sr.entities.Registration.count({ event_id: eventId, status: 'registered' });
  await sr.entities.Event.update(eventId, { registration_count: n });
  return n;
}

async function register(sr, user, b) {
  const ev = b.event_id ? await sr.entities.Event.get(b.event_id).catch(() => null) : null;
  if (!ev || ev.status !== 'published') return fail('This event is not open for registration', 404);
  const now = new Date();
  if (ev.registration_opens && new Date(ev.registration_opens) > now) return fail('Registration has not opened yet');
  const deadline = ev.registration_deadline || ev.start_date;
  if (deadline && new Date(deadline) < now) return fail('The registration deadline has passed');
  if (ev.eligible_years?.length) {
    if (!user.academic_year) return fail('Add your academic year in your profile to check eligibility');
    if (!ev.eligible_years.includes(String(user.academic_year))) return fail(`Open to year ${ev.eligible_years.join(', ')} students only`);
  }
  if (ev.eligible_departments?.length) {
    if (!user.department) return fail('Add your department in your profile to check eligibility');
    if (!ev.eligible_departments.includes(user.department)) return fail(`Open to ${ev.eligible_departments.join(', ')} only`);
  }
  const phone = String(b.phone || '').trim();
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) return fail('Enter a valid phone number');
  const answers = [];
  for (const q of ev.custom_questions || []) {
    const hit = (b.answers || []).find((a) => a.question === q.label);
    const ans = String(hit?.answer || '').trim().slice(0, 500);
    if (q.required && !ans) return fail(`Please answer: ${q.label}`);
    answers.push({ question: q.label, answer: ans });
  }
  const dup = await sr.entities.Registration.count({ event_id: ev.id, user_id: user.id, status: 'registered' });
  if (dup > 0) return fail('You are already registered for this event', 409);
  const cap = Number(ev.capacity) || 0;
  if (cap && (await sr.entities.Registration.count({ event_id: ev.id, status: 'registered' })) >= cap) return fail('This event is full', 409);

  const reg = await sr.entities.Registration.create({
    event_id: ev.id, event_title: ev.title, organizer_id: ev.organizer_id, user_id: user.id,
    user_name: user.full_name || user.email, user_email: user.email, phone,
    roll_number: String(b.roll_number || '').slice(0, 30), department: user.department || '',
    answers, status: 'registered', attended: false,
  });
  // Concurrency guard: re-check after insert and roll back if we overshot capacity or duplicated.
  const total = await sr.entities.Registration.count({ event_id: ev.id, status: 'registered' });
  const mine = await sr.entities.Registration.filter({ event_id: ev.id, user_id: user.id, status: 'registered' }, { sort: 'created_date', limit: 5 });
  const overCap = cap && total > cap;
  const lostDupRace = mine.items.length > 1 && mine.items[0].id !== reg.id;
  if (overCap || lostDupRace) {
    await sr.entities.Registration.delete(reg.id);
    await recount(sr, ev.id);
    return fail(lostDupRace ? 'You are already registered for this event' : 'This event just filled up', 409);
  }
  await recount(sr, ev.id);
  await notifyUsers(sr, [user.id], {
    type: 'registration', title: 'Registration confirmed', event_id: ev.id,
    message: `You're in for "${ev.title}" — see you at ${ev.venue || 'the venue'}.`, key: `reg-${reg.id}`,
  });
  return Response.json({ ok: true, registration: reg });
}

async function cancel(sr, user, b) {
  const { items } = await sr.entities.Registration.filter({ event_id: b.event_id, user_id: user.id, status: 'registered' }, { limit: 1 });
  const reg = items[0];
  if (!reg) return fail('No active registration found', 404);
  const ev = await sr.entities.Event.get(b.event_id);
  if (ev.cancellation_allowed === false) return fail('The organizer does not allow cancellations for this event');
  if (new Date(ev.start_date) < new Date()) return fail('This event has already started');
  await sr.entities.Registration.update(reg.id, { status: 'cancelled', cancelled_at: new Date().toISOString() });
  await recount(sr, ev.id);
  await notifyUsers(sr, [user.id], {
    type: 'cancellation', title: 'Registration cancelled', event_id: ev.id,
    message: `You cancelled your registration for "${ev.title}".`, key: `cancel-${reg.id}`,
  });
  return Response.json({ ok: true });
}

async function syncReminders(sr, user) {
  if (user.notify_reminders === false) return Response.json({ ok: true, created: 0, skipped: 'disabled' });
  const hours = Number(user.reminder_hours) || 24;
  const now = Date.now();
  const regs = await sr.entities.Registration.filter({ user_id: user.id, status: 'registered' }, { limit: 200, fields: ['event_id'] });
  const saved = await sr.entities.SavedEvent.filter({ user_id: user.id }, { limit: 200, fields: ['event_id'] });
  const regIds = new Set(regs.items.map((r) => r.event_id));
  const ids = [...new Set([...regIds, ...saved.items.map((s) => s.event_id)])];
  if (!ids.length) return Response.json({ ok: true, created: 0 });
  const { items: events } = await sr.entities.Event.filter({ id: { $in: ids }, status: 'published' }, { limit: 200 });
  let created = 0;
  for (const ev of events) {
    const start = new Date(ev.start_date).getTime();
    if (regIds.has(ev.id) && start > now && start - now <= hours * 3600000) {
      created += await notifyUsers(sr, [user.id], {
        type: 'event_reminder', title: 'Event coming up', event_id: ev.id,
        message: `"${ev.title}" starts soon at ${ev.venue || 'the venue'}.`, key: `rem-${ev.id}`,
      });
    } else if (!regIds.has(ev.id) && ev.registration_deadline) {
      const dl = new Date(ev.registration_deadline).getTime();
      if (dl > now && dl - now <= 48 * 3600000) {
        created += await notifyUsers(sr, [user.id], {
          type: 'deadline_reminder', title: 'Registration closing soon', event_id: ev.id,
          message: `Registration for "${ev.title}" closes in under 48 hours.`, key: `dl-${ev.id}`,
        });
      }
    }
  }
  return Response.json({ ok: true, created });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail('Please sign in', 401);
    const sr = base44.asServiceRole;
    const body = await req.json();
    if (body.action === 'register') return await register(sr, user, body);
    if (body.action === 'cancel') return await cancel(sr, user, body);
    if (body.action === 'syncReminders') return await syncReminders(sr, user);
    return fail('Unknown action');
  } catch (error) {
    console.error('registerForEvent failed', error.message);
    return fail(error.message, 500);
  }
}
