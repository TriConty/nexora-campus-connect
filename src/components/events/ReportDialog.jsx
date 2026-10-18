import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SelectField from '@/components/ui-ext/SelectField';
import { base44 } from '@/api/base44Client';

export default function ReportDialog({ event }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('Misleading');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await base44.entities.Report.create({ event_id: event.id, event_title: event.title, reason, details: details.slice(0, 500), status: 'open' });
      toast.success('Thanks — our moderators will review this event');
      setOpen(false);
      setDetails('');
    } catch (e) {
      toast.error('Could not send report. Try again.');
    }
    setBusy(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="text-muted-foreground">Report this event</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Report event</DialogTitle></DialogHeader>
        <SelectField value={reason} onChange={(v) => setReason(v || 'Other')} options={['Misleading', 'Inappropriate', 'Spam', 'Duplicate', 'Other']} label="Reason" />
        <Textarea placeholder="What's wrong? (optional)" value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} />
        <Button disabled={busy} onClick={send}>Submit report</Button>
      </DialogContent>
    </Dialog>
  );
}