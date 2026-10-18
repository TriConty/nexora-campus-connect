import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Countdown from '@/components/events/Countdown';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { callFn } from '@/lib/api';
import { downloadIcs } from '@/lib/ics';
import { fmtDate } from '@/lib/eventUtils';

function status(r) {
  if (r.status === 'cancelled') return ['Cancelled', 'secondary'];
  if (r.event.status === 'cancelled') return ['Event cancelled', 'destructive'];
  if (r.attended) return ['Attended', 'default'];
  if (new Date(r.event.start_date) < new Date()) return ['Completed', 'secondary'];
  return ['Registered', 'default'];
}

function Row({ r, onCancel }) {
  const [label, variant] = status(r);
  const upcoming = r.status === 'registered' && new Date(r.event.start_date) > new Date() && r.event.status !== 'cancelled';
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link to={`/events/${r.event.id}`} className="font-heading font-bold hover:underline">{r.event.title}</Link>
        <p className="text-sm text-muted-foreground">{fmtDate(r.event.start_date)} · {r.event.venue}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          {upcoming && <Countdown target={r.event.start_date} label="Starts" />}
        </div>
      </div>
      {upcoming && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadIcs(r.event)}><CalendarPlus className="mr-1 h-4 w-4" />Calendar</Button>
          {r.event.cancellation_allowed !== false && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive">Cancel</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Cancel registration?</AlertDialogTitle><AlertDialogDescription>"{r.event.title}" — your seat will be released.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={() => onCancel(r)}>Yes, cancel</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}

export default function RegistrationsTab() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useMyRegistrations();
  const cancel = async (r) => {
    try {
      await callFn('registerForEvent', { action: 'cancel', event_id: r.event_id });
      toast.success('Registration cancelled');
      ['myRegs', 'eventState', 'notifs'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    } catch (e) { toast.error(e.message); }
  };
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError) return <Button variant="outline" onClick={refetch}>Couldn't load — retry</Button>;
  const now = new Date();
  const upcoming = data.filter((r) => r.status === 'registered' && new Date(r.event.start_date) >= now && r.event.status !== 'cancelled')
    .sort((a, b) => new Date(a.event.start_date) - new Date(b.event.start_date));
  const history = data.filter((r) => !upcoming.includes(r));
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No upcoming registrations yet. <Link to="/" className="font-semibold text-[hsl(var(--brand))]">Discover events</Link></p>}
        {upcoming.map((r) => <Row key={r.id} r={r} onCancel={cancel} />)}
      </section>
      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">History</h2>
          {history.map((r) => <Row key={r.id} r={r} onCancel={cancel} />)}
        </section>
      )}
    </div>
  );
}