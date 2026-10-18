import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';

export default function AdminAudit() {
  const { data, isLoading } = useQuery({ queryKey: ['adminAudit'], queryFn: async () => (await base44.entities.AuditLog.filter({}, { sort: '-created_date', limit: 100 })).items });
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data.length) return <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">When</th><th>Admin</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>{data.map((a) => <tr key={a.id} className="border-t"><td className="p-3">{format(new Date(a.created_date), 'd MMM, h:mm a')}</td><td>{a.actor_email}</td><td>{a.action}</td><td>{a.target}</td></tr>)}</tbody></table>
    </div>
  );
}
