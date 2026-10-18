import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { fail } from '../../shared/notify.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail('Please sign in', 401);
    const sr = base44.asServiceRole;
    const { action, event_id } = await req.json();
    const ev = event_id ? await sr.entities.Event.get(event_id).catch(() => null) : null;
    if (!ev) return fail('Event not found', 404);

    if (action === 'view') {
      // One view per signed-in user per event (unique viewers).
      const seen = await sr.entities.EventView.count({ event_id, user_id: user.id });
      if (seen === 0) {
        await sr.entities.EventView.create({ event_id, organizer_id: ev.organizer_id, user_id: user.id });
        await sr.entities.Event.update(event_id, { view_count: await sr.entities.EventView.count({ event_id }) });
      }
      return Response.json({ ok: true });
    }
    if (action === 'toggleSave') {
      const { items } = await sr.entities.SavedEvent.filter({ event_id, user_id: user.id }, { limit: 5 });
      let saved;
      if (items.length) {
        await sr.entities.SavedEvent.deleteMany({ event_id, user_id: user.id });
        saved = false;
      } else {
        await sr.entities.SavedEvent.create({ event_id, user_id: user.id, organizer_id: ev.organizer_id });
        saved = true;
      }
      await sr.entities.Event.update(event_id, { save_count: await sr.entities.SavedEvent.count({ event_id }) });
      return Response.json({ ok: true, saved });
    }
    return fail('Unknown action');
  } catch (error) {
    console.error('trackEngagement failed', error.message);
    return fail(error.message, 500);
  }
}
