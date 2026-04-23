import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Users, BookOpen, BarChart3, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

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
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              {/* Minimalist citrus logo */}
              <svg width="40" height="40" viewBox="0 0 313 313" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M188.005 28.249C254.665 49.829 291.209 121.353 269.631 188.011C248.052 254.667 176.526 291.205 109.866 269.625C43.217 248.049 6.67202 176.526 28.25 109.871C49.829 43.213 121.355 6.673 188.005 28.249Z" fill="#E47723"/>
                <path d="M185.842 34.93C248.811 55.314 283.332 122.879 262.949 185.848C242.565 248.811 174.999 283.328 112.028 262.944C49.066 242.562 14.549 174.998 34.931 112.034C55.316 49.065 122.878 14.547 185.842 34.93Z" fill="#F4E1A0"/>
                <path d="M148 22.0523V275.823C135.364 275.726 122.527 273.724 109.866 269.625C43.217 248.049 6.67202 176.526 28.25 109.871C45.5275 56.5006 94.8238 22.4375 148 22.0523Z" fill="#E47723"/>
              </svg>
              {/* Subtle leaf watermark */}
              <div className="absolute -right-1 -top-1 opacity-30">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10C2 10 6 8 8 4C8 4 10 6 8 10C6 10 2 10 2 10Z" fill="#59631f" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Tangeread
            </span>
          </Link>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80 transition-colors border border-border/50">
              <User className="h-5 w-5 text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/')}>
                Головна сторінка
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/catalog')}>
                Каталог манги
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                Мій профіль
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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
    </div>
  );
}