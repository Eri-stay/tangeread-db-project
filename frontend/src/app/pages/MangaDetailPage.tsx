import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, Bookmark, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Upload, BookOpen, Check, Flag, RefreshCw, Pause, X, Heart } from 'lucide-react';
import { mockMangaList, generateMockChapters, type Manga } from '../data/mockData';
import { Button } from '../components/ui/button';
import { MangaCard } from '../components/MangaCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { AuthModal } from '../components/AuthModal';

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function MangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [trending, setTrending] = useState<Manga[]>([]);
  const [similarManga, setSimilarManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [bookmarkStatus, setBookmarkStatus] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [user, setUser] = useState<{username: string, role: string} | null>(null);
  const similarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [mangaRes, trendingRes, similarRes] = await Promise.all([
          fetch(`${apiUrl}/manga/${id}`),
          fetch(`${apiUrl}/manga/trending?limit=10`),
          fetch(`${apiUrl}/manga/${id}/similar?limit=10`)
        ]);

        if (!mangaRes.ok) throw new Error('Манґу не знайдено');
        
        const mangaJson = await mangaRes.json();
        const trendingJson = await trendingRes.json();

        const b = mangaJson.data;
        const mappedTags = b.tags?.map((t: any) => t.name_uk || t.name_en) || [];
        
        const mappedManga: Manga = {
          id: String(b.id),
          title: b.title_ua || b.title_orig || 'Невідома назва',
          coverImage: b.cover_url || 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80',
          author: b.team?.name || 'Невідомо',
          rating: b.avg_rating || 0,
          chapters: b.chapters_count || 0,
          genres: mappedTags.slice(0, 3),
          tags: mappedTags,
          description: b.description || 'Опис відсутній',
          status: b.status || 'ongoing',
          format: b.format || 'manga',
          lastUpdated: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : 'Невідомо',
          team: b.team?.name || 'Немає команди',
        };

        setManga(mappedManga);
        setChapters(b.chapters || []);
        
        if (trendingJson.data) {
          const mappedTrending = trendingJson.data.map((m: any) => ({
            id: String(m.id),
            title: m.title_ua || m.title_orig || 'Невідома назва',
            coverImage: m.cover_url || '',
            author: m.team?.name || 'Невідомо',
            rating: m.avg_rating || 0,
            chapters: m.chapters_count || 0,
            genres: m.tags?.slice(0, 3).map((t: any) => t.name_uk || t.name_en) || [],
          }));
          setTrending(mappedTrending);
        }

        if (similarRes.ok) {
          const similarJson = await similarRes.json();
          if (similarJson.data) {
            const mappedSimilar = similarJson.data.map((m: any) => ({
              id: String(m.id),
              title: m.title_ua || m.title_orig || 'Невідома назва',
              coverImage: m.cover_url || '',
              author: m.team?.name || 'Невідомо',
              rating: m.avg_rating || 0,
              chapters: m.chapters_count || 0,
              genres: m.tags?.slice(0, 3).map((t: any) => t.name_uk || t.name_en) || [],
            }));
            setSimilarManga(mappedSimilar);
          }
        }

        // Fetch user status if logged in
        const token = localStorage.getItem('token');
        if (token) {
          const statusRes = await fetch(`${apiUrl}/users/manga/${id}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            setBookmarkStatus(statusJson.status || null);
            setIsFavorite(statusJson.is_favorite || false);
            setUserRating(statusJson.score || 0);
            setLastReadChapter(statusJson.last_chapter || null);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);
  
  const bookmarkOptions = [
    { value: 'reading', label: 'Читаю', icon: BookOpen },
    { value: 'completed', label: 'Прочитано', icon: Check },
    { value: 'planned', label: 'Заплановано', icon: Flag },
    { value: 'rereading', label: 'Перечитую', icon: RefreshCw },
    { value: 'on_hold', label: 'Відкладено', icon: Pause },
    { value: 'dropped', label: 'Покинуто', icon: X },
  ];

  const chaptersPerPage = 20;
  const sortedChapters = sortOrder === 'desc' ? [...chapters].sort((a, b) => b.number - a.number) : [...chapters].sort((a, b) => a.number - b.number);
  const totalPages = Math.ceil(sortedChapters.length / chaptersPerPage);
  const currentChapters = sortedChapters.slice(
    currentPage * chaptersPerPage,
    (currentPage + 1) * chaptersPerPage
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
        <p>Завантаження інформації про манґу...</p>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-destructive">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">{error || 'Манґу не знайдено'}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Спробувати знову
        </Button>
      </div>
    );
  }

  const handleBookmark = () => {
    if (!user) {
      setShowLoginModal(true);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/manga/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_favorite: newFavorite })
      });

      if (!res.ok) throw new Error();
    } catch (err) {
      setIsFavorite(!newFavorite);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const oldStatus = bookmarkStatus;
    setBookmarkStatus(status);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/manga/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error();
    } catch (err) {
      setBookmarkStatus(oldStatus);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const oldRating = userRating;
    setUserRating(rating);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/manga/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: rating })
      });

      if (!res.ok) throw new Error();
      
      // Refresh manga data to update average rating
      const mangaRes = await fetch(`${apiUrl}/manga/${id}`);
      if (mangaRes.ok) {
        const mangaJson = await mangaRes.json();
        const b = mangaJson.data;
        setManga(prev => prev ? { ...prev, rating: b.avg_rating || 0 } : null);
      }
    } catch (err) {
      setUserRating(oldRating);
    }
  };

  const scrollSimilar = (direction: 'left' | 'right') => {
    if (!similarRef.current) return;
    const scrollAmount = 400;
    const newScroll = direction === 'left' 
      ? similarRef.current.scrollLeft - scrollAmount 
      : similarRef.current.scrollLeft + scrollAmount;
    similarRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Top Section - Metadata */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          {/* Cover */}
          <div className="relative">
            <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-border bg-secondary">
              <ImageWithFallback
                src={manga.coverImage}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{manga.title}</h1>
            <p className="text-muted-foreground mb-4">Автор: {manga.author}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {manga.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-foreground leading-relaxed mb-6">
              {manga.description}
            </p>

            <div className="flex items-center gap-2 mb-6 text-sm">
              <span className="text-muted-foreground">Статус:</span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">{manga.status}</span>
              <span className="mx-2">•</span>
              <span className="text-muted-foreground">Формат:</span>
              <span className="px-2 py-1 bg-secondary text-foreground rounded">{manga.format}</span>
              {lastReadChapter !== null && lastReadChapter > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-muted-foreground">Прочитано:</span>
                  <span className="px-2 py-1 bg-[#aeba68]/20 text-[#aeba68] rounded font-medium">розділ {lastReadChapter}</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to={`/read/${manga.id}/1`}>
                  Почати читати
                </Link>
              </Button>

              {/* Bookmark Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${bookmarkStatus ? 'bg-[#59631f]/10 border-[#59631f] text-[#59631f]' : 'border-border'}`}
                  >
                    {bookmarkStatus ? (
                      <>
                        {(() => {
                          const ActiveIcon = bookmarkOptions.find(opt => opt.value === bookmarkStatus)?.icon || Bookmark;
                          return <ActiveIcon className="h-4 w-4 mr-2 text-[#59631f]" />;
                        })()}
                        {bookmarkOptions.find(opt => opt.value === bookmarkStatus)?.label}
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Додати в закладки
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-popover text-popover-foreground border-border shadow-lg"
                  sideOffset={5}
                >
                  {bookmarkOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = bookmarkStatus === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          if (!user) {
                            setShowLoginModal(true);
                          } else {
                            handleStatusChange(option.value);
                          }
                        }}
                        className={`cursor-pointer hover:bg-secondary focus:bg-secondary transition-colors ${isActive ? 'bg-[#59631f]/20 text-[#59631f]' : ''}`}
                      >
                        <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-[#59631f]' : 'text-muted-foreground'}`} />
                        {option.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Favourite toggle — separate from list status (maps to is_favorite in DB) */}
              <button
                type="button"
                onClick={handleFavorite}
                title={isFavorite ? 'Прибрати з улюбленого' : 'Додати до улюбленого'}
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                  isFavorite
                    ? 'bg-pink-500/10 border-pink-500/50 text-pink-500 hover:bg-pink-500/20'
                    : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Heart className={`h-5 w-5 transition-all ${isFavorite ? 'fill-pink-500' : ''}`} />
              </button>

              {user && (user.role === 'author' || user.role === 'moderator' || user.role === 'admin') && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Link to={`/author/manga/${manga.id}/chapter/new`}>
                    <Upload className="h-4 w-4 mr-2" />
                    Завантажити розділ
                  </Link>
                </Button>
              )}
            </div>

            {/* Rating */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Рейтинг</span>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{manga.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground mr-2">Ваша оцінка:</span>
                {[1, 2, 3, 4, 5,6,7,8,9,10].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        star <= (hoveredStar || userRating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chapter List Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Розділи</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'asc' ? 'Найстаріші спочатку' : 'Найновіші спочатку'}
            </Button>
          </div>

          <div className="space-y-2">
            {currentChapters.map((chapter) => (
              <Link
                key={chapter.ID}
                to={`/read/${manga.id}/${chapter.ChapterNumber}`}
                className="flex items-center justify-between p-3 rounded hover:bg-secondary transition-colors border border-transparent hover:border-primary/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium group-hover:text-primary transition-colors">
                    Том {chapter.VolumeNumber} Розділ {chapter.ChapterNumber} {chapter.Title ? `- ${chapter.Title}` : ''}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {chapter.CreatedAt ? new Date(chapter.CreatedAt).toLocaleDateString('uk-UA') : 'Невідомо'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{(chapter.Views || 0).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Показано {currentPage * chaptersPerPage + 1} до {Math.min((currentPage + 1) * chaptersPerPage, sortedChapters.length)} з {sortedChapters.length} розділів
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-2 text-sm">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Manga Section - Using popular for now */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Схожа манґа
              <div className="h-px w-12 bg-primary/30" />
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollSimilar('left')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollSimilar('right')}
                className="h-8 w-8 border-border/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div 
            ref={similarRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {similarManga.length > 0 ? (
              similarManga.map((m) => (
                <MangaCard key={m.id} manga={m} />
              ))
            ) : (
              trending.filter(m => m.id !== manga.id).slice(0, 8).map((m) => (
                <MangaCard key={m.id} manga={m} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Auth Modal — shown when guest tries a protected action */}
      <AuthModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </div>
  );
}