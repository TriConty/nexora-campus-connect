import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, CalendarPlus, ExternalLink, MapPin, ShieldCheck, Users, IndianRupee, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Countdown from '@/components/events/Countdown';
import RegisterDialog from '@/components/events/RegisterDialog';
import ReportDialog from '@/components/events/ReportDialog';
import EventRail from '@/components/events/EventRail';
import { useEventState } from '@/hooks/useEventState';
import { callFn } from '@/lib/api';
import { downloadIcs } from '@/lib/ics';
import { FALLBACK_COVER, fmtDate, registrationState } from '@/lib/eventUtils';

function Fact({ icon: Icon, children }) {
  return <li className="flex items-start gap-2 text-sm"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand))]" /><span>{children}</span></li>;
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const state = useEventState();
  const [open, setOpen] = useState(false);
  const { data: event, isLoading, isError } = useQuery({ queryKey: ['event', id], queryFn: () => base44.entities.Event.get(id), retry: false });
  const { data: org } = useQuery({
    queryKey: ['org', event?.organizer_id], enabled: !!event?.organizer_id,
    queryFn: async () => (await base44.entities.OrganizerProfile.filter({ user_id: event.organizer_id }, { limit: 1 })).items[0],
  });

  useEffect(() => {
    if (event && user && event.status === 'published') callFn('trackEngagement', { action: 'view', event_id: id }).catch(() => {});
  }, [event?.id, user?.id]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-72 w-full" /><Skeleton className="h-40 w-full" /></div>;
  if (isError || !event) {
    return <div className="py-20 text-center"><p className="font-heading text-xl font-bold">Event not found</p><Button asChild variant="outline" className="mt-4"><Link to="/">Back to discover</Link></Button></div>;
  }
  const registered = state.reg.has(event.id);
  const rs = registrationState(event, registered);
  const left = event.capacity ? Math.max(event.capacity - (event.registration_count || 0), 0) : null;

  const cancel = async () => {
    try {
      await callFn('registerForEvent', { action: 'cancel', event_id: event.id });
      toast.success('Registration cancelled');
      ['event', 'eventState', 'myRegs'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All events</Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-muted">
            <Image src={event.cover_image || FALLBACK_COVER} alt={`${event.title} poster`} className="aspect-[16/9] w-full object-cover" />
            {event.status === 'cancelled' && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-3xl font-extrabold text-white">CANCELLED</div>}
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--brand))]">{event.category} · {event.format}</p>
            <h1 className="font-heading text-3xl font-extrabold md:text-4xl">{event.title}</h1>
            <p className="mt-2 text-muted-foreground">{event.short_description}</p>
          </div>
          {event.description && <section><h2 className="font-heading text-lg font-bold">About</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{event.description}</p></section>}
          {event.schedule && <section><h2 className="font-heading text-lg font-bold">Schedule</h2><p className="mt-2 whitespace-pre-line text-sm">{event.schedule}</p></section>}
          {(event.eligibility || event.prerequisites || event.eligible_years?.length > 0) && (
            <section><h2 className="font-heading text-lg font-bold">Eligibility & prerequisites</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {event.eligible_years?.length > 0 && <li>Open to year {event.eligible_years.join(', ')}</li>}
                {event.eligible_departments?.length > 0 && <li>Departments: {event.eligible_departments.join(', ')}</li>}
                {event.eligibility && <li>{event.eligibility}</li>}
                {event.prerequisites && <li>{event.prerequisites}</li>}
              </ul>
            </section>
          )}
          {event.gallery?.length > 0 && (
            <section><h2 className="font-heading text-lg font-bold">Gallery</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {event.gallery.map((g) => <Image key={g} src={g} alt="Event gallery" className="aspect-square w-full rounded-xl object-cover" loading="lazy" />)}
              </div>
            </section>
          )}
          <section className="rounded-2xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Organized by</p>
            <p className="flex items-center gap-2 font-heading text-lg font-bold">{event.organizer_name}
              {org?.verification_status === 'verified' && <ShieldCheck className="h-4 w-4 text-green-500" aria-label="Verified organizer" />}</p>
            {org?.description && <p className="text-sm text-muted-foreground">{org.description}</p>}
            {org?.contact && <p className="mt-1 text-sm">Contact: {org.contact}</p>}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
            <Countdown target={event.registration_deadline || event.start_date} />
            <ul className="space-y-2.5">
              <Fact icon={CalendarPlus}>{fmtDate(event.start_date)}{event.end_date ? ` → ${fmtDate(event.end_date)}` : ''}</Fact>
              <Fact icon={MapPin}>{event.venue}{event.location_details ? ` — ${event.location_details}` : ''}</Fact>
              <Fact icon={Users}>{event.registration_count || 0} registered{left !== null ? ` · ${left} seats left` : ''}</Fact>
              <Fact icon={IndianRupee}>{event.fee > 0 ? `₹${event.fee}` : 'Free'}</Fact>
              {event.registration_opens && <Fact icon={CalendarPlus}>Registration opens {fmtDate(event.registration_opens)}</Fact>}
              {event.registration_deadline && <Fact icon={CalendarPlus}>Registration closes {fmtDate(event.registration_deadline)}</Fact>}
            </ul>
            {rs.open ? (
              <Button onClick={() => (user ? setOpen(true) : base44.auth.redirectToLogin(window.location.href))} className="h-12 w-full bg-[hsl(var(--brand))] text-base font-semibold text-white hover:bg-[hsl(var(--brand))]/90">Register now</Button>
            ) : (
              <Button disabled className="h-12 w-full">{rs.reason}</Button>
            )}
            {registered && (
              <>
                <Button variant="outline" className="w-full" onClick={() => downloadIcs(event)}>Add to calendar</Button>
                {event.cancellation_allowed !== false && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" className="w-full text-destructive">Cancel my registration</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Cancel registration?</AlertDialogTitle><AlertDialogDescription>Your seat will be released for other students.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={cancel}>Yes, cancel</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
            {event.external_link && <Button asChild variant="outline" className="w-full"><a href={event.external_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />External link</a></Button>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => state.toggleSave(event)}>
                <Bookmark className={`mr-2 h-4 w-4 ${state.saved.has(event.id) ? 'fill-[hsl(var(--brand))] text-[hsl(var(--brand))]' : ''}`} />{state.saved.has(event.id) ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={async () => { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </div>
          </div>
          <ReportDialog event={event} />
        </aside>
      </div>
      <EventRail id={`similar-${event.id}`} title="Similar events" query={{ category: event.category, id: { $ne: event.id }, start_date: { $gte: new Date().toISOString() } }} sort="start_date" state={state} />
      <RegisterDialog event={event} open={open} onOpenChange={setOpen} />
    </div>
  );
}