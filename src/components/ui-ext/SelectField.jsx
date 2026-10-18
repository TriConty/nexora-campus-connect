import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// options: string[] or {value,label}[]; empty value maps to the "all" option.
export default function SelectField({ value, onChange, options, allLabel, placeholder, className = '', label }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <Select value={value || (allLabel ? 'all' : '')} onValueChange={(v) => onChange(v === 'all' ? '' : v)}>
      <SelectTrigger className={className} aria-label={label || allLabel || placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
        {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
