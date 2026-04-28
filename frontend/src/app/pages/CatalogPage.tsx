import { useState } from 'react';
import { Star, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router';
import { mockMangaList, tags } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type TagState = 'neutral' | 'include' | 'exclude';

interface TagFilters {
  [key: string]: TagState;
}

export function CatalogPage() {
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('AND');
  const [tagFilters, setTagFilters] = useState<TagFilters>({});
  const [sortBy, setSortBy] = useState('best-match');

  // Status filters
  const [statusOngoing, setStatusOngoing] = useState(false);
  const [statusCompleted, setStatusCompleted] = useState(false);
  const [statusPaused, setStatusPaused] = useState(false);

  // Type filters
  const [typeManga, setTypeManga] = useState(false);
  const [typeManhwa, setTypeManhwa] = useState(false);
  const [typeManhua, setTypeManhua] = useState(false);

  // Year filter
  const [yearFilter, setYearFilter] = useState('all');

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

  const resetFilters = () => {
    setTagFilters({});
    setStatusOngoing(false);
    setStatusCompleted(false);
    setStatusPaused(false);
    setTypeManga(false);
    setTypeManhwa(false);
    setTypeManhua(false);
    setYearFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          Розширений пошук та Каталог
          <div className="h-px flex-1 bg-border/30 max-w-[200px]" />
        </h1>

        {/* Collapsible Filter Panel */}
        <div className="mb-6 bg-card border border-border rounded-lg overflow-hidden">
          {/* Filter Header */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <span className="font-semibold flex items-center gap-2">
              Фільтри
              {filtersExpanded ? (
                <ChevronUp className="h-5 w-5 text-primary" />
              ) : (
                <ChevronDown className="h-5 w-5 text-primary" />
              )}
            </span>
            <span className="text-sm text-muted-foreground">
              {filtersExpanded ? 'Приховати' : 'Розгорнути'}
            </span>
          </button>

          {/* Filter Content */}
          {filtersExpanded && (
            <div className="p-6 border-t border-border space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Status */}
                <div>
                  <Label className="text-sm mb-3 block font-semibold">Статус</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-ongoing"
                        checked={statusOngoing}
                        onCheckedChange={(checked) => setStatusOngoing(checked as boolean)}
                      />
                      <label htmlFor="status-ongoing" className="text-sm cursor-pointer">
                        Триває
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-completed"
                        checked={statusCompleted}
                        onCheckedChange={(checked) => setStatusCompleted(checked as boolean)}
                      />
                      <label htmlFor="status-completed" className="text-sm cursor-pointer">
                        Завершено
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-paused"
                        checked={statusPaused}
                        onCheckedChange={(checked) => setStatusPaused(checked as boolean)}
                      />
                      <label htmlFor="status-paused" className="text-sm cursor-pointer">
                        Призупинено
                      </label>
                    </div>
                  </div>
                </div>

                {/* Year */}
                <div>
                  <Label className="text-sm mb-3 block font-semibold">Рік випуску</Label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Оберіть рік" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">Усі роки</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="older">До 2020</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div>
                  <Label className="text-sm mb-3 block font-semibold">Тип</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-manga"
                        checked={typeManga}
                        onCheckedChange={(checked) => setTypeManga(checked as boolean)}
                      />
                      <label htmlFor="type-manga" className="text-sm cursor-pointer">
                        Манга
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-manhwa"
                        checked={typeManhwa}
                        onCheckedChange={(checked) => setTypeManhwa(checked as boolean)}
                      />
                      <label htmlFor="type-manhwa" className="text-sm cursor-pointer">
                        Манхва
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-manhua"
                        checked={typeManhua}
                        onCheckedChange={(checked) => setTypeManhua(checked as boolean)}
                      />
                      <label htmlFor="type-manhua" className="text-sm cursor-pointer">
                        Маньхуа
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Genres */}
              <div className="pt-4 border-t border-border/50 relative">
                <div className="absolute -right-2 top-2 opacity-10">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M8 36C8 36 20 28 28 12C28 12 36 20 28 36C20 36 8 36 8 36Z" fill="#59631f" />
                  </svg>
                </div>
                <Label className="text-sm mb-3 block font-semibold">Жанри</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.genres.map(renderTag)}
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-between w-full pt-4">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-border"
                >
                  Скинути всі фільтри
                </Button>

                {/* Right: AND/OR Toggle (Segmented Control) */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-semibold whitespace-nowrap">Логіка:</Label>
                  <div className="inline-flex rounded-md overflow-hidden border border-primary/30">
                    <button
                      onClick={() => setFilterMode('AND')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${filterMode === 'AND'
                          ? 'bg-[#aeba68] text-[#0a0a0a]'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                      AND
                    </button>
                    <button
                      onClick={() => setFilterMode('OR')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-l border-primary/30 ${filterMode === 'OR'
                          ? 'bg-[#aeba68] text-[#0a0a0a]'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                      OR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="mb-6 bg-card border border-border rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Left: Sorting */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-semibold whitespace-nowrap">Сортування:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="best-match">Найкращий збіг</SelectItem>
                  <SelectItem value="popularity">За популярністю</SelectItem>
                  <SelectItem value="rating">За рейтингом</SelectItem>
                  <SelectItem value="updated">За датою оновлення</SelectItem>
                  <SelectItem value="alphabet">За алфавітом</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* Search Button */}
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              Почати пошук
            </Button>
          </div>

          {/* Leaf motifs spacing after button */}
          <div className="flex justify-end mt-3 gap-2 opacity-20">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 14C3 14 8 11 11 5C11 5 14 8 11 14C8 14 3 14 3 14Z" fill="#59631f" />
            </svg>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Знайдено результатів: {mockMangaList.length}
          </div>

          {mockMangaList.map((manga) => (
            <Link
              key={manga.id}
              to={`/manga/${manga.id}`}
              className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
            >
              {/* Cover Image */}
              <div className="flex-shrink-0 w-24 h-32 rounded overflow-hidden bg-secondary">
                <ImageWithFallback
                  src={manga.coverImage}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {manga.title}
                </h3>

                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>{manga.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{manga.chapters} розділів</span>
                  <span>•</span>
                  <span>{manga.author}</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {manga.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {manga.genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
