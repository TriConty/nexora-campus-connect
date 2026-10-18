import { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { useEventState } from '@/hooks/useEventState';

export default function CalendarTab() {
  const [month, setMonth] = useState(new Date());
  const regs = useMyRegistrations();
  const { saved } = useEventState();
  const { data: savedEvents = [] } = useQuery({
    queryKey: ['calSaved', [...saved].join(',')],
    queryFn: async () => ([...saved].length ? (await base44.entities.Event.filter({ id: { $in: [...saved] } }, { limit: 100 })).items : []),
  });
  const items = [
    ...(regs.data || []).filter((r) => r.status === 'registered').map((r) => ({ date: r.event.start_date, label: r.event.title, id: r.event.id, kind: 'event' })),
    ...savedEvents.filter((e) => e.registration_deadline).map((e) => ({ date: e.registration_deadline, label: `Deadline: ${e.title}`, id: e.id, kind: 'deadline' })),
  ];
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border text-xs">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="bg-muted p-2 text-center font-semibold">{d}</div>)}
        {days.map((d) => (
          <div key={d.toISOString()} className={`min-h-[72px] bg-card p-1 ${isSameMonth(d, month) ? '' : 'opacity-40'}`}>
            <span className={`text-[11px] ${isSameDay(d, new Date()) ? 'rounded-full bg-[hsl(var(--brand))] px-1.5 text-white' : ''}`}>{format(d, 'd')}</span>
            {items.filter((i) => isSameDay(new Date(i.date), d)).map((i, k) => (
              <Link key={k} to={`/events/${i.id}`} className={`mt-0.5 block truncate rounded px-1 py-0.5 text-[10px] ${i.kind === 'event' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>{i.label}</Link>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Dark = events you registered for · Orange tint = registration deadlines of saved events</p>
    </div>
  );
}
