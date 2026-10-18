import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { callFn } from '@/lib/api';
import { downloadIcs } from '@/lib/ics';
import { fmtDate } from '@/lib/eventUtils';

export default function RegisterDialog({ event, open, onOpenChange }) {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('');
  const [roll, setRoll] = useState('');
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[0-9+\-\s]{7,15}$/.test(phone.trim())) errs.phone = 'Enter a valid phone number';
    (event.custom_questions || []).forEach((q) => {
      if (q.required && !answers[q.label]?.trim()) errs[q.label] = 'This question is required';
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setServerError('');
    try {
      await callFn('registerForEvent', {
        action: 'register', event_id: event.id, phone, roll_number: roll,
        answers: (event.custom_questions || []).map((q) => ({ question: q.label, answer: answers[q.label] || '' })),
      });
      setDone(true);
      ['event', 'eventState', 'myRegs', 'notifs', 'feed', 'rail'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    } catch (err) {
      setServerError(err.message);
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <DialogTitle className="font-heading text-2xl">You're registered!</DialogTitle>
            <DialogDescription>{event.title}<br />{fmtDate(event.start_date)} · {event.venue}</DialogDescription>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={() => downloadIcs(event)}>Add to calendar</Button>
              <Button asChild className="bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90"><Link to="/my">View my registrations</Link></Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle className="font-heading">Register for {event.title}</DialogTitle>
              <DialogDescription>We'll share these details with the organizer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number *</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" aria-invalid={!!errors.phone} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roll">Roll number</Label>
              <Input id="roll" value={roll} maxLength={30} onChange={(e) => setRoll(e.target.value)} />
            </div>
            {(event.custom_questions || []).map((q) => (
              <div key={q.label} className="space-y-1.5">
                <Label>{q.label}{q.required ? ' *' : ''}</Label>
                <Input value={answers[q.label] || ''} maxLength={500} onChange={(e) => setAnswers((a) => ({ ...a, [q.label]: e.target.value }))} />
                {errors[q.label] && <p className="text-xs text-destructive">{errors[q.label]}</p>}
              </div>
            ))}
            {serverError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p>}
            <Button type="submit" disabled={busy} className="w-full bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm registration
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}