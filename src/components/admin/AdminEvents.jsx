import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';
import { callFn } from '@/lib/api';
import { fmtDate } from '@/lib/eventUtils';

export default function AdminEvents() {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['adminEvents'], queryFn: async () => (await base44.entities.Event.filter({}, { sort: '-created_date', limit: 200 })).items });
  const act = async (id, status) => {
    try { await callFn('adminAction', { action: 'moderateEvent', id, status, note }); toast.success(`Event ${status}`); setNote(''); ['adminEvents', 'adminStats', 'adminAudit'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); }
    catch (e) { toast.error(e.message); }
  };
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  const keyOf = (e) => `${e.title.toLowerCase().trim()}|${e.start_date?.slice(0, 10)}`;
  const counts = data.reduce((m, e) => ({ ...m, [keyOf(e)]: (m[keyOf(e)] || 0) + 1 }), {});
  const sorted = [...data].sort((a, b) => (b.status === 'pending') - (a.status === 'pending'));
  return (
    <div className="space-y-3">
      <Input placeholder="Optional note sent to the organizer with your decision" value={note} onChange={(e) => setNote(e.target.value)} />
      {sorted.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
          <div className="min-w-0 flex-1">
            <Link to={`/events/${e.id}`} className="font-semibold hover:underline">{e.title}</Link>
            <p className="text-xs text-muted-foreground">{e.organizer_name} · {fmtDate(e.start_date)}</p>
            <div className="mt-1 flex gap-1"><Badge variant={e.status === 'published' ? 'default' : 'secondary'} className="capitalize">{e.status}</Badge>
              {counts[keyOf(e)] > 1 && <Badge variant="destructive">Possible duplicate</Badge>}{e.is_sample && <Badge variant="outline">Sample</Badge>}</div>
          </div>
          {e.status !== 'published' && e.status !== 'cancelled' && <Button size="sm" onClick={() => act(e.id, 'published')}>Approve</Button>}
          {['pending', 'published'].includes(e.status) && <Button size="sm" variant="outline" onClick={() => act(e.id, 'rejected')}>Reject</Button>}
          {e.status !== 'cancelled' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act(e.id, 'cancelled')}>Cancel</Button>}
        </div>
      ))}
    </div>
  );
}