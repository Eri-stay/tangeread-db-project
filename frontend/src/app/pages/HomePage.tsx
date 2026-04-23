import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MangaCard } from '../components/MangaCard';
import { mockMangaList } from '../data/mockData';
import { Button } from '../components/ui/button';

export function HomePage() {
  const [forYouScroll, setForYouScroll] = useState(0);
  const [continueScroll, setContinueScroll] = useState(0);
  const [trendingScroll, setTrendingScroll] = useState(0);
  const [latestPage, setLatestPage] = useState(0);

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

  // Generate 30 items for latest updates
  const latestUpdates = Array.from({ length: 30 }, (_, i) => mockMangaList[i % mockMangaList.length]);
  const itemsPerPage = 30;
  const totalPages = Math.ceil(latestUpdates.length / itemsPerPage);

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
        {/* Section 1: For You */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Для вас
              <div className="h-px w-12 bg-primary/30" />
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollContainer(forYouRef, 'left')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollContainer(forYouRef, 'right')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div 
            ref={forYouRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mockMangaList.slice(0, 8).map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollContainer(continueRef, 'left')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollContainer(continueRef, 'right')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div 
            ref={continueRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mockMangaList.slice(2, 10).map((manga) => (
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollContainer(trendingRef, 'left')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollContainer(trendingRef, 'right')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div 
            ref={trendingRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...mockMangaList].sort((a, b) => b.rating - a.rating).slice(0, 8).map((manga) => (
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLatestPage(Math.max(0, latestPage - 1))}
                disabled={latestPage === 0}
                className="h-8 w-8 border-border/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLatestPage(Math.min(totalPages - 1, latestPage + 1))}
                disabled={latestPage === totalPages - 1}
                className="h-8 w-8 border-border/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
            {latestUpdates.map((manga, idx) => (
              <MangaCard key={`${manga.id}-${idx}`} manga={manga} />
            ))}
          </div>

          {/* Pagination - Bottom */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLatestPage(Math.max(0, latestPage - 1))}
              disabled={latestPage === 0}
              className="h-8 w-8 border-border/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Сторінка {latestPage + 1} з {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLatestPage(Math.min(totalPages - 1, latestPage + 1))}
              disabled={latestPage === totalPages - 1}
              className="h-8 w-8 border-border/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
