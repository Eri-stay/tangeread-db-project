import { useState } from 'react';
import { Search, Edit, EyeOff, Eye, MessageSquare } from 'lucide-react';
import { Link } from 'react-router';
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

export function ContentModerationPage() {
  const [mangaList, setMangaList] = useState<Manga[]>(mockManga);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [mangaSearch, setMangaSearch] = useState('');
  const [editMangaModalOpen, setEditMangaModalOpen] = useState(false);
  const [hideMangaModalOpen, setHideMangaModalOpen] = useState(false);
  const [editCommentModalOpen, setEditCommentModalOpen] = useState(false);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [hideReason, setHideReason] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const filteredManga = mangaList.filter((manga) =>
    manga.title.toLowerCase().includes(mangaSearch.toLowerCase()) ||
    manga.author.toLowerCase().includes(mangaSearch.toLowerCase())
  );

  const handleHideManga = (manga: Manga) => {
    setSelectedManga(manga);
    setHideReason('');
    setHideMangaModalOpen(true);
  };

  const confirmHideManga = (reason: string, customNote: string) => {
    if (selectedManga) {
      const fullReason = customNote ? `${reason} - ${customNote}` : reason;
      setMangaList((prev) =>
        prev.map((manga) =>
          manga.id === selectedManga.id
            ? { ...manga, isHidden: true, hiddenReason: fullReason }
            : manga
        )
      );
      setHideMangaModalOpen(false);
    }
  };

  const handleShowManga = (mangaId: string) => {
    setMangaList((prev) =>
      prev.map((manga) =>
        manga.id === mangaId
          ? { ...manga, isHidden: false, hiddenReason: undefined }
          : manga
      )
    );
  };

  const handleEditComment = (comment: Comment) => {
    setSelectedComment(comment);
    setEditedContent(comment.content);
    setEditCommentModalOpen(true);
  };

  const confirmEditComment = () => {
    if (selectedComment && editedContent.trim()) {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === selectedComment.id
            ? { ...comment, content: editedContent }
            : comment
        )
      );
    }
    setEditCommentModalOpen(false);
  };

  const handleHideComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, isHidden: true, content: 'Приховано модератором' }
          : comment
      )
    );
  };

  const handleShowComment = (commentId: string, originalContent: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, isHidden: false }
          : comment
      )
    );
  };

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
                  placeholder="Пошук манги за назвою або автором"
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
                      <th className="text-left px-6 py-4 text-sm font-semibold">Автор</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Статус</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredManga.map((manga) => (
                      <tr
                        key={manga.id}
                        className={`hover:bg-secondary/20 transition-colors ${
                          manga.isHidden ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Manga with Cover */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-16 rounded overflow-hidden bg-secondary">
                              <ImageWithFallback
                                src={manga.cover}
                                alt={manga.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{manga.title}</p>
                              {manga.isHidden && manga.hiddenReason && (
                                <p className="text-xs text-destructive mt-1">
                                  Приховано: {manga.hiddenReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="px-6 py-4 text-muted-foreground">{manga.author}</td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              manga.isHidden
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            {manga.isHidden ? 'Прихований' : manga.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedManga(manga);
                                setEditMangaModalOpen(true);
                              }}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Редагувати
                            </Button>
                            {manga.isHidden ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowManga(manga.id)}
                                className="gap-1 text-green-500 hover:text-green-500 border-green-500/30"
                              >
                                <Eye className="h-3 w-3" />
                                Показати
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleHideManga(manga)}
                                className="gap-1 text-destructive hover:text-destructive border-destructive/30"
                              >
                                <EyeOff className="h-3 w-3" />
                                Приховати
                              </Button>
                            )}
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
                    className={`p-4 rounded-lg border transition-colors ${
                      comment.isHidden
                        ? 'bg-destructive/5 border-destructive/30'
                        : 'bg-secondary/30 border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border flex-shrink-0">
                        <ImageWithFallback
                          src={comment.authorAvatar}
                          alt={comment.author}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <Link
                          to={`/read/${comment.mangaId}/${comment.chapterNumber}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {comment.mangaTitle} - Розділ {comment.chapterNumber}
                        </Link>
                      </div>
                    </div>

                    <p
                      className={`mb-3 ${
                        comment.isHidden ? 'text-destructive italic' : 'text-foreground'
                      }`}
                    >
                      {comment.content}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditComment(comment)}
                        disabled={comment.isHidden}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Редагувати
                      </Button>
                      {comment.isHidden ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowComment(comment.id, comment.content)}
                          className="gap-1 text-green-500 hover:text-green-500 border-green-500/30"
                        >
                          <Eye className="h-3 w-3" />
                          Показати
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHideComment(comment.id)}
                          className="gap-1 text-destructive hover:text-destructive border-destructive/30"
                        >
                          <EyeOff className="h-3 w-3" />
                          Приховати
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Manga Modal */}
      <Dialog open={editMangaModalOpen} onOpenChange={setEditMangaModalOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редагування манги</DialogTitle>
            <DialogDescription>
              Редагування метаданих для: {selectedManga?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Функція редагування метаданих буде реалізована в майбутніх версіях.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMangaModalOpen(false)}>
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Manga Modal */}
      <HideReasonModal
        open={hideMangaModalOpen}
        onClose={() => setHideMangaModalOpen(false)}
        contentType="manga"
        contentTitle={selectedManga?.title || ''}
        onConfirm={confirmHideManga}
      />

      {/* Edit Comment Modal */}
      <Dialog open={editCommentModalOpen} onOpenChange={setEditCommentModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Редагування коментаря</DialogTitle>
            <DialogDescription>
              Санітарна обробка неприйнятного тексту
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-content">Вміст коментаря</Label>
              <Textarea
                id="edit-content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="bg-secondary border-border min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCommentModalOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={confirmEditComment}
              disabled={!editedContent.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Зберегти зміни
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}