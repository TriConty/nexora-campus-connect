import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CATEGORIES } from '@/lib/eventUtils';

export function useCategories() {
  const { data } = useQuery({
    queryKey: ['categories'],
    staleTime: 60000,
    queryFn: async () => (await base44.entities.EventCategory.list('name', 100)).map((c) => c.name),
  });
  return data?.length ? data : CATEGORIES;
}