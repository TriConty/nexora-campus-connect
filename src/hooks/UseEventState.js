import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { callFn } from '@/lib/api';

export function useEventState() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['eventState', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [s, r] = await Promise.all([
        base44.entities.SavedEvent.filter({ user_id: user.id }, { limit: 500, fields: ['event_id'] }),
        base44.entities.Registration.filter({ user_id: user.id, status: 'registered' }, { limit: 500, fields: ['event_id'] }),
      ]);
      return { saved: new Set(s.items.map((i) => i.event_id)), reg: new Set(r.items.map((i) => i.event_id)) };
    },
  });
  const toggleSave = async (event) => {
    try {
      const r = await callFn('trackEngagement', { action: 'toggleSave', event_id: event.id });
      toast.success(r.saved ? 'Saved to your list' : 'Removed from saved');
      qc.invalidateQueries({ queryKey: ['eventState'] });
      qc.invalidateQueries({ queryKey: ['saved'] });
    } catch (e) {
      toast.error(e.message);
    }
  };
  return { saved: data?.saved || new Set(), reg: data?.reg || new Set(), toggleSave };
}