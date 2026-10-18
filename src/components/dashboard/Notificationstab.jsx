import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function NotificationsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifs', 'list', user.id],
    queryFn: async () => (await base44.entities.Notification.filter({ user_id: user.id }, { sort: '-created_date', limit: 50 })).items,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifs'] });
  const markAll = async () => { await base44.entities.Notification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } }); refresh(); };
  const markOne = async (n) => { if (!n.read) { await base44.entities.Notification.update(n.id, { read: true }); refresh(); } };
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!data.length) return (
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <Bell className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 font-semibold">You're all caught up</p>
      <p className="text-sm text-muted-foreground">Registration, reminder and event-change alerts will appear here.</p>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={markAll}>Mark all as read</Button></div>
      {data.map((n) => (
        <Link key={n.id} to={n.event_id ? `/events/${n.event_id}` : '#'} onClick={() => markOne(n)}
          className={`block rounded-2xl border p-4 transition-colors hover:bg-secondary ${n.read ? 'bg-card' : 'border-[hsl(var(--brand))]/40 bg-accent'}`}>
          <div className="flex justify-between gap-2"><p className="font-semibold">{n.title}</p><span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}</span></div>
          <p className="text-sm text-muted-foreground">{n.message}</p>
        </Link>
      ))}
    </div>
  );
}