import { ShieldAlert, LogIn, Ban, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate, useLocation } from 'react-router';
import { useState } from 'react';
import { AuthModal } from '../components/AuthModal';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);

  const reason = (location.state as any)?.reason as string | undefined;

  const config = {
    not_logged_in: {
      icon: <LogIn className="h-24 w-24 text-primary mb-6" />,
      title: 'Необхідна авторизація',
      message: 'Увійдіть в акаунт, щоб отримати доступ до цієї сторінки.',
      actions: (
        <>
          <Button
            onClick={() => setAuthOpen(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Увійти
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} size="lg">
            На головну
          </Button>
        </>
      ),
    },
    banned: {
      icon: <Ban className="h-24 w-24 text-destructive mb-6" />,
      title: 'Акаунт заблокований',
      message: 'Ваш акаунт заблокований. Зверніться до адміністрації для отримання додаткової інформації.',
      actions: (
        <Button onClick={() => navigate('/')} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          На головну
        </Button>
      ),
    },
    insufficient_role: {
      icon: <Lock className="h-24 w-24 text-destructive mb-6" />,
      title: 'Недостатньо прав',
      message: 'У вас недостатньо прав для перегляду цієї сторінки.',
      actions: (
        <>
          <Button onClick={() => navigate('/')} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            На головну
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} size="lg">
            Повернутися назад
          </Button>
        </>
      ),
    },
    default: {
      icon: <ShieldAlert className="h-24 w-24 text-destructive mb-6" />,
      title: 'Доступ заборонено',
      message: 'У вас немає прав для перегляду цієї сторінки. Схоже, вам потрібні права адміністратора або ви потрапили сюди помилково.',
      actions: (
        <>
          <Button onClick={() => navigate('/')} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            На головну
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} size="lg">
            Повернутися назад
          </Button>
        </>
      ),
    },
  };

  const active = config[reason as keyof typeof config] ?? config.default;

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        {active.icon}
        <h1 className="text-4xl font-bold mb-4">{active.title}</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">{active.message}</p>
        <div className="flex gap-4 flex-wrap justify-center">{active.actions}</div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => navigate(-1)} />
    </>
  );
}
