import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';
import { callFn } from '@/lib/api';

export default function AdminPeople() {
  const qc = useQueryClient();
  const orgs = useQuery({ queryKey: ['adminOrgs'], queryFn: async () => (await base44.entities.OrganizerProfile.filter({}, { sort: '-created_date', limit: 200 })).items });
  const users = useQuery({ queryKey: ['adminUsers'], queryFn: () => base44.entities.User.list('-created_date', 200) });
  const verify = async (id, status) => {
    try { await callFn('adminAction', { action: 'verifyOrganizer', id, status }); toast.success(`Organizer ${status}`); ['adminOrgs', 'adminStats', 'adminAudit'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); }
    catch (e) { toast.error(e.message); }
  };
  if (orgs.isLoading || users.isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="font-heading text-lg font-bold">Organizers</h2>
        {orgs.data.length === 0 && <p className="text-sm text-muted-foreground">No organizer applications yet.</p>}
        {orgs.data.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
            <div className="min-w-0 flex-1"><p className="font-semibold">{o.club_name}</p><p className="text-xs text-muted-foreground">{o.user_email} · {o.contact}</p></div>
            <Badge variant={o.verification_status === 'verified' ? 'default' : 'secondary'}>{o.verification_status}</Badge>
            {o.verification_status !== 'verified' && <Button size="sm" onClick={() => verify(o.id, 'verified')}>Verify</Button>}
            {o.verification_status !== 'rejected' && <Button size="sm" variant="outline" onClick={() => verify(o.id, 'rejected')}>Reject</Button>}
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-lg font-bold">Users ({users.data.length})</h2>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Name</th><th>Email</th><th>Role</th><th>Type</th></tr></thead>
            <tbody>{users.data.map((u) => <tr key={u.id} className="border-t"><td className="p-3">{u.full_name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.account_type || 'student'}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
}