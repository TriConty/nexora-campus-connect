import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SelectField from '@/components/ui-ext/SelectField';
import { FORMATS, SORTS } from '@/lib/eventUtils';
import { isFiltering, EMPTY_FILTERS } from '@/lib/api';

export default function FiltersBar({ filters, setFilters, categories }) {
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search events" className="h-11 pl-9" placeholder="Search by title, club, keyword or category"
          value={filters.q} onChange={(e) => set('q')(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
        <SelectField value={filters.category} onChange={set('category')} options={categories} allLabel="All categories" />
        <SelectField value={filters.format} onChange={set('format')} options={FORMATS} allLabel="Online & offline" />
        <SelectField value={filters.when} onChange={set('when')} options={[{ value: 'week', label: 'Next 7 days' }, { value: 'month', label: 'Next 30 days' }]} allLabel="Any date" />
        <SelectField value={filters.reg} onChange={set('reg')} options={[{ value: 'open', label: 'Registration open' }, { value: 'closed', label: 'Registration closed' }]} allLabel="Any status" />
        <Input aria-label="Filter by club" placeholder="Club" value={filters.club} onChange={(e) => set('club')(e.target.value)} />
        <Input aria-label="Filter by venue" placeholder="Venue" value={filters.venue} onChange={(e) => set('venue')(e.target.value)} />
        <SelectField value={filters.sort} onChange={(v) => set('sort')(v || 'relevance')} options={SORTS} label="Sort by" />
      </div>
      {isFiltering(filters) && (
        <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}><X className="mr-1 h-4 w-4" />Clear filters</Button>
      )}
    </div>
  );
}