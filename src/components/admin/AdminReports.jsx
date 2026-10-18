import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';
import { callFn } from '@/lib/api';

export default function AdminReports() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['adminReports'], queryFn: async () => (await base44.entities.Report.filter({}, { sort: '-created_date', limit: 100 })).items });
  const act = async (id, status) => {
    try { await callFn('adminAction', { action: 'resolveReport', id, status }); ['adminReports', 'adminStats', 'adminAudit'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); }
    catch (e) { toast.error(e.message); }
  };
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data.length) return <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No reports. 🎉</p>;
  return (
    <div className="space-y-2">
      {data.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
          <div className="min-w-0 flex-1"><Link to={`/events/${r.event_id}`} className="font-semibold hover:underline">{r.event_title}</Link>
            <p className="text-sm text-muted-foreground">{r.reason}{r.details ? ` — ${r.details}` : ''}</p></div>
          <Badge variant={r.status === 'open' ? 'destructive' : 'secondary'}>{r.status}</Badge>
          {r.status === 'open' && <><Button size="sm" onClick={() => act(r.id, 'resolved')}>Resolve</Button><Button size="sm" variant="outline" onClick={() => act(r.id, 'dismissed')}>Dismiss</Button></>}
        </div>
      ))}
    </div>
  );
}