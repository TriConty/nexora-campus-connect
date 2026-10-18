import { Link } from 'react-router-dom';
import { Bookmark, MapPin, CalendarDays, Users, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import Countdown from '@/components/events/Countdown';
import { FALLBACK_COVER, fmtDate } from '@/lib/eventUtils';

export default function EventCard({ event, saved, onToggleSave, registered }) {
  const share = async () => {
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };
  const full = event.capacity && (event.registration_count || 0) >= event.capacity;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {(event.organizer_name || 'C')[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{event.organizer_name || 'Campus Club'}</p>
          <p className="text-xs text-muted-foreground">{event.category} · {event.format}</p>
        </div>
        {event.is_sample && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Sample</span>
        )}
      </div>
      <Link to={`/events/${event.id}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={event.cover_image || FALLBACK_COVER}
          alt={`${event.title} poster`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <Countdown target={event.registration_deadline || event.start_date} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link to={`/events/${event.id}`}>
            <h3 className="font-heading text-lg font-bold leading-snug hover:text-[hsl(var(--brand))]">{event.title}</h3>
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.short_description}</p>
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" />{fmtDate(event.start_date)}</li>
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{event.venue}</span></li>
          <li className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />
            {event.registration_count || 0} registered{event.capacity ? ` · ${Math.max(event.capacity - (event.registration_count || 0), 0)} seats left` : ''}
          </li>
        </ul>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button asChild className="flex-1 bg-[hsl(var(--brand))] font-semibold text-white hover:bg-[hsl(var(--brand))]/90">
            <Link to={`/events/${event.id}`}>{registered ? 'Registered ✓' : full ? 'View details' : 'Register'}</Link>
          </Button>
          <Button variant="outline" size="icon" aria-label={saved ? 'Remove bookmark' : 'Save event'} onClick={() => onToggleSave?.(event)}>
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-[hsl(var(--brand))] text-[hsl(var(--brand))]' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" aria-label="Share event" onClick={share}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}