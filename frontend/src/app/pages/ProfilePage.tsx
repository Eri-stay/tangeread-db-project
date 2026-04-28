import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Star,
  Trash2,
  AlertTriangle,
  Settings,
  Clock,
  BookOpen,
  Filter,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import LeafDivider from "../../imports/svg-leaf-divider";

interface BookmarkManga {
  id: string;
  title: string;
  coverImage: string;
  rating: number;
  lastReadChapter: number;
  totalChapters: number;
  addedDate: string;
}

interface HistoryEntry {
  id: string;
  mangaId: string;
  mangaTitle: string;
  coverImage: string;
  chapterNumber: number;
  timeAgo: string;
}

// Mock data
const mockBookmarks: { [key: string]: BookmarkManga[] } = {
  reading: [
    {
      id: "1",
      title: "Безсмертний Культиватор",
      coverImage:
        "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300",
      rating: 5,
      lastReadChapter: 45,
      totalChapters: 120,
      addedDate: "2026-03-20",
    },
    {
      id: "2",
      title: "Тінь та Кістка",
      coverImage:
        "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=300",
      rating: 4,
      lastReadChapter: 12,
      totalChapters: 56,
      addedDate: "2026-03-18",
    },
  ],
  completed: [
    {
      id: "3",
      title: "Таємниці Академії Магії",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300",
      rating: 5,
      lastReadChapter: 80,
      totalChapters: 80,
      addedDate: "2026-03-10",
    },
  ],
  favorite: [
    {
      id: "1",
      title: "Безсмертний Культиватор",
      coverImage:
        "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300",
      rating: 5,
      lastReadChapter: 45,
      totalChapters: 120,
      addedDate: "2026-03-20",
    },
  ],
  planned: [
    {
      id: "4",
      title: "Хроніки Небесного Меча",
      coverImage:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300",
      rating: 0,
      lastReadChapter: 0,
      totalChapters: 95,
      addedDate: "2026-03-15",
    },
  ],
  on_hold: [],
  dropped: [],
};

const mockHistory: HistoryEntry[] = [
  {
    id: "h1",
    mangaId: "1",
    mangaTitle: "Безсмертний Культиватор",
    coverImage:
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300",
    chapterNumber: 45,
    timeAgo: "2 години тому",
  },
  {
    id: "h2",
    mangaId: "2",
    mangaTitle: "Тінь та Кістка",
    coverImage:
      "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=300",
    chapterNumber: 12,
    timeAgo: "1 день тому",
  },
  {
    id: "h3",
    mangaId: "5",
    mangaTitle: "Демони Півночі",
    coverImage:
      "https://images.unsplash.com/photo-1604073926896-ce89428b5e59?w=300",
    chapterNumber: 33,
    timeAgo: "3 дні тому",
  },
  {
    id: "h4",
    mangaId: "3",
    mangaTitle: "Таємниці Академії Магії",
    coverImage:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300",
    chapterNumber: 80,
    timeAgo: "1 тиждень тому",
  },
];

