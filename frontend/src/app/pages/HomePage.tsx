import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { MangaCard } from '../components/MangaCard';
import type { Manga } from '../data/mockData';
import { Button } from '../components/ui/button';

export function HomePage() {
  const [forYouScroll, setForYouScroll] = useState(0);
  const [continueScroll, setContinueScroll] = useState(0);
  const [trendingScroll, setTrendingScroll] = useState(0);
  const [latestPage, setLatestPage] = useState(0);

  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const forYouRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLDivElement>(null);
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
      if (ref.current) {
        setter(ref.current.scrollLeft);
      }
    };

    const forYouCurrent = forYouRef.current;
    const continueCurrent = continueRef.current;
    const trendingCurrent = trendingRef.current;

    const forYouHandler = () => handleScroll(forYouRef, setForYouScroll);
    const continueHandler = () => handleScroll(continueRef, setContinueScroll);
    const trendingHandler = () => handleScroll(trendingRef, setTrendingScroll);

    forYouCurrent?.addEventListener('scroll', forYouHandler);
    continueCurrent?.addEventListener('scroll', continueHandler);
    trendingCurrent?.addEventListener('scroll', trendingHandler);

    return () => {
      forYouCurrent?.removeEventListener('scroll', forYouHandler);
      continueCurrent?.removeEventListener('scroll', continueHandler);
      trendingCurrent?.removeEventListener('scroll', trendingHandler);
    };
  }, []);

  useEffect(() => {
    const fetchMangas = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Щоб TS не сварився на .env, можна використати cast до any або налаштувати d.ts
        const env = (import.meta as any).env;
        const apiUrl = env.VITE_API_URL || 'http://localhost:8080/api';

        const res = await fetch(`${apiUrl}/manga`);
        if (!res.ok) throw new Error('Failed to fetch data');

        const json = await res.json();

        const mappedData: Manga[] = (json.data || []).map((b: any) => ({
          id: String(b.ID),
          title: b.TitleUa || 'Невідома назва',
          author: 'Невідомо',
          coverImage: b.CoverURL || 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80',
          rating: b.AvgRating || 0,
          status: b.Status || 'ongoing',
          format: 'Manga',
          chapters: b.Chapters ? b.Chapters.length : 0,
          description: b.Description || '',
          genres: b.Tags && b.Tags.length > 0 ? b.Tags.map((t: any) => t.Name) : ['Фентезі']
        }));

        setMangaList(mappedData);
      } catch (err) {
        setError('Не вдалося завантажити дані з сервера');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  }, []);

  const latestUpdates = mangaList.length > 0
    ? Array.from({ length: 30 }, (_, i) => mangaList[i % mangaList.length])
    : [];
  const itemsPerPage = 30;
  const totalPages = Math.max(1, Math.ceil(latestUpdates.length / itemsPerPage));

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
            {/* Section 1: For You */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  Для вас
                  <div className="h-px w-12 bg-primary/30" />
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(forYouRef, 'left')} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(forYouRef, 'right')} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div
                ref={forYouRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {mangaList.length === 0 ? (
                  <p className="text-muted-foreground">Немає доступної манґи</p>
                ) : (
                  mangaList.slice(0, 8).map((manga) => (
                    <MangaCard key={manga.id} manga={manga} />
                  ))
                )}
              </div>
            </section>

            {/* Section 2: Continue Reading */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  Продовжити читати
                  <div className="h-px w-12 bg-primary/30" />
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(continueRef, 'left')} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(continueRef, 'right')} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div ref={continueRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {mangaList.slice(0, 8).map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>

            {/* Section 3: Trending */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  Популярне
                  <div className="h-px w-12 bg-primary/30" />
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(trendingRef, 'left')} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => scrollContainer(trendingRef, 'right')} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div ref={trendingRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[...mangaList].sort((a, b) => b.rating - a.rating).slice(0, 8).map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </section>

            {/* Section 4: Latest Updates */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  Останні оновлення
                  <div className="h-px w-12 bg-primary/30" />
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.max(0, prev - 1))} disabled={latestPage === 0} className="h-8 w-8 border-border/50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={latestPage === totalPages - 1} className="h-8 w-8 border-border/50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
                {latestUpdates.map((manga, idx) => (
                  <MangaCard key={`${manga.id}-${idx}`} manga={manga} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.max(0, prev - 1))} disabled={latestPage === 0} className="h-8 w-8 border-border/50">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Сторінка {latestPage + 1} з {totalPages}
                </span>
                <Button variant="outline" size="icon" onClick={() => setLatestPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={latestPage === totalPages - 1} className="h-8 w-8 border-border/50">
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