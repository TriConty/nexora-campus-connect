import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function QuestionsEditor({ value, onChange }) {
  const set = (i, patch) => onChange(value.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  return (
    <div className="space-y-2">
      {value.map((q, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={q.label} placeholder="Question for registrants" onChange={(e) => set(i, { label: e.target.value })} />
          <label className="flex items-center gap-1 text-xs">Required<Switch checked={!!q.required} onCheckedChange={(v) => set(i, { required: v })} /></label>
          <Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => onChange(value.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { label: '', required: false }])}><Plus className="mr-1 h-4 w-4" />Add question</Button>
    </div>
  );
}