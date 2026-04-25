import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Users, BookOpen, BarChart3 } from 'lucide-react';

interface AuthorLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/author/teams', label: 'Мої команди', icon: Users },
  { path: '/author/projects', label: 'Мої проєкти', icon: BookOpen },
  { path: '/author/analytics', label: 'Статистика', icon: BarChart3 },
];

export function AuthorLayout({ children }: AuthorLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex">
        {/* Vertical Sidebar */}
        <aside className="w-64 bg-card border-r border-border flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8 relative">
              <h2 className="text-xl font-semibold mb-2">Робочий простір</h2>
              <p className="text-sm text-muted-foreground">Автора</p>
              {/* Decorative leaf */}
              <div className="absolute -top-2 -right-2 opacity-20">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <path d="M10 45C10 45 25 35 35 15C35 15 45 25 35 45C25 45 10 45 10 45Z" fill="#59631f" />
                </svg>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
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

            {/* Bottom Decorative Motif */}
            <div className="mt-12 flex justify-center gap-2 opacity-20">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 14C3 14 8 11 11 5C11 5 14 8 11 14C8 14 3 14 3 14Z" fill="#59631f" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
              </svg>
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