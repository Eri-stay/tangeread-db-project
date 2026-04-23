import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, Bookmark, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Upload, BookOpen, Check, Flag, RefreshCw, Pause, X, Heart } from 'lucide-react';
import { mockMangaList, generateMockChapters } from '../data/mockData';
import { Button } from '../components/ui/button';
import { MangaCard } from '../components/MangaCard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface MangaDetailPageProps {
  userRole: 'guest' | 'reader' | 'author' | 'moderator' | 'admin';
}

export function MangaDetailPage({ userRole }: MangaDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [bookmarkStatus, setBookmarkStatus] = useState<string | null>(null);
  const similarRef = useRef<HTMLDivElement>(null);

  const bookmarkOptions = [
    { value: 'reading', label: 'Читаю', icon: BookOpen },
    { value: 'completed', label: 'Прочитано', icon: Check },
    { value: 'planned', label: 'Заплановано', icon: Flag },
    { value: 'rereading', label: 'Перечитую', icon: RefreshCw },
    { value: 'on-hold', label: 'Відкладено', icon: Pause },
    { value: 'dropped', label: 'Покинуто', icon: X },
    { value: 'favorite', label: 'Улюблене', icon: Heart },
  ];

  const manga = mockMangaList.find(m => m.id === id);
  
  if (!manga) {
    return <div className="container mx-auto px-4 py-8">Манґу не знайдено</div>;
  }

  const allChapters = generateMockChapters(manga.chapters);
  const sortedChapters = sortOrder === 'desc' ? allChapters : [...allChapters].reverse();
  
  const chaptersPerPage = 20;
  const totalPages = Math.ceil(sortedChapters.length / chaptersPerPage);
  const currentChapters = sortedChapters.slice(
    currentPage * chaptersPerPage,
    (currentPage + 1) * chaptersPerPage
  );

  const handleBookmark = () => {
    if (userRole === 'guest') {
      setShowLoginModal(true);
    }
  };

  const handleRating = (rating: number) => {
    if (userRole === 'guest') {
      setShowLoginModal(true);
    } else {
      setUserRating(rating);
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
              {manga.genres.map((genre, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm"
                >
                  {genre}
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
                          if (userRole === 'guest') {
                            setShowLoginModal(true);
                          } else {
                            setBookmarkStatus(option.value);
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

              {(userRole === 'author' || userRole === 'moderator' || userRole === 'admin') && (
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
                key={chapter.id}
                to={`/read/${manga.id}/${chapter.number}`}
                className="flex items-center justify-between p-3 rounded hover:bg-secondary transition-colors border border-transparent hover:border-primary/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {chapter.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {chapter.releaseDate}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{chapter.views.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Показано {currentPage * chaptersPerPage + 1} до {Math.min((currentPage + 1) * chaptersPerPage, sortedChapters.length)} з {sortedChapters.length} записів
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

        {/* Similar Manga Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Схожа манга
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
            {mockMangaList.filter(m => m.id !== manga.id).slice(0, 8).map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>
        </section>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Потрібна авторизація</DialogTitle>
            <DialogDescription>
              Для використання цієї функції необхідно увійти до системи. 
              Будь ласка, змініть роль на "Зареєстрований читач" або вище у профілі користувача.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowLoginModal(false)} className="mt-4">
            Зрозуміло
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}