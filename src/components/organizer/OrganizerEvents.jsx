import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { callFn } from '@/lib/api';
import { fmtDate } from '@/lib/eventUtils';

export default function OrganizerEvents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['orgEvents', user.id],
    queryFn: async () => (await base44.entities.Event.filter({ organizer_id: user.id }, { sort: '-created_date', limit: 100 })).items,
  });
  const act = async (id, to) => {
    try {
      const r = await callFn('organizerAction', { action: 'setStatus', id, to });
      toast.success(r.status === 'pending' ? 'Submitted for admin approval' : `Event ${r.status}`);
      qc.invalidateQueries({ queryKey: ['orgEvents'] });
    } catch (e) { toast.error(e.message); }
  };
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button asChild className="bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90"><Link to="/organizer/events/new"><Plus className="mr-1 h-4 w-4" />New event</Link></Button></div>
      {data.length === 0 && <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No events yet. Create your first one.</p>}
      {data.map((e) => (
        <div key={e.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold">{e.title}</p>
            <p className="text-sm text-muted-foreground">{fmtDate(e.start_date)} · {e.registration_count || 0} registered · {e.view_count || 0} views · {e.save_count || 0} saves</p>
            <Badge className="mt-1 capitalize" variant={e.status === 'published' ? 'default' : 'secondary'}>{e.status}</Badge>
            {e.moderation_note && <p className="mt-1 text-xs text-destructive">Admin note: {e.moderation_note}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to={`/organizer/events/${e.id}`}>Edit</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to={`/organizer/events/${e.id}/registrants`}>Registrants</Link></Button>
            {['draft', 'rejected'].includes(e.status) && e.status !== 'rejected' && <Button size="sm" onClick={() => act(e.id, 'publish')}>Publish</Button>}
            {['published', 'pending'].includes(e.status) && <Button variant="outline" size="sm" onClick={() => act(e.id, 'unpublish')}>Unpublish</Button>}
            {['published', 'pending', 'draft'].includes(e.status) && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive">Cancel event</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Cancel "{e.title}"?</AlertDialogTitle><AlertDialogDescription>All registered students will be notified. This can't be undone.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Keep event</AlertDialogCancel><AlertDialogAction onClick={() => act(e.id, 'cancel')}>Cancel event</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}