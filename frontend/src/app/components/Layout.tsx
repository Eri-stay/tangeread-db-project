import { Outlet } from 'react-router';
import { Header } from './Header';

type UserRole = 'guest' | 'reader' | 'author' | 'moderator' | 'admin';

interface LayoutProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function Layout({ userRole, onRoleChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header userRole={userRole} onRoleChange={onRoleChange} />
      <Outlet />
    </div>
  );
}
