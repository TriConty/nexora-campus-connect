// Transparent rules-based relevance score (higher = shown first):
//  +5  category matches one of the student's interests
//  +3  registration closes within 72 hours (deadline-first)
//  +2  event starts within 7 days
//  +0..3 popularity from real registrations, saves and views
export function relevanceScore(event, user) {
  const now = Date.now();
  let s = 0;
  if ((user?.interests || []).includes(event.category)) s += 5;
  const dl = event.registration_deadline ? new Date(event.registration_deadline).getTime() : null;
  if (dl && dl > now && dl - now < 72 * 3600000) s += 3;
  const st = new Date(event.start_date).getTime();
  if (st > now && st - now < 7 * 86400000) s += 2;
  const pop = (event.registration_count || 0) * 3 + (event.save_count || 0) * 2 + (event.view_count || 0) * 0.2;
  s += Math.min(3, Math.log10(1 + pop));
  return s;
}

export const rankEvents = (events, user) =>
  [...events].sort((a, b) => relevanceScore(b, user) - relevanceScore(a, user));