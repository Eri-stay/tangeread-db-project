import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Users, FileEdit, ScrollText, Shield, UserCheck } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const allNavItems = [
  { path: '/admin/dashboard',         label: 'Дашборд',               icon: LayoutDashboard, roles: ['admin'] },
  { path: '/admin/users',             label: 'Користувачі',           icon: Users,           roles: ['admin'] },
  { path: '/admin/content',           label: 'Управління контентом',  icon: FileEdit,        roles: ['admin', 'moderator'] },
  { path: '/admin/team-applications', label: 'Заявки на команди',     icon: UserCheck,       roles: ['admin'] },
  { path: '/admin/logs',              label: 'Журнал аудиту',         icon: ScrollText,      roles: ['admin', 'moderator'] },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const userRole: string = userStr ? (() => { try { return JSON.parse(userStr).role || ''; } catch { return ''; } })() : '';

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex">
      {/* Vertical Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6">
          {/* Header with Shield Icon */}
          <div className="mb-8 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Панель</h2>
                <p className="text-sm text-muted-foreground">Адміністрування</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary text-foreground'
                    }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Security Badge */}
          <div className="mt-12 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-semibold ">SECURE AREA</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Всі дії логуються та підлягають аудиту
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}