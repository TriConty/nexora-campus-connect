import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { notifyUsers, activeRegistrantIds, audit, fail } from '../../shared/notify.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail('Please sign in', 401);
    if (user.role !== 'admin') return fail('Admins only', 403);
    const sr = base44.asServiceRole;
    const b = await req.json();

    if (b.action === 'verifyOrganizer') {
      if (!['verified', 'rejected', 'pending'].includes(b.status)) return fail('Invalid status');
      const prof = await sr.entities.OrganizerProfile.get(b.id).catch(() => null);
      if (!prof) return fail('Organizer not found', 404);
      await sr.entities.OrganizerProfile.update(prof.id, { verification_status: b.status });
      await audit(sr, user, `organizer_${b.status}`, prof.club_name, prof.user_email);
      await notifyUsers(sr, [prof.user_id], {
        type: 'organizer', title: `Organizer ${b.status}`, message: `Your club "${prof.club_name}" is now ${b.status}.`,
        key: `org-${prof.id}-${b.status}-${Date.now()}`,
      });
      return Response.json({ ok: true });
    }
    if (b.action === 'moderateEvent') {
      if (!['published', 'rejected', 'cancelled'].includes(b.status)) return fail('Invalid status');
      const ev = await sr.entities.Event.get(b.id).catch(() => null);
      if (!ev) return fail('Event not found', 404);
      await sr.entities.Event.update(ev.id, { status: b.status, moderation_note: String(b.note || '').slice(0, 300) });
      await audit(sr, user, `event_${b.status}`, ev.title, b.note);
      if (ev.organizer_id && ev.organizer_id !== 'sample') {
        await notifyUsers(sr, [ev.organizer_id], {
          type: 'moderation', title: `Event ${b.status}`, event_id: ev.id,
          message: `"${ev.title}" was ${b.status} by an admin.${b.note ? ' Note: ' + b.note : ''}`, key: `mod-${ev.id}-${b.status}-${Date.now()}`,
        });
      }
      if (b.status === 'cancelled') {
        const ids = await activeRegistrantIds(sr, ev.id);
        await notifyUsers(sr, ids, {
          type: 'event_cancelled', title: 'Event cancelled', event_id: ev.id,
          message: `"${ev.title}" has been cancelled.`, key: `cxl-${ev.id}`,
        });
      }
      return Response.json({ ok: true });
    }
    if (b.action === 'resolveReport') {
      if (!['resolved', 'dismissed'].includes(b.status)) return fail('Invalid status');
      const r = await sr.entities.Report.update(b.id, { status: b.status });
      await audit(sr, user, `report_${b.status}`, r.event_title, r.reason);
      return Response.json({ ok: true });
    }
    if (b.action === 'category') {
      const name = String(b.name || '').trim();
      if (name.length < 2 || name.length > 40) return fail('Category name must be 2–40 characters');
      if (b.op === 'add') {
        if (await sr.entities.EventCategory.count({ name })) return fail('Category already exists', 409);
        await sr.entities.EventCategory.create({ name });
      } else if (b.op === 'remove') {
        if (await sr.entities.Event.count({ category: name })) return fail('Category is used by events');
        await sr.entities.EventCategory.deleteMany({ name });
      } else return fail('Unknown op');
      await audit(sr, user, `category_${b.op}`, name, '');
      return Response.json({ ok: true });
    }
    return fail('Unknown action');
  } catch (error) {
    console.error('adminAction failed', error.message);
    return fail(error.message, 500);
  }
}
