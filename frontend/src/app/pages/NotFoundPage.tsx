import { useNavigate } from 'react-router';
import { Home, ArrowLeft, Search, Ghost } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-secondary/20 rounded-full blur-[60px] -z-10 animate-pulse" />
      
      <div className="text-center space-y-8 max-w-md">
        {/* Animated Ghost Icon */}
        <div className="relative inline-block">
          <div className="animate-bounce duration-[2000ms]">
            <Ghost className="h-24 w-24 text-primary/40" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-foreground/5 rounded-full blur-sm animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/30">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">Сторінку не знайдено</h2>
          <p className="text-muted-foreground leading-relaxed">
            Здається, ви зайшли в таємне вимірювання, де цієї сторінки не існує. 
            Можливо, вона була видалена або ніколи не існувала.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full sm:w-auto gap-2 h-12 px-8"
            onClick={() => navigate('/')}
          >
            <Home className="h-5 w-5" />
            На головну
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto gap-2 h-12 px-8 border-border/50 hover:bg-secondary/50"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
            Повернутися
          </Button>
        </div>

        <div className="pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 border border-border/50 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Спробуйте скористатися пошуком в каталозі
          </div>
        </div>
      </div>
    </div>
  );
}
