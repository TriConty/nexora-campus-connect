// Shared helpers: de-duplicated in-app notifications with real email + push delivery, and audit logging.

const REMINDER_TYPES = new Set(['event_reminder', 'deadline_reminder']);

export async function notifyUsers(sr, userIds, n) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return 0;
  const keyFor = (id) => `${n.key}:${id}`;
  const { items } = await sr.entities.Notification.filter(
    { dedupe_key: { $in: ids.map(keyFor) } },
    { limit: 1000, fields: ['dedupe_key'] },
  );
  const have = new Set(items.map((i) => i.dedupe_key));
  const newIds = ids.filter((id) => !have.has(keyFor(id)));
  if (!newIds.length) return 0;
  const rows = newIds.map((id) => ({
    user_id: id, type: n.type, title: n.title, message: n.message,
    event_id: n.event_id, dedupe_key: keyFor(id), read: false,
  }));
  await sr.entities.Notification.bulkCreate(rows);
  await deliver(sr, newIds, n);
  return newIds.length;
}

// Send real email + push to users who opted in. Only called for newly-notified users.
async function deliver(sr, newIds, n) {
  const isReminder = REMINDER_TYPES.has(n.type);
  await Promise.all(newIds.map(async (id) => {
    try {
      const u = await sr.entities.User.get(id).catch(() => null);
      if (!u) return;
      const remindersOn = u.notify_reminders !== false;
      const emailOn = u.notify_email !== false && (!isReminder || remindersOn);
      const pushOn = u.notify_push === true && (!isReminder || remindersOn);
      if (emailOn && u.email) {
        await sr.integrations.Core.SendEmail({
          to: u.email, subject: n.title, text: `${n.message}\n\n— Nexora`,
        }).catch((e) => console.error('notify email failed', e.message));
      }
      if (pushOn) {
        await sr.integrations.Core.SendPushNotification({
          user_id: id, title: n.title, content: n.message,
        }).catch((e) => console.error('notify push failed', e.message));
      }
    } catch (e) {
      console.error('notify delivery failed', e.message);
    }
  }));
}

export async function audit(sr, actor, action, target, details) {
  await sr.entities.AuditLog.create({
    actor_id: actor.id, actor_email: actor.email, action, target: String(target || ''), details: details || '',
  });
}

export async function activeRegistrantIds(sr, eventId) {
  const { items } = await sr.entities.Registration.filter(
    { event_id: eventId, status: 'registered' }, { limit: 1000, fields: ['user_id'] },
  );
  return items.map((r) => r.user_id);
}

export const fail = (message, status = 400) => Response.json({ error: message }, { status });
