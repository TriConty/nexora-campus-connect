import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import FiltersBar from '@/components/events/FiltersBar';
import EventGrid from '@/components/events/EventGrid';
import EventRail from '@/components/events/EventRail';
import { useEventState } from '@/hooks/useEventState';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/lib/AuthContext';
import { buildEventQuery, SORT_MAP, EMPTY_FILTERS, isFiltering } from '@/lib/api';
import { rankEvents } from '@/lib/recommend';

export default function Home() {
  const { user } = useAuth();
  const state = useEventState();
  const categories = useCategories();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  useEffect(() => {
    const t = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const feed = useInfiniteQuery({
    queryKey: ['feed', applied],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      base44.entities.Event.filter(buildEventQuery(applied), { sort: SORT_MAP[applied.sort], limit: 12, cursor: pageParam }),
    getNextPageParam: (p) => (p.has_more ? p.next_cursor : undefined),
  });
  let events = feed.data?.pages.flatMap((p) => p.items) || [];
  if (applied.sort === 'relevance') events = rankEvents(events, user);
  const filtering = isFiltering(applied);
  const now = new Date();
  const upcoming = { start_date: { $gte: now.toISOString() } };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-primary p-6 text-primary-foreground md:p-10">
        <p className="text-sm font-semibold text-[hsl(var(--brand))]">NIT Trichy · Every campus event. One place.</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold md:text-5xl">Never miss a deadline again.</h1>
        <p className="mt-3 max-w-xl text-sm opacity-80 md:text-base">Hackathons, workshops, fests and club drives — ranked by what you care about and when registration closes.</p>
        {user && !(user.interests?.length) && (
          <Button asChild className="mt-5 bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90">
            <Link to="/my?tab=profile">Pick your interests for better picks</Link>
          </Button>
        )}
      </section>

      <FiltersBar filters={filters} setFilters={setFilters} categories={categories} />

      {!filtering && (
        <>
          {user?.interests?.length > 0 && (
            <EventRail id="reco" title="Recommended for you" subtitle="Matched to your interests, deadlines and popularity"
              query={upcoming} sort="start_date" rank={(items) => rankEvents(items, user)} state={state} />
          )}
          <EventRail id="deadline" title="Deadline soon" subtitle="Registration closes within 3 days"
            query={{ registration_deadline: { $gte: now.toISOString(), $lte: addDays(now, 3).toISOString() } }} sort="registration_deadline" state={state} />
          <EventRail id="trending" title="Trending" subtitle="Most registrations so far"
            query={{ ...upcoming, registration_count: { $gt: 0 } }} sort="-registration_count" state={state} />
          <EventRail id="recent" title="Recently added" query={upcoming} sort="-created_date" state={state} />
        </>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold">{filtering ? 'Search results' : 'All upcoming events'}</h2>
        <EventGrid events={events} loading={feed.isLoading || feed.isFetchingNextPage} error={feed.isError}
          onRetry={feed.refetch} state={state} onClear={() => setFilters(EMPTY_FILTERS)} />
        {feed.hasNextPage && !feed.isFetchingNextPage && (
          <div className="text-center"><Button variant="outline" onClick={() => feed.fetchNextPage()}>Load more events</Button></div>
        )}
      </section>
    </div>
  );
}