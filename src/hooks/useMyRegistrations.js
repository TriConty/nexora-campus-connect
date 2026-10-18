import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// The signed-in student's registrations joined with their events.
export function useMyRegistrations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myRegs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const regs = (await base44.entities.Registration.filter({ user_id: user.id }, { sort: '-created_date', limit: 100 })).items;
      const ids = [...new Set(regs.map((r) => r.event_id))];
      const events = ids.length ? (await base44.entities.Event.filter({ id: { $in: ids } }, { limit: 100 })).items : [];
      const byId = Object.fromEntries(events.map((e) => [e.id, e]));
      return regs.map((r) => ({ ...r, event: byId[r.event_id] })).filter((r) => r.event);
    },
  });
}