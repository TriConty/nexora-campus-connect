import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import OrganizerApply from '@/components/organizer/OrganizerApply';
import OrganizerEvents from '@/components/organizer/OrganizerEvents';
import OrganizerAnalytics from '@/components/organizer/OrganizerAnalytics';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['orgProfile', user?.id], enabled: !!user,
    queryFn: async () => (await base44.entities.OrganizerProfile.filter({ user_id: user.id }, { limit: 1 })).items[0] || null,
  });
  if (!user) return <div className="py-20 text-center"><Button asChild><Link to="/login">Sign in to continue</Link></Button></div>;
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!profile) return <OrganizerApply />;
  const verified = profile.verification_status === 'verified';
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-extrabold">{profile.club_name}</h1>
        <Badge variant={verified ? 'default' : 'secondary'} className="capitalize">{verified ? <ShieldCheck className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}{profile.verification_status}</Badge>
      </div>
      {!verified && <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">{profile.verification_status === 'rejected' ? 'Your organizer application was rejected. Contact an admin.' : 'Your club is awaiting verification. Events you publish will go to admin approval first.'}</p>}
      <Tabs defaultValue="events">
        <TabsList><TabsTrigger value="events">Events</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList>
        <TabsContent value="events" className="pt-4"><OrganizerEvents /></TabsContent>
        <TabsContent value="analytics" className="pt-4"><OrganizerAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
}