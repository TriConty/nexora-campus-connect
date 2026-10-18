import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminPeople from '@/components/admin/AdminPeople';
import AdminEvents from '@/components/admin/AdminEvents';
import AdminReports from '@/components/admin/AdminReports';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminAudit from '@/components/admin/AdminAudit';
import { useAuth } from '@/lib/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <div className="py-20 text-center"><h1 className="font-heading text-2xl font-bold">Admins only</h1><p className="text-muted-foreground">You don't have access to this area.</p><Button asChild className="mt-4"><Link to="/">Go home</Link></Button></div>;
  }
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-extrabold">Admin</h1>
      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap justify-start">
          {['overview', 'events', 'people', 'reports', 'categories', 'audit'].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === 'audit' ? 'Audit log' : t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview" className="pt-4"><AdminOverview /></TabsContent>
        <TabsContent value="events" className="pt-4"><AdminEvents /></TabsContent>
        <TabsContent value="people" className="pt-4"><AdminPeople /></TabsContent>
        <TabsContent value="reports" className="pt-4"><AdminReports /></TabsContent>
        <TabsContent value="categories" className="pt-4"><AdminCategories /></TabsContent>
        <TabsContent value="audit" className="pt-4"><AdminAudit /></TabsContent>
      </Tabs>
    </div>
  );
}
