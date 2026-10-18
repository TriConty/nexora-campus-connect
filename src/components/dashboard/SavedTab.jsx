import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import EventGrid from '@/components/events/EventGrid';
import { useEventState } from '@/hooks/useEventState';

export default function SavedTab() {
  const { user } = useAuth();
  const state = useEventState();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['saved', user.id, [...state.saved].join(',')],
    queryFn: async () => {
      const ids = [...state.saved];
      if (!ids.length) return [];
      return (await base44.entities.Event.filter({ id: { $in: ids } }, { sort: 'start_date', limit: 100 })).items;
    },
  });
  return <EventGrid events={data || []} loading={isLoading} error={isError} onRetry={refetch} state={state} emptyText="Nothing saved yet" />;
}