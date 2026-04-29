import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronDown, Search as SearchIcon, Loader2, X, Check, MinusCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';

type TagState = 'neutral' | 'include' | 'exclude';

interface TagFilters {
  [key: number]: TagState;
}

interface Tag {
  id: number;
  name_uk: string;
  name_en: string;
}

interface Manga {
  id: number;
  title_ua: string;
  title_orig?: string;
  description?: string;
  cover_url?: string;
  avg_rating: number;
  chapters_count: number;
  tags?: { name_uk: string }[];
}

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

const MANGA_STATUSES = [
  { value: 'ongoing', label: 'Триває' },
  { value: 'completed', label: 'Завершено' },
  { value: 'hiatus', label: 'Перерва' },
  { value: 'cancelled', label: 'Скасовано' },
];

const MANGA_FORMATS = [
  { value: 'manga', label: 'Манґа' },
  { value: 'manhwa', label: 'Манхва' },
  { value: 'manhua', label: 'Маньхуа' },
  { value: 'comic', label: 'Комікс' },
];

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Advanced filters state
  const [tagFilters, setTagFilters] = useState<TagFilters>({});
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [formatFilters, setFormatFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  const fetchTags = async () => {
    try {
      const response = await fetch(`${apiUrl}/manga/tags/all`);
      const result = await response.json();
      if (result.data) setAllTags(result.data);
    } catch (e) {
      console.error('Failed to fetch tags');
    }
  };

  const fetchMangas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      
      if (sortBy && sortBy !== 'newest') params.append('sort', sortBy);
      
      statusFilters.forEach(s => params.append('status', s));
      formatFilters.forEach(f => params.append('format', f));
      
      Object.entries(tagFilters).forEach(([id, state]) => {
        if (state === 'include') params.append('tags', id);
        if (state === 'exclude') params.append('exclude', id);
      });
      
      // Update URL search params
      setSearchParams(params, { replace: true });
      
      params.append('limit', '40');
      
      const response = await fetch(`${apiUrl}/manga?${params.toString()}`);
      const result = await response.json();
      if (result.data) {
        setMangas(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch manga:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, statusFilters, formatFilters, tagFilters, setSearchParams]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchMangas();
  }, [fetchMangas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMangas();
  };

  const toggleTag = (tagId: number) => {
    setTagFilters(prev => {
      const current = prev[tagId] || 'neutral';
      const next: TagState = current === 'neutral' ? 'include' : current === 'include' ? 'exclude' : 'neutral';
      
      const updated = { ...prev };
      if (next === 'neutral') {
        delete updated[tagId];
      } else {
        updated[tagId] = next;
      }
      return updated;
    });
  };

  const toggleStatus = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleFormat = (format: string) => {
    setFormatFilters(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const resetFilters = () => {
    setTagFilters({});
    setStatusFilters([]);
    setFormatFilters([]);
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          Каталог
          <div className="h-px flex-1 bg-border/30 max-w-[200px]" />
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук за назвою..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[100px]">
              Пошук
            </Button>
          </form>
        </div>

        {/* Control Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 justify-between bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant={filtersExpanded ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="gap-2 border-border"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
              Фільтри
              {(statusFilters.length > 0 || formatFilters.length > 0 || Object.keys(tagFilters).length > 0) && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {statusFilters.length + formatFilters.length + Object.keys(tagFilters).length}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold whitespace-nowrap hidden sm:inline text-muted-foreground">Сортування:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="newest">Найновіші</SelectItem>
                  <SelectItem value="updated">Останні оновлення</SelectItem>
                  <SelectItem value="popularity">За популярністю</SelectItem>
                  <SelectItem value="rating">За рейтингом</SelectItem>
                  <SelectItem value="alphabet">За алфавітом</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground font-medium">
            Знайдено: <span className="text-foreground">{mangas.length}</span>
          </div>
        </div>

        {/* Filter Panel */}
        {filtersExpanded && (
          <div className="mb-8 p-6 bg-card border border-border rounded-lg shadow-md animate-in slide-in-from-top-2 duration-200">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               {/* Status Filters */}
               <div>
                 <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                   Статус
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {MANGA_STATUSES.map(s => (
                     <button
                        key={s.value}
                        onClick={() => toggleStatus(s.value)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          statusFilters.includes(s.value) 
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                            : 'bg-secondary/30 text-muted-foreground border-border hover:border-primary/50'
                        }`}
                     >
                       {s.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Format Filters */}
               <div>
                 <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                   Тип
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {MANGA_FORMATS.map(f => (
                     <button
                        key={f.value}
                        onClick={() => toggleFormat(f.value)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          formatFilters.includes(f.value) 
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                            : 'bg-secondary/30 text-muted-foreground border-border hover:border-primary/50'
                        }`}
                     >
                       {f.label}
                     </button>
                   ))}
                 </div>
               </div>
             </div>

             {/* Tags Section */}
             <div className="mb-8">
               <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                 Жанри та теги
                 <span className="text-[10px] font-normal text-muted-foreground ml-2">(Клікніть для включення, двічі — для виключення)</span>
               </h4>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                 {allTags.map(tag => {
                   const state = tagFilters[tag.id] || 'neutral';
                   return (
                     <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded border text-[11px] transition-all group ${
                          state === 'include' 
                            ? 'bg-green-500/10 border-green-500/50 text-green-600' 
                            : state === 'exclude'
                            ? 'bg-destructive/10 border-destructive/50 text-destructive'
                            : 'bg-secondary/20 border-border text-muted-foreground hover:border-primary/40'
                        }`}
                     >
                       <span className="truncate pr-1">{tag.name_uk}</span>
                       <div className="shrink-0 opacity-40 group-hover:opacity-100">
                         {state === 'include' ? <Check className="h-3 w-3" /> : state === 'exclude' ? <MinusCircle className="h-3 w-3" /> : <div className="w-3" />}
                       </div>
                     </button>
                   );
                 })}
               </div>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-destructive">
                  Скинути все
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFiltersExpanded(false)}>Закрити</Button>
                  <Button size="sm" onClick={() => { fetchMangas(); setFiltersExpanded(false); }}>Застосувати</Button>
                </div>
             </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p className="animate-pulse">Оновлення списку...</p>
          </div>
        ) : mangas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mangas.map((manga) => (
              <Link
                key={manga.id}
                to={`/manga/${manga.id}`}
                className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                {/* Cover Image */}
                <div className="flex-shrink-0 w-24 h-32 rounded overflow-hidden bg-secondary shadow-sm">
                  <ImageWithFallback
                    src={manga.cover_url || ''}
                    alt={manga.title_ua}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                    {manga.title_ua}
                  </h3>
                  {manga.title_orig && (
                    <p className="text-xs text-muted-foreground truncate mb-2 opacity-70">
                      {manga.title_orig}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground">{manga.avg_rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <span>•</span>
                    <span className="font-medium">{manga.chapters_count} розд.</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {manga.description || 'Опис відсутній'}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {manga.tags?.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border group-hover:border-primary/20 group-hover:text-primary transition-colors"
                      >
                        {tag.name_uk}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-xl shadow-inner">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <SearchIcon className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Нічого не знайдено</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              Спробуйте змінити фільтри або запит пошуку, щоб знайти те, що вам потрібно.
            </p>
            <Button variant="outline" onClick={resetFilters} className="border-primary/50 text-primary hover:bg-primary/10">
              Скинути всі фільтри
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
