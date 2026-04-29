import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Minus, Loader2, Image as ImageIcon } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AuthorLayout } from '../components/AuthorLayout';

interface Tag {
  id: number;
  name_uk: string;
  name_en: string;
}

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function MangaEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!id;

  const [titleUA, setTitleUA] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [format, setFormat] = useState('manga');
  const [coverURL, setCoverURL] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [userTeamId, setUserTeamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch Tags
        const tagsRes = await fetch(`${apiUrl}/manga/tags/all`);
        if (tagsRes.ok) {
          const tagsJson = await tagsRes.json();
          setTags(tagsJson.data || []);
        }

        // Fetch User Team
        if (token) {
          const teamRes = await fetch(`${apiUrl}/users/team`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (teamRes.ok) {
            const teamJson = await teamRes.json();
            if (teamJson.data) {
              setUserTeamId(teamJson.data.TeamID);
            }
          }
        }

        // If Edit Mode, fetch Manga Data
        if (isEditMode) {
          const mangaRes = await fetch(`${apiUrl}/manga/${id}`);
          if (mangaRes.ok) {
            const mangaJson = await mangaRes.json();
            const m = mangaJson.data;
            setTitleUA(m.TitleUa);
            setOriginalTitle(m.TitleOrig || '');
            setDescription(m.Description || '');
            setYear(m.ReleaseYear ? String(m.ReleaseYear) : '');
            setStatus(m.Status);
            setFormat(m.Format);
            setCoverURL(m.CoverURL || '');
            setSelectedTagIds(m.Tags?.map((t: any) => t.ID) || []);
          }
        }
      } catch (err) {
        setError('Помилка при завантаженні даних');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('cover', file);

      const response = await fetch(`${apiUrl}/author/manga/cover/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCoverURL(data.url);
      } else {
        const errJson = await response.json();
        setError(errJson.error || 'Помилка при завантаженні файлу');
      }
    } catch (err) {
      setError('Помилка мережі при завантаженні файлу');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Необхідна авторизація');

      const payload = {
        title_ua: titleUA,
        title_orig: originalTitle,
        description: description,
        cover_url: coverURL,
        status: status,
        format: format,
        release_year: parseInt(year),
        team_id: userTeamId,
        tag_ids: selectedTagIds,
      };

      const response = await fetch(`${apiUrl}/author/manga${isEditMode ? `/${id}` : ''}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/author/projects');
      } else {
        const errorJson = await response.json();
        setError(errorJson.error || 'Помилка при збереженні');
      }
    } catch (err: any) {
      setError(err.message || 'Сталася помилка');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">
            {isEditMode ? 'Редагування манги' : 'Створення манги'}
          </h1>
          <p className="text-muted-foreground">
            Заповніть всі необхідні поля для публікації вашого проєкту
          </p>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-8">
          <form onSubmit={handleSaveProject} className="space-y-8">
            {/* Title UA */}
            <div className="space-y-2">
              <Label htmlFor="title-ua" className="text-base font-semibold">
                Назва (UA) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title-ua"
                placeholder="Українська назва манги"
                value={titleUA}
                onChange={(e) => setTitleUA(e.target.value)}
                className="bg-secondary border-border text-lg h-12"
                required
              />
            </div>

            {/* Original Title */}
            <div className="space-y-2">
              <Label htmlFor="original-title" className="text-base font-semibold">
                Оригінальна назва
              </Label>
              <Input
                id="original-title"
                placeholder="原作タイトル / Original Title"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Опис <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Детальний опис сюжету..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border min-h-32"
                required
              />
            </div>

            {/* Cover Upload */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Обкладинка <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div 
                  className="w-48 aspect-[3/4] bg-secondary rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverURL ? (
                    <img src={coverURL} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Натисніть для завантаження</p>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="text-white h-8 w-8" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cover-url" className="text-sm font-medium text-muted-foreground">Або вставте пряме посилання</Label>
                    <Input
                      id="cover-url"
                      placeholder="https://example.com/cover.jpg"
                      value={coverURL}
                      onChange={(e) => setCoverURL(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Підтримувані формати: JPG, PNG, WebP. Максимальний розмір: 5MB.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Обрати файл
                  </Button>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Year, Status, Format Row */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-base font-semibold">Рік випуску</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-base font-semibold">Статус</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="ongoing">Триває</SelectItem>
                    <SelectItem value="completed">Завершено</SelectItem>
                    <SelectItem value="hiatus">Пауза</SelectItem>
                    <SelectItem value="cancelled">Скасовано</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="text-base font-semibold">Формат</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="manga">Манґа</SelectItem>
                    <SelectItem value="manhwa">Манхва</SelectItem>
                    <SelectItem value="manhua">Маньхуа</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4 pt-6 border-t border-border">
              <Label className="text-base font-semibold">Жанри та теги</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {selectedTagIds.includes(tag.id) && <Plus className="h-3 w-3 mr-1 inline" />}
                    {tag.name_uk}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 border-t border-border flex items-center justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-[#59631f] hover:bg-[#59631f]/90 px-8 h-11 text-base gap-2"
              >
                {(isSubmitting || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditMode ? 'Зберегти зміни' : 'Створити проєкт'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthorLayout>
  );
}
