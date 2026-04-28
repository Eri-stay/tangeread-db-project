import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Settings, Home, List, MessageSquare, Reply, Pencil, Trash2 } from 'lucide-react';
import { mockMangaList, mockComments } from '../data/mockData';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Textarea } from '../components/ui/textarea';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  deleted?: boolean;
  replies: Comment[];
}

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function ReaderPage() {
  const { id, chapter } = useParams<{ id: string; chapter: string }>();
  const navigate = useNavigate();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sortingMode, setSortingMode] = useState<'Newest' | 'Oldest'>('Newest');

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

  const renderComment = (comment: Comment, depth: number = 0, parentAvatarOffset: number = 0) => {
    const marginLeft = depth * 48;
    const currentAvatarOffset = marginLeft + 0; // Avatar starts at marginLeft
    const isOwnComment = comment.author === currentUser;
    const isDeleted = comment.deleted;

    return (
      <div key={comment.id} className="relative">
        {/* L-shaped connector line to parent's avatar */}
        {depth > 0 && (
          <div
            className="absolute pointer-events-none z-0"
            style={{
              left: `${parentAvatarOffset + 20}px`, // Center of parent avatar (20px = half of 40px avatar)
              top: 0,
              width: `${marginLeft - parentAvatarOffset}px`,
              height: '32px'
            }}
          >
            <svg className="w-full h-full" preserveAspectRatio="none">
              <path
                d={`M 0 0 L 0 20 Q 0 24 4 24 L ${marginLeft - parentAvatarOffset} 24`}
                fill="none"
                stroke="rgba(89, 99, 31, 0.4)"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        <div
          className="flex gap-3 mb-4 relative z-10"
          style={{ marginLeft: `${marginLeft}px` }}
        >
          <ImageWithFallback
            src={comment.avatar}
            alt={comment.author}
            className={`w-10 h-10 rounded-full flex-shrink-0 border-2 border-border ${isDeleted ? 'opacity-40' : ''}`}
          />

          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-sm ${isDeleted ? 'text-muted-foreground' : ''}`}>
                  {comment.author}
                </span>
                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
              </div>

              {/* Comment Content */}
              {isDeleted ? (
                <p className="text-sm leading-relaxed mb-2 text-muted-foreground italic">
                  [Коментар видалено користувачем]
                </p>
              ) : (
                <p className="text-sm leading-relaxed mb-2">{comment.content}</p>
              )}

              {/* Action Buttons */}
              {!isDeleted && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="h-3 w-3" />
                    <span>Відповісти</span>
                  </button>

                  {isOwnComment && (
                    <>
                      <button
                        className="flex items-center gap-1 hover:text-destructive transition-colors"
                        onClick={() => {
                          // In a real app, this would soft-delete in the backend
                          console.log('Deleting comment:', comment.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Видалити</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-2 ml-4">
                <Textarea
                  placeholder="Напишіть відповідь..."
                  className="mb-2 bg-secondary border-border"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#59631f] hover:bg-[#59631f]/90">
                    Надіслати
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                    Скасувати
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Render Replies - Even for deleted comments to show threading */}
        {comment.replies.length > 0 && (
          <div>
            {comment.replies.map(reply => renderComment(reply, depth + 1, currentAvatarOffset))}
          </div>
        )}
      </div>
    );
  };

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
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
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
          <div className="flex items-center w-full gap-3 mb-6">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Коментарі</h2>
            <span className="text-sm text-muted-foreground">
              ({mockComments.length + mockComments.reduce((acc, c) => acc + c.replies.length + c.replies.reduce((a, r) => a + r.replies.length, 0), 0)})
            </span>

            {/* Right: Newest/Oldest Toggle*/}
            <div className="flex w-full justify-end">
              <div className="inline-flex items-center gap-6"> {/* Використовуємо gap замість border */}
                <button
                  onClick={() => setSortingMode('Newest')}
                  className={`py-2 text-sm font-medium transition-colors ${sortingMode === 'Newest'
                      ? 'text-[#aeba68] underline decoration-[#aeba68] underline-offset-4 decoration-2'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Новіші
                </button>
                <button
                  onClick={() => setSortingMode('Oldest')}
                  className={`py-2 text-sm font-medium transition-colors ${sortingMode === 'Oldest'
                      ? 'text-[#aeba68] underline decoration-[#aeba68] underline-offset-4 decoration-2'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Старіші
                </button>
              </div>
            </div>
          </div>

          {/* New Comment */}
          <div className="mb-8 bg-card border border-border rounded-lg p-4">
            <Textarea
              placeholder="Напишіть коментар..."
              className="mb-3 bg-secondary border-border"
              rows={4}
            />
            <Button>Опублікувати коментар</Button>
          </div>

          {/* Comment List with Threading */}
          <div className="space-y-2">
            {mockComments.map(comment => renderComment(comment, 0, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}