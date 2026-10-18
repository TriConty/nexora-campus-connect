import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SelectField from '@/components/ui-ext/SelectField';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useCategories } from '@/hooks/useCategories';

export default function ProfileTab() {
  const { user, checkUserAuth } = useAuth();
  const categories = useCategories();
  const [f, setF] = useState({
    full_name: user.full_name || '', department: user.department || '', academic_year: user.academic_year || '',
    interests: user.interests || [], notify_reminders: user.notify_reminders !== false, reminder_hours: String(user.reminder_hours || 24),
    notify_email: user.notify_email !== false, notify_push: user.notify_push === true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const toggle = (c) => setF((s) => ({ ...s, interests: s.interests.includes(c) ? s.interests.filter((x) => x !== c) : [...s.interests, c] }));

  const save = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { full_name, ...rest } = f;
      await base44.auth.updateMe({ ...rest, reminder_hours: Number(f.reminder_hours) });
      await checkUserAuth();
      toast.success('Profile saved');
    } catch (e2) { setErr(e2.message || 'Could not save'); }
    setBusy(false);
  };

  return (
    <form onSubmit={save} className="max-w-xl space-y-5">
      <div className="space-y-1.5"><Label>Email</Label><Input value={user.email} disabled /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="dept">Department</Label><Input id="dept" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} placeholder="e.g. Computer Science" /></div>
        <div className="space-y-1.5"><Label>Academic year</Label>
          <SelectField value={f.academic_year} onChange={(v) => setF({ ...f, academic_year: v })} options={['1', '2', '3', '4', '5']} placeholder="Select year" /></div>
      </div>
      <div className="space-y-2">
        <Label>Interests (used for recommendations)</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button type="button" key={c} onClick={() => toggle(c)} aria-pressed={f.interests.includes(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${f.interests.includes(c) ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white' : 'hover:bg-secondary'}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border p-4">
        <p className="font-semibold">Reminders</p>
        <div className="flex items-center justify-between"><Label htmlFor="rem">In-app reminders</Label><Switch id="rem" checked={f.notify_reminders} onCheckedChange={(v) => setF({ ...f, notify_reminders: v })} /></div>
        <div className="flex items-center justify-between gap-3"><Label>Remind me before events</Label>
          <SelectField className="w-36" value={f.reminder_hours} onChange={(v) => setF({ ...f, reminder_hours: v || '24' })} options={[{ value: '6', label: '6 hours' }, { value: '24', label: '24 hours' }, { value: '48', label: '48 hours' }]} /></div>
        <div className="flex items-center justify-between"><Label htmlFor="em">Email reminders</Label><Switch id="em" checked={f.notify_email} onCheckedChange={(v) => setF({ ...f, notify_email: v })} /></div>
        <div className="flex items-center justify-between"><Label htmlFor="pu">Push reminders</Label><Switch id="pu" checked={f.notify_push} onCheckedChange={(v) => setF({ ...f, notify_push: v })} /></div>
        <p className="text-xs text-muted-foreground">Push alerts need the installed mobile app. Email goes to {user.email}.</p>
      </div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={busy} className="bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save profile</Button>
      <p className="text-sm text-muted-foreground">Run a club? <Link className="font-semibold text-[hsl(var(--brand))]" to="/organizer">Apply as an organizer</Link></p>
    </form>
  );
}