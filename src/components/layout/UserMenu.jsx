import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function UserMenu() {
  const { user } = useAuth();
  if (!user) {
    return <Button asChild className="bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90"><Link to="/login">Sign in</Link></Button>;
  }
  const initial = (user.full_name || user.email || '?')[0].toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">{initial}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate">{user.full_name || 'Student'}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/my?tab=profile"><UserIcon className="mr-2 h-4 w-4" />Profile & settings</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => base44.auth.logout('/login')}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}