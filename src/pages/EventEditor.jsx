import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SelectField from '@/components/ui-ext/SelectField';
import ImageUpload from '@/components/organizer/ImageUpload';
import QuestionsEditor from '@/components/organizer/QuestionsEditor';
import EventCard from '@/components/events/EventCard';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { callFn } from '@/lib/api';
import { useCategories } from '@/hooks/useCategories';
import { FORMATS } from '@/lib/eventUtils';

const toLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const toIso = (v) => (v ? new Date(v).toISOString() : undefined);
const BLANK = { title: '', short_description: '', description: '', schedule: '', category: '', format: 'Offline', cover_image: '', gallery: [], venue: '', location_details: '',
  start_date: '', end_date: '', registration_opens: '', registration_deadline: '', capacity: '', fee: '', eligibility: '', eligible_years: '', eligible_departments: '',
  prerequisites: '', external_link: '', custom_questions: [], cancellation_allowed: true };

function Field({ label, error, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

export default function EventEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const categories = useCategories();
  const [f, setF] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(false);
  const { data: existing } = useQuery({ queryKey: ['editEvent', id], enabled: !!id, queryFn: () => base44.entities.Event.get(id) });
  useEffect(() => {
    if (!existing) return;
    setF({ ...BLANK, ...existing, start_date: toLocal(existing.start_date), end_date: toLocal(existing.end_date), registration_opens: toLocal(existing.registration_opens),
      registration_deadline: toLocal(existing.registration_deadline), capacity: existing.capacity ?? '', fee: existing.fee ?? '',
      eligible_years: (existing.eligible_years || []).join(', '), eligible_departments: (existing.eligible_departments || []).join(', '), gallery: existing.gallery || [], custom_questions: existing.custom_questions || [] });
  }, [existing?.id]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const payload = () => ({
    ...f, id: id || undefined, start_date: toIso(f.start_date), end_date: toIso(f.end_date), registration_opens: toIso(f.registration_opens),
    registration_deadline: toIso(f.registration_deadline) || toIso(f.start_date), capacity: f.capacity === '' ? 0 : Number(f.capacity), fee: f.fee === '' ? 0 : Number(f.fee),
    eligible_years: list(f.eligible_years), eligible_departments: list(f.eligible_departments), custom_questions: f.custom_questions.filter((q) => q.label.trim()),
  });

  const validate = () => {
    const e = {};
    if (f.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (!f.category) e.category = 'Choose a category';
    if (!f.venue.trim()) e.venue = 'Add a venue or meeting link';
    if (!f.start_date) e.start_date = 'Add a start date';
    if (f.registration_deadline && f.start_date && f.registration_deadline > f.start_date) e.registration_deadline = 'Deadline must be before the event starts';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async (publish) => {
    if (!validate()) { toast.error('Please fix the highlighted fields'); return; }
    setBusy(publish ? 'publish' : 'save');
    try {
      const r = await callFn('organizerAction', { action: 'saveEvent', event: payload() });
      if (publish) {
        const s = await callFn('organizerAction', { action: 'setStatus', id: r.event.id, to: 'publish' });
        toast.success(s.status === 'pending' ? 'Submitted for admin approval' : 'Event published');
      } else toast.success('Event saved');
      ['orgEvents', 'editEvent', 'feed', 'rail'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      nav('/organizer');
    } catch (e) { toast.error(e.message); }
    setBusy('');
  };

  const previewEvent = { ...payload(), id: 'preview', organizer_name: existing?.organizer_name || 'Your club', registration_count: existing?.registration_count || 0 };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/organizer" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</Link>
      <h1 className="font-heading text-3xl font-extrabold">{id ? 'Edit event' : 'Create event'}</h1>
      {preview && (
        <div className="relative max-w-sm">
          <Button variant="ghost" size="icon" className="absolute -right-2 -top-2 z-10 bg-background" aria-label="Close preview" onClick={() => setPreview(false)}><X className="h-4 w-4" /></Button>
          <EventCard event={previewEvent} />
        </div>
      )}
      <div className="space-y-5 rounded-2xl border bg-card p-5">
        <Field label="Title *" error={errors.title}><Input value={f.title} maxLength={120} onChange={set('title')} /></Field>
        <Field label="Short description"><Input value={f.short_description} maxLength={200} onChange={set('short_description')} /></Field>
        <Field label="Full description"><Textarea rows={5} value={f.description} onChange={set('description')} /></Field>
        <Field label="Schedule (one item per line)"><Textarea rows={3} value={f.schedule} onChange={set('schedule')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category *" error={errors.category}><SelectField value={f.category} onChange={set('category')} options={categories} placeholder="Select category" /></Field>
          <Field label="Format"><SelectField value={f.format} onChange={set('format')} options={FORMATS} /></Field>
          <Field label="Venue or meeting link *" error={errors.venue}><Input value={f.venue} onChange={set('venue')} /></Field>
          <Field label="Location details"><Input value={f.location_details} onChange={set('location_details')} placeholder="Floor, room, landmark" /></Field>
          <Field label="Starts *" error={errors.start_date}><Input type="datetime-local" value={f.start_date} onChange={set('start_date')} /></Field>
          <Field label="Ends"><Input type="datetime-local" value={f.end_date} onChange={set('end_date')} /></Field>
          <Field label="Registration opens"><Input type="datetime-local" value={f.registration_opens} onChange={set('registration_opens')} /></Field>
          <Field label="Registration deadline" error={errors.registration_deadline}><Input type="datetime-local" value={f.registration_deadline} onChange={set('registration_deadline')} /></Field>
          <Field label="Capacity (0 = unlimited)"><Input type="number" min="0" value={f.capacity} onChange={set('capacity')} /></Field>
          <Field label="Fee (₹, 0 = free)"><Input type="number" min="0" value={f.fee} onChange={set('fee')} /></Field>
          <Field label="Eligible years (e.g. 1, 2)"><Input value={f.eligible_years} onChange={set('eligible_years')} /></Field>
          <Field label="Eligible departments"><Input value={f.eligible_departments} onChange={set('eligible_departments')} /></Field>
        </div>
        <Field label="Eligibility notes"><Input value={f.eligibility} onChange={set('eligibility')} /></Field>
        <Field label="Prerequisites"><Input value={f.prerequisites} onChange={set('prerequisites')} /></Field>
        <Field label="External registration link"><Input value={f.external_link} onChange={set('external_link')} placeholder="https://" /></Field>
        <div className="space-y-2">
          <Label>Poster</Label>
          {f.cover_image && <Image src={f.cover_image} alt="Poster preview" className="h-40 rounded-xl object-cover" />}
          <div><ImageUpload label="Upload poster" onUploaded={([u]) => setF((s) => ({ ...s, cover_image: u }))} /></div>
        </div>
        <div className="space-y-2">
          <Label>Gallery</Label>
          <div className="flex flex-wrap gap-2">{f.gallery.map((g) => <Image key={g} src={g} alt="" className="h-16 w-16 rounded-lg object-cover" />)}</div>
          <ImageUpload multiple label="Add images" onUploaded={(u) => setF((s) => ({ ...s, gallery: [...s.gallery, ...u].slice(0, 8) }))} />
        </div>
        <div className="space-y-2"><Label>Custom registration questions</Label><QuestionsEditor value={f.custom_questions} onChange={set('custom_questions')} /></div>
        <label className="flex items-center justify-between text-sm">Allow students to cancel their registration<Switch checked={f.cancellation_allowed !== false} onCheckedChange={set('cancellation_allowed')} /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { if (validate()) setPreview(true); }}><Eye className="mr-2 h-4 w-4" />Preview</Button>
        <Button variant="outline" disabled={!!busy} onClick={() => save(false)}>{busy === 'save' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save draft</Button>
        <Button disabled={!!busy} className="bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90" onClick={() => save(true)}>{busy === 'publish' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save & publish</Button>
      </div>
    </div>
  );
}