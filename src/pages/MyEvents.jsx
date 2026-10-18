import { Link, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import RegistrationsTab from '@/components/dashboard/RegistrationsTab';
import SavedTab from '@/components/dashboard/SavedTab';
import CalendarTab from '@/components/dashboard/CalendarTab';
import NotificationsTab from '@/components/dashboard/NotificationsTab';
import ProfileTab from '@/components/dashboard/ProfileTab';
import EventRail from '@/components/events/EventRail';
import { useEventState } from '@/hooks/useEventState';
import { useAuth } from '@/lib/AuthContext';
import { rankEvents } from '@/lib/recommend';

export default function MyEvents() {
  const { user } = useAuth();
  const state = useEventState();
  const [params, setParams] = useSearchParams();
  if (!user) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">Sign in to see your events</h1>
        <Button asChild className="mt-4"><Link to="/login">Sign in</Link></Button>
      </div>
    );
  }
  const tab = params.get('tab') || 'registrations';
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold">Hi {user.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-muted-foreground">Your registrations, saved events and reminders in one place.</p>
      </div>
      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t })}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="registrations" className="space-y-8 pt-4">
          <RegistrationsTab />
          <EventRail id="my-reco" title="Recommended for you" subtitle="Based on your interests and upcoming deadlines"
            query={{ start_date: { $gte: new Date().toISOString() } }} sort="start_date" rank={(items) => rankEvents(items, user)} state={state} />
        </TabsContent>
        <TabsContent value="saved" className="pt-4"><SavedTab /></TabsContent>
        <TabsContent value="calendar" className="pt-4"><CalendarTab /></TabsContent>
        <TabsContent value="notifications" className="pt-4"><NotificationsTab /></TabsContent>
        <TabsContent value="profile" className="pt-4"><ProfileTab /></TabsContent>
      </Tabs>
    </div>
  );
}