export function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [bookmarkCategory, setBookmarkCategory] = useState("reading");
  const [sortBy, setSortBy] = useState("date-added");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bookmarks, setBookmarks] = useState<{ [key: string]: BookmarkManga[] }>({});
  const [bookmarkCounts, setBookmarkCounts] = useState<{ [key: string]: number }>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [bookmarksOffset, setBookmarksOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [hasMoreBookmarks, setHasMoreBookmarks] = useState(true);
  const LIMIT = 20;

  const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${apiUrl}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNickname(data.username || "");
        setAvatar(data.avatar_url || "");
        setEmail(data.email || "");
        setRole(data.role || "");

        // Sync with localStorage for header
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.avatar_url = data.avatar_url;
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event("storage"));
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchBookmarks = async (offset: number, append = false) => {
    try {
      const token = localStorage.getItem('token');
      const bRes = await fetch(`${apiUrl}/users/bookmarks?limit=${LIMIT}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bRes.ok) {
        const bJson = await bRes.json();
        const bData = bJson.data || {};
        const bCounts = bJson.counts || {};
        
        setBookmarkCounts(bCounts);

        if (append) {
          setBookmarks(prev => {
            const next = { ...prev };
            Object.keys(bData).forEach(key => {
              next[key] = [...(next[key] || []), ...(bData[key] || [])];
            });
            return next;
          });
        } else {
          setBookmarks(bData);
        }
        
        // Simple check if we got any data
        const totalFetched = Object.values(bData).reduce((acc: number, val: any) => acc + (val?.length || 0), 0);
        setHasMoreBookmarks(totalFetched === LIMIT);
      }
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async (offset: number, append = false) => {
    try {
      const token = localStorage.getItem('token');
      const hRes = await fetch(`${apiUrl}/users/history?limit=${LIMIT}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        if (append) {
          setHistory(prev => [...prev, ...(hData || [])]);
        } else {
          setHistory(hData || []);
        }
        setHasMoreHistory((hData?.length || 0) === LIMIT);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchProfile();
    fetchBookmarks(0);
    fetchHistory(0);
  }, [apiUrl]);

  const handleLoadMoreHistory = () => {
    const nextOffset = historyOffset + LIMIT;
    setHistoryOffset(nextOffset);
    fetchHistory(nextOffset, true);
  };

  const handleLoadMoreBookmarks = () => {
    const nextOffset = bookmarksOffset + LIMIT;
    setBookmarksOffset(nextOffset);
    fetchBookmarks(nextOffset, true);
  };

  const handleSaveNickname = async () => {
    setIsSaving(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: nickname })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Помилка оновлення профілю");
        return;
      }

      const data = await response.json();
      setNickname(data.user.username);

      // Update local storage user info
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.username = data.user.username;
        localStorage.setItem('user', JSON.stringify(user));
        // Force refresh header (Optional: could also use a Context/Redux)
        window.dispatchEvent(new Event("storage"));
      }

      setIsEditingNickname(false);
    } catch (err) {
      setError("Помилка з'єднання");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      // 1. Upload to S3
      const uploadRes = await fetch(`${apiUrl}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Upload failed');
      }
      const uploadData = await uploadRes.json();
      const newAvatarUrl = uploadData.avatar_url;

      // 2. Update DB
      const updateRes = await fetch(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: nickname, avatar_url: newAvatarUrl })
      });

      if (!updateRes.ok) throw new Error('Update DB failed');

      // Add timestamp to force browser refresh
      const cacheBustedUrl = `${newAvatarUrl}?t=${Date.now()}`;
      setAvatar(cacheBustedUrl);

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.avatar_url = newAvatarUrl; // Save clean URL to storage
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event("storage"));
      }

    } catch (err: any) {
      console.error(err);
      setError("Помилка завантаження фото: " + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event("storage"));
        window.location.href = '/';
      } else {
        setError("Помилка видалення акаунту");
      }
    } catch (e) {
      console.error(e);
      setError("Помилка з'єднання при видаленні");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground/30"
              }`}
          />
        ))}
      </div>
    );
  };

  const categoryLabels: { [key: string]: string } = {
    reading: "Читаю",
    completed: "Прочитано",
    favorite: "Улюблене",
    planned: "Заплановано",
    on_hold: "Відкладено",
    dropped: "Покинуто",
  };

  const currentBookmarks =
    (bookmarks && bookmarks[bookmarkCategory]) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <h1 className="text-3xl font-semibold mb-8 flex items-center gap-3">
          Особистий кабінет
          <LeafDivider className="h-4 w-auto max-w-[120px] text-primary/30" />
        </h1>

        {/* Profile Settings Section */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">
            Налаштування
          </h2>

          <div className="grid md:grid-cols-[auto_1fr] gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-secondary border-2 border-border">
                <ImageWithFallback
                  src={avatar || "/no-avatar.jpg"}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-6 w-6 text-white" />
                <span className="sr-only">Змінити фото</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center mt-2 cursor-pointer hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                Змінити фото
              </p>
            </div>

            {/* Nickname Edit */}
            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="nickname"
                  className="text-sm font-medium mb-2 block"
                >
                  Нікнейм
                </Label>
                <div className="flex gap-3 items-start">
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) =>
                      setNickname(e.target.value)
                    }
                    disabled={!isEditingNickname}
                    className="max-w-md bg-secondary border-border disabled:opacity-100 disabled:cursor-default"
                  />
                  {isEditingNickname ? (
                    <Button
                      onClick={handleSaveNickname}
                      disabled={isSaving}
                      className="bg-[#aeba68] hover:bg-[#aeba68]/90 text-[#0a0a0a]"
                    >
                      {isSaving ? "Збереження..." : "Зберегти"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setIsEditingNickname(true)}
                      variant="outline"
                      className="border-border"
                    >
                      Редагувати
                    </Button>
                  )}
                </div>
                {error && <p className="text-destructive text-sm mt-2">{error}</p>}

                <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <Label className="text-sm font-medium mb-1 block text-muted-foreground">Email</Label>
                    <p className="text-sm">{email || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1 block text-muted-foreground">Роль</Label>
                    <p className="text-sm capitalize">{role || "reader"}</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-border/50">
                <Label className="text-sm font-medium mb-3 block text-muted-foreground"></Label>
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(true)}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Видалити акаунт
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-12 p-0">
            <TabsTrigger
              value="bookmarks"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              Закладки
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              Історія
            </TabsTrigger>
          </TabsList>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="mt-6">
            <div className="grid lg:grid-cols-[220px_1fr] gap-6">
              {/* Category Sidebar */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
                  Категорії
                </h3>
                <nav className="space-y-1">
                  {Object.keys(categoryLabels).map(
                    (category) => (
                      <button
                        key={category}
                        onClick={() =>
                          setBookmarkCategory(category)
                        }
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${bookmarkCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                          }`}
                      >
                        {categoryLabels[category]}
                        <span className="ml-2 text-xs opacity-70">
                          ({bookmarkCounts[category] || 0})
                        </span>
                      </button>
                    ),
                  )}
                </nav>
              </div>

              {/* Bookmarks List */}
              <div>
                {/* Sort Control */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    {categoryLabels[bookmarkCategory]}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Сортувати за:
                    </Label>
                    <Select
                      value={sortBy}
                      onValueChange={setSortBy}
                    >
                      <SelectTrigger className="w-[180px] bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="date-added">
                          Датою додавання
                        </SelectItem>
                        <SelectItem value="alphabet">
                          Алфавітом
                        </SelectItem>
                        <SelectItem value="progress">
                          Прогресом
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* List View */}
                <div className="space-y-3">
                  {currentBookmarks.length > 0 ? (
                    currentBookmarks.map((manga, idx) => (
                      <div key={manga.id}>
                        <Link
                          to={`/manga/${manga.id}`}
                          className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                        >
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-secondary">
                            <ImageWithFallback
                              src={manga.coverImage}
                              alt={manga.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                {manga.title}
                              </h4>
                              <div className="flex items-center gap-2 mb-2">
                                {renderStars(manga.rating)}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Прочитано:{" "}
                                {manga.lastReadChapter} /{" "}
                                {manga.totalChapters}
                              </span>
                              <div className="flex-1 max-w-xs bg-secondary rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-primary h-full transition-all"
                                  style={{
                                    width: `${(manga.lastReadChapter / manga.totalChapters) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </Link>

                        {/* Leaf divider */}
                        {idx < currentBookmarks.length - 1 && (
                          <div className="flex justify-center my-3">
                            <LeafDivider className="h-3 w-auto text-primary/20" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <div className="mb-4 text-muted-foreground">У цій категорії поки порожньо</div>
                      <Link to="/catalog">
                        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                          Знайти щось цікаве
                        </Button>
                      </Link>
                    </div>
                  )}

                  {hasMoreBookmarks && currentBookmarks.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleLoadMoreBookmarks}
                        className="text-primary hover:bg-primary/10"
                      >
                        Показати ще закладок
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-lg">
                  Нещодавно прочитано
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Показано останній прочитаний розділ для кожної манґи
                </p>
              </div>

              <div className="divide-y divide-border">
                {history && history.length > 0 ? (
                  history.map((entry, idx) => (
                  <div key={entry.id}>
                    <Link
                      to={`/read/${entry.mangaId}/${entry.chapterNumber}`}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-secondary">
                        <ImageWithFallback
                          src={entry.coverImage}
                          alt={entry.mangaTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 group-hover:text-primary transition-colors truncate">
                          {entry.mangaTitle}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Розділ {entry.chapterNumber}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {entry.timeAgo}
                      </div>
                    </Link>

                    {/* Leaf divider */}
                    {idx < history.length - 1 && (
                      <div className="flex justify-center pb-1">
                        <LeafDivider className="h-3 w-auto text-primary/50" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">Ви ще нічого не читали</div>
                  <Link to="/catalog">
                    <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                      Перейти до каталогу
                    </Button>
                  </Link>
                </div>
              )}

              {hasMoreHistory && history.length > 0 && (
                <div className="p-4 flex justify-center border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLoadMoreHistory}
                    className="text-primary hover:bg-primary/10"
                  >
                    Завантажити давнішу історію
                  </Button>
                </div>
              )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Warning Modal */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
      >
        <DialogContent className="sm:max-w-[500px] bg-card border-destructive">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">
                Видалення акаунту
              </DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed pt-2">
              Ваші завантажені розділи залишаться в системі.
              Видаліть їх вручну перед видаленням акаунту, якщо
              це необхідно.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
            >
              Підтвердити видалення
            </Button>
          </DialogFooter>

          {/* Decorative leaf motifs */}
          <div className="absolute bottom-4 right-4 opacity-10">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <path
                d="M8 36C8 36 20 28 28 12C28 12 36 20 28 36C20 36 8 36 8 36Z"
                fill="#59631f"
              />
            </svg>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}