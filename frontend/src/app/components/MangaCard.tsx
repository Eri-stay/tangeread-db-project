import { Star } from 'lucide-react';
import { Link } from 'react-router';
import type { Manga } from '../data/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link 
      to={`/manga/${manga.id}`}
      className="group block min-w-[140px] sm:min-w-[160px] md:min-w-[180px]"
    >
      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
        <div className="aspect-[3/4] relative overflow-hidden bg-secondary">
          <ImageWithFallback
            src={manga.coverImage}
            alt={manga.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {manga.title}
          </h3>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span>{manga.rating.toFixed(1)}</span>
            <span className="mx-1">•</span>
            <span>{manga.chapters} розд.</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {manga.genres.slice(0, 2).map((genre, idx) => (
              <span 
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
