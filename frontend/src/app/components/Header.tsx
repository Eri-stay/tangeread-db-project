import { useState, useEffect } from 'react';
import { Search, User, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { AuthModal } from './AuthModal';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{username: string, role: string, avatar?: string} | null>(null);
  const navigate = useNavigate();

  const updateUserFromStorage = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    updateUserFromStorage();
    window.addEventListener('storage', updateUserFromStorage);
    return () => window.removeEventListener('storage', updateUserFromStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    navigate('/');
  };

  const handleLoginSuccess = () => {
    updateUserFromStorage();
    window.dispatchEvent(new Event("storage"));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleProfileClick = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      navigate('/profile');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              {/* Minimalist citrus logo */}
              <svg width="40" height="40" viewBox="0 0 313 313" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M188.005 28.249C254.665 49.829 291.209 121.353 269.631 188.011C248.052 254.667 176.526 291.205 109.866 269.625C43.217 248.049 6.67202 176.526 28.25 109.871C49.829 43.213 121.355 6.673 188.005 28.249Z" fill="#E47723"/>
                <path d="M185.842 34.93C248.811 55.314 283.332 122.879 262.949 185.848C242.565 248.811 174.999 283.328 112.028 262.944C49.066 242.562 14.549 174.998 34.931 112.034C55.316 49.065 122.878 14.547 185.842 34.93Z" fill="#F4E1A0"/>
                <path d="M212.552 236.302C235.977 226.817 247.481 205.624 251.757 182.224L148.94 148.941L212.552 236.302Z" fill="#4B251E"/>
                <path d="M59.572 79.205C46.716 95.325 46.123 115.657 46.123 115.657L148.939 148.941L85.325 61.57C85.325 61.57 72.425 63.081 59.572 79.205Z" fill="#4B251E"/>
                <path d="M147.91 40.554C147.91 40.554 135.136 35.859 113.913 41.745C92.693 47.621 85.325 61.57 85.325 61.57L148.939 148.941L148.82 40.849C148.458 40.846 148.099 40.866 147.742 40.869L147.91 40.554Z" fill="#4B251E"/>
                <path d="M148.82 40.849L148.939 148.941L212.377 61.423C212.377 61.423 204.701 47.803 184.589 41.246C162.221 33.95 148.82 40.849 148.82 40.849Z" fill="#4B251E"/>
                <path d="M212.377 61.423L148.939 148.941L251.676 115.421C251.676 115.421 254.272 101.666 242.556 84.16C230.842 66.65 212.377 61.423 212.377 61.423Z" fill="#4B251E"/>
                <path d="M35.769 145.693C32.893 169.674 46.196 182.448 46.196 182.448L148.94 148.941L46.123 115.657C43.49 116.581 38.175 125.613 35.769 145.693Z" fill="#4B251E"/>
                <path d="M46.195 182.448C46.195 182.448 44.94 202.891 59.825 218.96C74.516 234.812 85.498 236.456 85.498 236.456L148.939 148.941L46.195 182.448Z" fill="#4B251E"/>
                <path d="M85.498 236.456C85.498 236.456 94.402 249.258 112.345 255.938C130.287 262.613 149.055 257.031 149.055 257.031L148.94 148.942L85.498 236.456Z" fill="#4B251E"/>
                <path d="M149.055 257.03C149.055 257.03 164.974 262.657 183.412 257.611C201.85 252.571 212.552 236.302 212.552 236.302L148.94 148.941L149.055 257.03Z" fill="#4B251E"/>
                <path d="M251.677 115.421L148.94 148.941L251.757 182.224C251.757 182.224 260.605 174.882 262.945 150.646C265.285 126.407 251.683 115.423 251.683 115.423L251.682 115.426C251.682 115.426 251.676 115.425 251.677 115.421Z" fill="#4B251E"/>
                <path d="M250.076 195.763C250.075 195.766 250.075 195.766 250.075 195.766C243.37 216.48 230.952 230.639 213.168 237.835L211.975 238.322L144.605 145.8L253.645 181.098L253.382 182.517C252.535 187.14 251.425 191.599 250.076 195.763ZM213.119 234.275C229.315 227.312 240.689 214.024 246.93 194.748C248.095 191.147 249.078 187.319 249.858 183.348L153.27 152.081L213.119 234.275Z" fill="#FCE1E0"/>
                <path d="M153.27 152.081L44.434 116.848L44.472 115.609C44.48 115.29 44.735 107.681 47.872 97.99C50.317 90.435 53.82 83.773 58.275 78.171C71.41 61.708 84.58 59.993 85.137 59.931L86.096 59.817L153.27 152.081ZM47.855 114.479L144.605 145.8L84.609 63.395C81.53 64.098 71.157 67.325 60.864 80.235C56.655 85.516 53.341 91.834 51.019 99.008C48.746 106.027 48.058 111.999 47.855 114.479Z" fill="#FCE1E0"/>
                <path d="M150.598 154.027L83.386 61.714L83.865 60.801C84.177 60.207 91.811 46.15 113.472 40.146C134.96 34.192 147.941 38.8 148.484 39.001L149.005 39.195L150.477 39.192L150.598 154.027ZM87.314 61.493L147.279 143.848L147.168 42.531L144.943 42.566L145.466 41.59C141.265 40.612 130.19 38.948 114.358 43.333C97.137 48.105 89.307 58.449 87.314 61.493Z" fill="#FCE1E0"/>
                <path d="M214.34 61.538L147.293 154.031L147.164 39.843L148.064 39.38C148.635 39.086 162.339 32.246 185.099 39.674C205.592 46.358 213.494 60.035 213.819 60.611L214.34 61.538ZM150.589 143.847L210.378 61.365C208.307 58.329 200.373 48.132 184.075 42.813C165.819 36.866 153.755 40.63 150.471 41.925L150.589 143.847Z" fill="#FCE1E0"/>
                <path d="M253.122 116.696L252.191 116.996L144.611 152.089L211.718 59.519L212.826 59.83C213.605 60.052 232.011 65.427 243.932 83.236C255.889 101.104 253.414 115.144 253.302 115.732L253.122 116.696ZM153.266 145.786L250.169 114.178C250.456 110.861 250.635 99.203 241.182 85.079C231.56 70.702 217.06 64.796 213.007 63.374L153.266 145.786Z" fill="#FCE1E0"/>
                <path d="M154.288 148.934L45.765 184.332L45.052 183.644C44.485 183.099 31.194 170.014 34.126 145.492C35.002 138.169 36.322 131.753 38.048 126.426C40.293 119.487 43.035 114.992 45.569 114.095L46.099 113.911L154.288 148.934ZM46.689 180.552L143.587 148.947L46.309 117.456C45.413 118.218 43.33 120.851 41.195 127.444C39.536 132.572 38.265 138.776 37.41 145.885C35.039 165.714 44.125 177.626 46.689 180.552Z" fill="#FCE1E0"/>
                <path d="M153.266 145.786L86.249 238.239L85.254 238.089C84.784 238.017 73.527 236.175 58.614 220.086C43.423 203.683 44.495 183.213 44.547 182.351L44.613 181.228L153.266 145.786ZM84.803 234.597L144.612 152.089L47.829 183.659C47.848 188.047 48.773 204.59 61.041 217.835C72.74 230.46 81.926 233.811 84.803 234.597Z" fill="#FCE1E0"/>
                <path d="M150.717 258.26L149.526 258.615C148.743 258.846 130.022 264.282 111.766 257.486C93.553 250.708 84.518 237.941 84.14 237.399L83.469 236.436L150.589 143.848L150.717 258.26ZM87.562 236.428C89.96 239.427 98.467 249.007 112.923 254.386C127.621 259.852 143.075 256.799 147.402 255.753L147.293 154.029L87.562 236.428Z" fill="#FCE1E0"/>
                <path d="M214.561 236.255L213.93 237.209C213.482 237.897 202.671 254.059 183.848 259.211C165.123 264.328 149.175 258.826 148.502 258.591L147.401 258.2L147.278 143.848L214.561 236.255ZM150.713 255.808C154.564 256.914 167.992 260.117 182.977 256.019C198.116 251.879 207.968 239.758 210.516 236.316L150.598 154.026L150.713 255.808Z" fill="#FCE1E0"/>
                <path d="M261.096 168.586C261.094 168.59 261.094 168.59 261.094 168.59C257.578 179.449 253.004 183.336 252.816 183.496L252.116 184.079L143.588 148.946L251.681 113.687L252.187 113.851C253.503 114.276 266.939 126.522 264.591 150.8C263.953 157.405 262.777 163.39 261.096 168.586ZM251.301 180.339C252.546 178.96 255.494 175.127 257.947 167.572L257.948 167.568C259.556 162.598 260.684 156.852 261.299 150.483C263.235 130.42 253.856 119.799 251.279 117.294L154.288 148.934L251.301 180.339Z" fill="#FCE1E0"/>
                <path d="M147.328 106.329C144.758 111.306 144.301 118.054 139.033 121.12C134.53 123.74 130.152 116.318 127.544 113.489C124.108 109.774 120.199 106.605 117.382 102.343C116.33 100.773 115.11 101.568 116.15 103.152C119.93 108.764 133.547 128.124 124.86 133.475C118.681 137.28 108.119 134.179 101.568 132.991C100.331 132.767 101.573 134.981 102.12 135.243C102.185 135.278 102.268 135.312 102.346 135.35L102.345 135.353C102.351 135.355 102.357 135.356 102.367 135.36C107.782 137.865 128.147 144.177 123.521 151.809C120.174 157.328 111.013 159.13 105.552 161.673C104.752 162.051 106.203 164.055 106.889 164.016C114.053 163.586 121.035 163.239 128.055 165.095C131.466 165.996 129.764 171.623 127.43 176.677C127.299 176.771 127.176 176.858 127.05 176.952C127.722 177.857 128.381 178.779 129.087 179.673C134.009 178.332 137.864 173.814 143.269 173.103C148.84 172.367 148.48 181.057 148.488 186.107C148.474 186.297 148.469 186.498 148.469 186.665C148.467 186.685 148.481 186.719 148.488 186.752C148.495 187.394 148.513 187.96 148.558 188.411C148.635 189.148 150.236 190.675 150.306 189.723L150.301 189.722C150.3 189.705 150.303 189.679 150.304 189.658C150.269 188.662 150.272 187.639 150.291 186.589C150.402 185.655 150.6 184.734 150.812 183.726C150.83 183.655 150.753 183.5 150.662 183.381C151.856 179.747 153.423 175.992 157.306 175.27C163.11 174.189 168.928 182.7 173.127 185.743C174.212 186.531 174.154 184.94 173.843 184.342C172.952 182.643 171.512 180.395 170.356 178.031C170.515 178.179 170.682 178.328 170.842 178.478C171.226 178.818 171.107 178.21 170.959 178.023C170.538 177.484 170.045 176.874 169.54 176.229C168.349 173.252 167.912 170.257 169.836 168.068C171.935 165.686 175.529 165.302 178.627 164.396C186.04 163.802 193.725 164.576 201.037 165.803C202.553 166.052 201.073 163.648 200.662 163.264C198.979 161.693 197.113 160.911 195.002 160.227C190.348 157.978 185.527 155.62 183.016 151.042C179.047 143.804 189.835 139.26 194.647 136.849C195.856 136.241 193.665 133.259 192.627 133.317C186.891 133.644 181.419 135.781 175.709 136.372C170.086 136.952 166.159 133.908 167.095 127.803C167.172 127.344 167.271 126.889 167.393 126.437C168.774 123.314 170.772 120.38 172.065 118.535C172.544 117.849 171.141 115.781 170.308 116.203C165.679 118.566 162.699 123.288 158.244 125.959C150.921 130.356 149.47 112.738 149.299 108.336C149.272 107.823 147.897 105.211 147.328 106.329Z" fill="#FCE1E0"/>
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

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук манги..."
                className="w-full pl-10 bg-secondary/50 border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="button"
              variant="outline" 
              size="icon"
              onClick={() => navigate('/catalog')}
              title="Розширений пошук"
              className="border-primary/50 hover:bg-primary/10"
            >
              <Filter className="h-4 w-4 text-primary" />
            </Button>
          </form>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center h-10 w-10 rounded-full overflow-hidden bg-secondary hover:bg-secondary/80 transition-colors border border-border/50">
              {user?.avatar ? (
                <ImageWithFallback 
                  src={`${user.avatar}?t=${Date.now()}`} 
                  alt={user.username} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className="h-5 w-5 text-foreground" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-card border-border">
              {user ? (
                <>
                  <DropdownMenuLabel className="text-base">
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                        {user.avatar ? (
                          <ImageWithFallback 
                            src={`${user.avatar}?t=${Date.now()}`} 
                            alt={user.username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{user.username}</div>
                        <div className="text-xs text-muted-foreground font-normal capitalize">{user.role}</div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                </>
              ) : (
                <>
                  <DropdownMenuLabel className="text-base">Профіль користувача</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                </>
              )}
              
              <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
                {!user ? 'Увійти / Зареєструватися' : 'Налаштування профілю'}
              </DropdownMenuItem>
              {user && (user.role === 'author' || user.role === 'moderator' || user.role === 'admin') && (
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/author/projects')}>
                  Робочий простір автора
                </DropdownMenuItem>
              )}
              {user && (user.role === 'moderator' || user.role === 'admin') && (
                <DropdownMenuItem 
                  className="cursor-pointer focus:text-destructive" 
                  onClick={() => navigate('/admin/dashboard')}
                >
                  Панель адміністрування
                </DropdownMenuItem>
              )}
              {user && (
                <>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:text-destructive" 
                    onClick={handleLogout}
                  >
                    Вийти з акаунту
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук манги..."
                className="w-full pl-10 bg-secondary/50 border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="button"
              variant="outline" 
              size="icon"
              onClick={() => navigate('/catalog')}
              className="border-primary/50 hover:bg-primary/10"
            >
              <Filter className="h-4 w-4 text-primary" />
            </Button>
          </form>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}