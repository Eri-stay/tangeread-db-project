import { useState } from 'react';
import { Upload, Plus, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AuthorLayout } from '../components/AuthorLayout';
import { tags } from '../data/mockData';

type TagState = 'neutral' | 'include' | 'exclude';

interface TagFilters {
  [key: string]: TagState;
}

export function MangaEditorPage() {
  const [titleUA, setTitleUA] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [tagFilters, setTagFilters] = useState<TagFilters>({});

  const toggleTag = (tag: string) => {
    setTagFilters(prev => {
      const currentState = prev[tag] || 'neutral';
      let newState: TagState;
      
      if (currentState === 'neutral') newState = 'include';
      else if (currentState === 'include') newState = 'exclude';
      else newState = 'neutral';

      return {
        ...prev,
        [tag]: newState
      };
    });
  };

  const getTagClassName = (tag: string) => {
    const state = tagFilters[tag] || 'neutral';
    const baseClass = "px-3 py-1.5 rounded border transition-all text-sm cursor-pointer inline-flex items-center gap-1";
    
    if (state === 'include') {
      return `${baseClass} bg-primary text-primary-foreground border-primary`;
    } else if (state === 'exclude') {
      return `${baseClass} bg-destructive text-destructive-foreground border-destructive`;
    }
    return `${baseClass} bg-secondary text-foreground border-border hover:border-primary/50`;
  };

  const renderTag = (tag: string) => {
    const state = tagFilters[tag] || 'neutral';
    return (
      <button
        key={tag}
        onClick={() => toggleTag(tag)}
        className={getTagClassName(tag)}
      >
        {state === 'include' && <Plus className="h-3 w-3" />}
        {state === 'exclude' && <Minus className="h-3 w-3" />}
        {tag}
      </button>
    );
  };

  const handleSaveProject = () => {
    // Save logic here
    console.log('Saving project...');
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Створення манги</h1>
          <p className="text-muted-foreground">
            Заповніть всі необхідні поля для публікації вашого проєкту
          </p>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <form className="space-y-8">
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
                placeholder="原作タイトル / 原版标题 / Original Title"
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
                placeholder="Детальний опис сюжету, персонажів та особливостей манги..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border min-h-32"
                required
              />
              <p className="text-xs text-muted-foreground">
                Мінімум 100 символів
              </p>
            </div>

            {/* Cover Upload */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Обкладинка <span className="text-destructive">*</span>
              </Label>
              <div className="relative border-2 border-dashed rounded-lg overflow-hidden transition-colors hover:border-primary/50"
                   style={{ borderColor: coverImage ? '#59631f' : undefined }}>
                {/* Leaf pattern decorations */}
                <div className="absolute top-4 left-4 opacity-10 pointer-events-none">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M8 36C8 36 20 28 28 12C28 12 36 20 28 36C20 36 8 36 8 36Z" fill="#59631f" />
                  </svg>
                </div>
                <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none">
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                    <path d="M10 45C10 45 25 35 35 15C35 15 45 25 35 45C25 45 10 45 10 45Z" fill="#59631f" />
                  </svg>
                </div>

                <label htmlFor="cover-upload" className="cursor-pointer block p-12 text-center">
                  {coverImage ? (
                    <div className="space-y-2">
                      <div className="text-primary font-medium">{coverImage.name}</div>
                      <p className="text-sm text-muted-foreground">Клікніть для зміни файлу</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-base font-medium">Перетягніть зображення або клікніть для вибору</p>
                        <p className="text-sm text-muted-foreground mt-1">PNG, JPG до 5MB. Рекомендований розмір: 800x1200px</p>
                      </div>
                    </div>
                  )}
                </label>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Year, Status, Type Row */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Year */}
              <div className="space-y-2">
                <Label htmlFor="year" className="text-base font-semibold">
                  Рік випуску <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-secondary border-border"
                  min="1900"
                  max="2100"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-base font-semibold">
                  Статус <span className="text-destructive">*</span>
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Оберіть статус" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="ongoing">Триває</SelectItem>
                    <SelectItem value="completed">Завершено</SelectItem>
                    <SelectItem value="paused">Призупинено</SelectItem>
                    <SelectItem value="dropped">Покинуто</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags and Genres */}
            <div className="space-y-6 pt-6 border-t border-border">
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  Теги та Жанри <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Натисніть один раз щоб додати (+), двічі щоб скинути
                </p>
              </div>

              {/* Genres */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Жанри</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.genres.map(renderTag)}
                </div>
              </div>

              {/* Themes */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Теми</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.themes.map(renderTag)}
                </div>
              </div>

              {/* Formats */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Формат</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.formats.map(renderTag)}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 border-t border-border flex items-center justify-between">
              <div className="flex gap-2 opacity-20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 22C5 22 12 17 16 8C16 8 21 13 16 22C12 22 5 22 5 22Z" fill="#59631f" />
                </svg>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
                </svg>
              </div>
              <Button
                type="button"
                onClick={handleSaveProject}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-11 text-base"
              >
                Зберегти проєкт
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthorLayout>
  );
}
