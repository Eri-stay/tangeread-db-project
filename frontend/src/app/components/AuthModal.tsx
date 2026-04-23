import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo validation error
    if (nickname.toLowerCase() === 'admin' || nickname.toLowerCase() === 'user') {
      setNicknameError('Цей нікнейм вже використовується');
      return;
    }
    
    setNicknameError('');
    // Success logic here
    onSuccess?.();
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border p-0 overflow-hidden">
        {/* Decorative header with leaf motif */}
        <div className="relative bg-gradient-to-r from-[#59631f]/20 to-[#59631f]/5 p-6 border-b border-border">
          <div className="absolute top-4 right-4 opacity-20">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M12 54C12 54 30 42 42 18C42 18 54 30 42 54C30 54 12 54 12 54Z" fill="#59631f" />
            </svg>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl relative z-10">Авторизація</DialogTitle>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-secondary/50 rounded-none border-b border-border h-12">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Вхід
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Реєстрація
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="p-6 mt-0">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  Електронна пошта
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Пароль
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Забули пароль?
              </button>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base"
              >
                Увійти
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Ще немає акаунту?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Зареєструйтесь
                </button>
              </div>
            </form>
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="register" className="p-6 mt-0">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-medium">
                  Електронна пошта
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-nickname" className="text-sm font-medium">
                  Нікнейм
                </Label>
                <Input
                  id="register-nickname"
                  type="text"
                  placeholder="Ваш нікнейм"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameError('');
                  }}
                  className={`bg-secondary border-border ${nicknameError ? 'border-destructive' : ''}`}
                  required
                />
                {nicknameError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1"/>
                      <path d="M6 3v3M6 8v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {nicknameError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm font-medium">
                  Пароль
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Мінімум 6 символів
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base"
              >
                Зареєструватися
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Footer with leaf motif */}
        <div className="px-6 pb-6 flex items-center justify-center gap-2 opacity-30">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 14C3 14 8 11 11 5C11 5 14 8 11 14C8 14 3 14 3 14Z" fill="#59631f" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 14C3 14 8 11 11 5C11 5 14 8 11 14C8 14 3 14 3 14Z" fill="#59631f" />
          </svg>
        </div>
      </DialogContent>
    </Dialog>
  );
}