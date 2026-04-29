import { useEffect, useState } from 'react';
import { Search, EyeOff, Eye, MessageSquare, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { HideReasonModal } from '../components/HideReasonModal';

interface Manga {
  id: string;
  title: string;
  cover: string;
  author: string;
  status: string;
  isHidden: boolean;
  hiddenReason?: string;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  mangaTitle: string;
  mangaId: string;
  chapterNumber: number;
  isHidden: boolean;
  timestamp: string;
}

const mockManga: Manga[] = [
  {
    id: '1',
    title: 'Безсмертний Культиватор',
    cover: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300',
    author: 'КитайськийДракон',
    status: 'Триває',
    isHidden: false,
  },
  {
    id: '2',
    title: 'Тінь та Кістка',
    cover: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=300',
    author: 'SakuraBlossom',
    status: 'Триває',
    isHidden: false,
  },
  {
    id: '3',
    title: 'Заборонений контент',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300',
    author: 'BadActor',
    status: 'Призупинено',
    isHidden: true,
    hiddenReason: 'Порушення авторських прав',
  },
];

const mockComments: Comment[] = [
  {
    id: 'c1',
    author: 'ReaderOne',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    content: 'Чудовий розділ! Не можу дочекатися наступного.',
    mangaTitle: 'Безсмертний Культиватор',
    mangaId: '1',
    chapterNumber: 45,
    isHidden: false,
    timestamp: '2 години тому',
  },
  {
    id: 'c2',
    author: 'ToxicUser',
    authorAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
    content: '[НЕПРИЙНЯТНИЙ КОНТЕНТ]',
    mangaTitle: 'Тінь та Кістка',
    mangaId: '2',
    chapterNumber: 12,
    isHidden: true,
    timestamp: '1 день тому',
  },
  {
    id: 'c3',
    author: 'HappyReader',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'Дякую за переклад! Якість топ 👍',
    mangaTitle: 'Безсмертний Культиватор',
    mangaId: '1',
    chapterNumber: 44,
    isHidden: false,
    timestamp: '3 дні тому',
  },
];
const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function ContentModerationPage() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [mangaSearch, setMangaSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hideMangaModalOpen, setHideMangaModalOpen] = useState(false);
  const [selectedManga, setSelectedManga] = useState<any | null>(null);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  // Role check: Only moderators and admins allowed
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
      navigate('/');
    } else {
      fetchManga();
      fetchComments();
    }
  }, [currentUser, navigate]);

  const fetchManga = async () => {
    try {
      const response = await fetch(`${apiUrl}/moderation/manga`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setMangaList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch manga:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${apiUrl}/moderation/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setComments(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const filteredManga = mangaList.filter((manga) =>
    manga.title_ua.toLowerCase().includes(mangaSearch.toLowerCase()) ||
    manga.title_orig?.toLowerCase().includes(mangaSearch.toLowerCase())
  );

  const handleToggleMangaVisibility = async (mangaId: number) => {
    const manga = mangaList.find(m => m.id === mangaId);
    if (!manga) return;

    if (manga.display_status === 'active') {
      // Show modal for hiding
      setSelectedManga(manga);
      setHideMangaModalOpen(true);
    } else {
      // Just toggle for showing back
      await executeMangaToggle(mangaId);
    }
  };

  const executeMangaToggle = async (mangaId: number, reason?: string) => {
    try {
      const response = await fetch(`${apiUrl}/moderation/manga/${mangaId}/toggle`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: reason ? JSON.stringify({ reason }) : undefined
      });
      if (response.ok) {
        fetchManga();
      }
    } catch (err) {
      console.error('Failed to toggle manga visibility:', err);
    }
  };

  const confirmHideManga = async (reason: string, customNote: string) => {
    if (selectedManga) {
      const fullReason = customNote ? `${reason}: ${customNote}` : reason;
      await executeMangaToggle(selectedManga.id, fullReason);
      setHideMangaModalOpen(false);
    }
  };

  const handleToggleCommentVisibility = async (commentId: number) => {
    try {
      const response = await fetch(`${apiUrl}/moderation/comments/${commentId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to toggle comment visibility:', err);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Модерація контенту</h1>
          <p className="text-muted-foreground">
            Управління мангою та коментарями на платформі
          </p>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
        </div>

        <Tabs defaultValue="manga" className="space-y-6">
          <TabsList className="bg-secondary/50 border-b border-border rounded-none h-12 p-0 w-full justify-start">
            <TabsTrigger
              value="manga"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              Керування мангою
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              Модерація коментарів
            </TabsTrigger>
          </TabsList>

          {/* Manga Management Tab */}
          <TabsContent value="manga" className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Пошук манги за назвою..."
                  value={mangaSearch}
                  onChange={(e) => setMangaSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border h-11"
                />
              </div>
            </div>

            {/* Manga List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-secondary/20">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Манга</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Команда</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Статус</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredManga.map((manga) => (
                      <tr
                        key={manga.id}
                        className={`hover:bg-secondary/20 transition-colors ${manga.display_status === 'hidden_by_mod' ? 'opacity-60 bg-destructive/5' : ''
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-16 rounded overflow-hidden bg-secondary">
                              <ImageWithFallback
                                src={manga.cover_url}
                                alt={manga.title_ua}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{manga.title_ua}</p>
                              <p className="text-xs text-muted-foreground">{manga.title_orig}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-muted-foreground">
                          {manga.team?.name || 'Без команди'}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${manga.display_status === 'hidden_by_mod'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-primary/20 text-primary'
                              }`}
                          >
                            {manga.display_status === 'hidden_by_mod' ? 'Приховано' : 'Активно'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleMangaVisibility(manga.id)}
                              className={`gap-1 ${manga.display_status === 'hidden_by_mod'
                                  ? 'text-green-500 border-green-500/30'
                                  : 'text-destructive border-destructive/30'
                                }`}
                            >
                              {manga.display_status === 'hidden_by_mod' ? (
                                <><Eye className="h-3 w-3" /> Показати</>
                              ) : (
                                <><EyeOff className="h-3 w-3" /> Приховати</>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Comment Moderation Tab */}
          <TabsContent value="comments" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Коментарі</h3>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border transition-colors ${comment.display_status === 'hidden_by_mod'
                        ? 'bg-destructive/5 border-destructive/30'
                        : 'bg-secondary/30 border-border hover:border-primary/30'
                      }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border flex-shrink-0">
                        <ImageWithFallback
                          src={comment.user?.avatar_url}
                          alt={comment.user?.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comment.user?.username}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString('uk-UA')}
                          </span>
                        </div>
                        {comment.chapter?.manga && (
                          <Link
                            to={`/read/${comment.chapter.manga_id}/${comment.chapter.chapter_number}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {comment.chapter.manga.title_ua} - Розділ {comment.chapter.chapter_number}
                          </Link>
                        )}
                      </div>
                    </div>

                    <p
                      className={`mb-3 ${comment.display_status === 'hidden_by_mod' ? 'text-destructive italic' : 'text-foreground'
                        }`}
                    >
                      {comment.content}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCommentVisibility(comment.id)}
                        className={`gap-1 ${comment.display_status === 'hidden_by_mod'
                            ? 'text-green-500 border-green-500/30'
                            : 'text-destructive border-destructive/30'
                          }`}
                      >
                        {comment.display_status === 'hidden_by_mod' ? (
                          <><Eye className="h-3 w-3" /> Показати</>
                        ) : (
                          <><EyeOff className="h-3 w-3" /> Приховати</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hide Manga Modal */}
      <HideReasonModal
        open={hideMangaModalOpen}
        onClose={() => setHideMangaModalOpen(false)}
        contentType="manga"
        contentTitle={selectedManga?.title || ''}
        onConfirm={confirmHideManga}
      />
    </AdminLayout>
  );
}