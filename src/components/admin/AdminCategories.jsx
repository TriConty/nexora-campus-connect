import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { callFn } from '@/lib/api';

export default function AdminCategories() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const { data = [] } = useQuery({ queryKey: ['adminCats'], queryFn: () => base44.entities.EventCategory.list('name', 100) });
  const run = async (op, n) => {
    try { await callFn('adminAction', { action: 'category', op, name: n }); setName(''); ['adminCats', 'categories', 'adminAudit'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); }
    catch (e) { toast.error(e.message); }
  };
  return (
    <div className="max-w-md space-y-4">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run('add', name); }}>
        <Input placeholder="New category" value={name} onChange={(e) => setName(e.target.value)} /><Button type="submit">Add</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {data.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm">{c.name}
            <button aria-label={`Remove ${c.name}`} onClick={() => run('remove', c.name)}><X className="h-3 w-3" /></button></span>
        ))}
      </div>
    </div>
  );
}