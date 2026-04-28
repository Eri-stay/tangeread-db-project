import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { MangaCard } from '../components/MangaCard';
import type { Manga } from '../data/mockData';
import { Button } from '../components/ui/button';

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

function mapManga(b: any): Manga {
  const mappedTags = b.Tags && b.Tags.length > 0 
    ? b.Tags.map((t: any) => t.NameUk || t.NameEn || '') 
    : ['Фентезі'];

  return {
    id: String(b.ID),
    title: b.TitleUa || 'Невідома назва',
    author: b.Team?.Name || 'Невідомо',
    coverImage: b.CoverURL || 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80',
    rating: b.AvgRating || 0,
    status: b.Status || 'ongoing',
    format: b.Format || 'manga',
    chapters: b.Chapters ? b.Chapters.length : 0,
    description: b.Description || '',
    genres: mappedTags,
    tags: mappedTags,
    lastUpdated: b.UpdatedAt ? new Date(b.UpdatedAt).toISOString().split('T')[0] : '2026-04-27',
  };
}

async function fetchSection(endpoint: string, limit: number): Promise<Manga[]> {
  const res = await fetch(`${apiUrl}${endpoint}?limit=${limit}`);
  if (!res.ok) throw new Error('fetch error');
  const json = await res.json();
  return (json.data || []).map(mapManga);
}

export function HomePage() {
  const [forYouScroll, setForYouScroll] = useState(0);
  const [trendingScroll, setTrendingScroll] = useState(0);
  const [latestPage, setLatestPage] = useState(0);

  const [trending, setTrending] = useState<Manga[]>([]);
  const [latest, setLatest] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const forYouRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const scrollAmount = 400;
    const newScroll = direction === 'left'
      ? ref.current.scrollLeft - scrollAmount
      : ref.current.scrollLeft + scrollAmount;
    ref.current.scrollTo({ left: newScroll, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = (ref: React.RefObject<HTMLDivElement>, setter: (val: number) => void) => {
      if (ref.current) setter(ref.current.scrollLeft);
    };

    const forYouCurrent = forYouRef.current;
    const trendingCurrent = trendingRef.current;

    const forYouHandler = () => handleScroll(forYouRef, setForYouScroll);
    const trendingHandler = () => handleScroll(trendingRef, setTrendingScroll);

    forYouCurrent?.addEventListener('scroll', forYouHandler);
    trendingCurrent?.addEventListener('scroll', trendingHandler);

    return () => {
      forYouCurrent?.removeEventListener('scroll', forYouHandler);
      trendingCurrent?.removeEventListener('scroll', trendingHandler);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [trendingData, latestData] = await Promise.all([
          fetchSection('/manga/trending', 12),
          fetchSection('/manga/latest', 30),
        ]);
        setTrending(trendingData);
        setLatest(latestData);
      } catch {
        setError('Не вдалося завантажити дані з сервера');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const itemsPerPage = 30;
  const totalPages = Math.max(1, Math.ceil(latest.length / itemsPerPage));
  const latestPage0 = Math.min(latestPage, totalPages - 1);
  const latestVisible = latest.slice(latestPage0 * itemsPerPage, (latestPage0 + 1) * itemsPerPage);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Decorative leaf background */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 right-20">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <path d="M40 180C40 180 100 140 140 60C140 60 180 100 140 180C100 180 40 180 40 180Z" fill="#59631f" />
          </svg>
        </div>
        <div className="absolute bottom-40 left-20">
          <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
            <path d="M30 135C30 135 75 105 105 45C105 45 135 75 105 135C75 135 30 135 30 135Z" fill="#59631f" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
            <p>Завантаження манґи...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-destructive text-destructive hover:bg-destructive/10">
              Спробувати знову
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Section 1: Trending (Popular this week) */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    Популярне
                    <div className="h-px w-12 bg-primary/30" />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    За рейтингами цього тижня (+ ½ від минулого)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(trendingRef, 'left')} disabled={trendingScroll === 0} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(trendingRef, 'right')} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div ref={trendingRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {trending.length === 0 ? (
                  <p className="text-muted-foreground">Немає даних</p>
                ) : (
                  trending.map((manga) => <MangaCard key={manga.id} manga={manga} />)
                )}
              </div>
            </section>

            {/* Section 2: For You (same as trending, slice 0-8 for variety) */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  Для вас
                  <div className="h-px w-12 bg-primary/30" />
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(forYouRef, 'left')} disabled={forYouScroll === 0} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(forYouRef, 'right')} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div ref={forYouRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {latest.slice(0, 8).map((manga) => <MangaCard key={manga.id} manga={manga} />)}
              </div>
            </section>

            {/* Section 3: Latest Updates */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    Останні оновлення
                    <div className="h-px w-12 bg-primary/30" />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Нові розділи</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.max(0, prev - 1))} disabled={latestPage0 === 0} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={latestPage0 === totalPages - 1} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
                {latestVisible.length === 0 ? (
                  <p className="text-muted-foreground col-span-full">Немає оновлень</p>
                ) : (
                  latestVisible.map((manga, idx) => (
                    <MangaCard key={`${manga.id}-${idx}`} manga={manga} />
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.max(0, prev - 1))} disabled={latestPage0 === 0} className="h-8 w-8 border-border/50">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Сторінка {latestPage0 + 1} з {totalPages}
                </span>
                <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={latestPage0 === totalPages - 1} className="h-8 w-8 border-border/50">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}