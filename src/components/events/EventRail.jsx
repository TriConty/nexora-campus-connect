import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EventGrid from '@/components/events/EventGrid';

export default function EventRail({ title, subtitle, id, query, sort, state, rank, hideIfEmpty = true, limit = 3 }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rail', id],
    queryFn: async () => {
      const page = await base44.entities.Event.filter({ status: 'published', ...query }, { sort, limit: rank ? 40 : limit });
      return rank ? rank(page.items).slice(0, limit) : page.items;
    },
  });
  if (!isLoading && !isError && hideIfEmpty && !data?.length) return null;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <EventGrid events={data || []} loading={isLoading} error={isError} onRetry={refetch} state={state} />
    </section>
  );
}