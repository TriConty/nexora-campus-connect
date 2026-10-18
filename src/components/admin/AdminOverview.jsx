import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const E = base44.entities;
      const [events, published, pending, regs, orgsPending, reports, users] = await Promise.all([
        E.Event.count({}), E.Event.count({ status: 'published' }), E.Event.count({ status: 'pending' }),
        E.Registration.count({ status: 'registered' }), E.OrganizerProfile.count({ verification_status: 'pending' }),
        E.Report.count({ status: 'open' }), E.User.list('-created_date', 1000),
      ]);
      return { Users: users.length, 'Total events': events, Published: published, 'Awaiting approval': pending, Registrations: regs, 'Organizers to verify': orgsPending, 'Open reports': reports };
    },
  });
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="font-heading text-3xl font-extrabold">{v}</p></div>
      ))}
    </div>
  );
}