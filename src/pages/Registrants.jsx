import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SelectField from '@/components/ui-ext/SelectField';
import { base44 } from '@/api/base44Client';
import { callFn } from '@/lib/api';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;

export default function Registrants() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [status, setStatus] = useState('registered');
  const [sort, setSort] = useState('-created_date');
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);

  const { data: event } = useQuery({ queryKey: ['editEvent', id], queryFn: () => base44.entities.Event.get(id) });
  const query = { event_id: id, ...(status ? { status } : {}) };
  if (dq.trim()) {
    const rx = { $regex: dq.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    query.$or = [{ user_name: rx }, { user_email: rx }, { roll_number: rx }];
  }
  const { data, isLoading } = useQuery({
    queryKey: ['registrants', id, dq, status, sort],
    queryFn: async () => (await base44.entities.Registration.filter(query, { sort, limit: 1000 })).items,
  });
  const attended = (data || []).filter((r) => r.attended).length;
  const active = (data || []).filter((r) => r.status === 'registered').length;

  const mark = async (r, v) => {
    try {
      await callFn('organizerAction', { action: 'checkIn', registration_id: r.id, attended: !!v });
      qc.invalidateQueries({ queryKey: ['registrants'] });
    } catch (e) { toast.error(e.message); }
  };
  const exportCsv = () => {
    const head = ['Name', 'Email', 'Phone', 'Roll number', 'Department', 'Status', 'Attended', 'Registered at', 'Answers'];
    const rows = data.map((r) => [r.user_name, r.user_email, r.phone, r.roll_number, r.department, r.status, r.attended ? 'Yes' : 'No', r.created_date, (r.answers || []).map((a) => `${a.question}: ${a.answer}`).join(' | ')]);
    const blob = new Blob([[head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(event?.title || 'registrants').replace(/\W+/g, '-')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <Link to="/organizer" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-extrabold">{event?.title || 'Registrants'}</h1>
          <p className="text-sm text-muted-foreground">{active} registered · {attended} checked in{active ? ` (${Math.round((attended / active) * 100)}% attendance)` : ''}</p></div>
        <Button variant="outline" disabled={!data?.length} onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input aria-label="Search participants" placeholder="Search name, email or roll no." value={q} onChange={(e) => setQ(e.target.value)} />
        <SelectField value={status} onChange={setStatus} allLabel="All statuses" options={[{ value: 'registered', label: 'Registered' }, { value: 'cancelled', label: 'Cancelled' }]} />
        <SelectField value={sort} onChange={(v) => setSort(v || '-created_date')} options={[{ value: '-created_date', label: 'Newest first' }, { value: 'created_date', label: 'Oldest first' }, { value: 'user_name', label: 'Name A–Z' }]} />
      </div>
      {isLoading ? <Skeleton className="h-40 w-full" /> : !data.length ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No participants match.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Present</th><th>Name</th><th>Email</th><th>Phone</th><th>Roll no.</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3"><Checkbox aria-label={`Mark ${r.user_name} present`} disabled={r.status !== 'registered'} checked={!!r.attended} onCheckedChange={(v) => mark(r, v)} /></td>
                  <td className="font-medium">{r.user_name}</td><td>{r.user_email}</td><td>{r.phone}</td><td>{r.roll_number}</td>
                  <td><Badge variant={r.status === 'registered' ? 'default' : 'secondary'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}