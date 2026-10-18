import { Link, NavLink, Outlet } from 'react-router-dom';
import { Compass, CalendarCheck, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import UserMenu from '@/components/layout/UserMenu';
import NotificationBell from '@/components/layout/NotificationBell';
import { useAuth } from '@/lib/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const items = [
    { to: '/', label: 'Discover', icon: Compass, show: true },
    { to: '/my', label: 'My Events', icon: CalendarCheck, show: true },
    { to: '/organizer', label: 'Organizer', icon: LayoutDashboard, show: user?.account_type === 'organizer' || user?.role === 'admin' },
    { to: '/admin', label: 'Admin', icon: ShieldCheck, show: user?.role === 'admin' },
  ].filter((i) => i.show);

  const linkCls = ({ isActive }) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
    }`;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--brand))] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            Nexora
          </Link>
          <nav className="ml-6 hidden gap-1 md:flex">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to === '/'} className={linkCls}>
                <i.icon className="h-4 w-4" />{i.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1"><NotificationBell /><ThemeToggle /><UserMenu /></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 py-2 backdrop-blur md:hidden">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/'}
            className={({ isActive }) => `flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${isActive ? 'text-[hsl(var(--brand))]' : 'text-muted-foreground'}`}>
            <i.icon className="h-5 w-5" />{i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
