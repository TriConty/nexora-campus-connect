import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { callFn } from '@/lib/api';

export default function OrganizerApply() {
  const { checkUserAuth } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ club_name: '', description: '', contact: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (f.club_name.trim().length < 2) { setErr('Enter your club or organization name'); return; }
    setErr(''); setBusy(true);
    try {
      await callFn('organizerAction', { action: 'apply', ...f });
      await base44.auth.updateMe({ account_type: 'organizer' });
      qc.invalidateQueries({ queryKey: ['orgProfile'] });
      toast.success('Application submitted — an admin will verify your club');
      await checkUserAuth();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-2xl border bg-card p-6">
      <h1 className="font-heading text-2xl font-extrabold">Become an organizer</h1>
      <p className="text-sm text-muted-foreground">Create events for your club. You can draft right away; publishing goes live once an admin verifies your club.</p>
      <div className="space-y-1.5"><Label htmlFor="club">Club / organization name *</Label><Input id="club" value={f.club_name} onChange={(e) => setF({ ...f, club_name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="desc">About your club</Label><Textarea id="desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="contact">Contact (email or phone)</Label><Input id="contact" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={busy} className="w-full bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit application</Button>
    </form>
  );
}