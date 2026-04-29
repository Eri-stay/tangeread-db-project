import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Home, List, MessageSquare, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CommentsSection } from '../components/CommentsSection';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function ReaderPage() {
  const { id, chapter } = useParams<{ id: string; chapter: string }>();
  const navigate = useNavigate();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [lastScrollY, setLastScrollY] = useState(0);

  const [manga, setManga] = useState<any>(null);
  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Current logged-in user
  const currentUser = 'ihnore_ihor';

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [mRes, cRes] = await Promise.all([
          fetch(`${apiUrl}/manga/${id}`),
          fetch(`${apiUrl}/manga/${id}/chapters/${chapter}`)
        ]);

        if (!mRes.ok) throw new Error('Манґу не знайдено');
        if (!cRes.ok) throw new Error('Розділ не знайдено');

        const mData = await mRes.json();
        const cData = await cRes.json();

        setManga(mData.data);
        setChapterInfo(cData.data);

        // Parse pages
        const rawPages = cData.data.PagesURL;
        if (rawPages) {
          try {
            const parsed = JSON.parse(rawPages);
            setPages(Array.isArray(parsed) ? parsed : []);
          } catch {
            // Fallback to comma separated
            setPages(rawPages.split(',').map((s: string) => s.trim()));
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && chapter) loadData();
  }, [id, chapter]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
        setControlsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
        setControlsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Завантаження розділу...</div>;
  }

  if (error || !manga || !chapterInfo) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">{error || 'Помилка завантаження'}</h1>
        <Button onClick={() => navigate(-1)}>Повернутися назад</Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-border/40 transition-transform duration-300 ${controlsVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/manga/${id}`)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{manga.TitleUa}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">Розділ {chapterInfo.ChapterNumber}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reader Area */}
      <div
        className="max-w-4xl mx-auto pt-16 pb-8"
        onClick={toggleControls}
      >
        {pages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Сторінки відсутні або ще завантажуються
          </div>
        ) : (
          pages.map((page, idx) => (
            <div key={idx} className="mb-1">
              <ImageWithFallback
                src={page}
                alt={`Page ${idx + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))
        )}
      </div>

      {/* Bottom Controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-t border-border/40 transition-transform duration-300 ${controlsVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => chapterInfo.ChapterNumber > 1 && navigate(`/read/${id}/${chapterInfo.ChapterNumber - 1}`)}
            disabled={chapterInfo.ChapterNumber <= 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Попередній
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/manga/${id}`)}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Всі розділи
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => chapterInfo.ChapterNumber < (manga.chapters_count || 1000) && navigate(`/read/${id}/${chapterInfo.ChapterNumber + 1}`)}
            disabled={chapterInfo.ChapterNumber >= (manga.chapters_count || 1000)}
            className="gap-2"
          >
            Наступний
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-background border-t border-border">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <CommentsSection chapterId={chapterInfo.id} />
        </div>
      </div>
    </div>
  );
}