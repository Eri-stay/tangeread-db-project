import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Upload, Loader2, BookOpen as BookIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { AuthorLayout } from '../components/AuthorLayout';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface Project {
  id: number;
  title_ua: string;
  cover_url: string;
  status: string;
  chapters_count: number;
  updated_at: string;
}

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function AuthorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/author/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const json = await response.json();
          setProjects(json.data || []);
        } else {
          setError('Не вдалося завантажити проєкти');
        }
      } catch (err) {
        console.error('Error fetching author projects:', err);
        setError('Помилка мережі при завантаженні проєктів');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Мої проєкти</h1>
            <p className="text-muted-foreground">Керуйте завантаженою манґою та розділами</p>
          </div>
          <Button asChild className="bg-[#59631f] hover:bg-[#59631f]/90 gap-2">
            <Link to="/author/manga/new">
              <Plus className="h-4 w-4" />
              Додати манґу
            </Link>
          </Button>
        </div>

        <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mb-8" />

        {/* Projects List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
            <p>Завантаження проєктів...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <BookIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">У вас ще немає проєктів</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Ви ще не додали жодної манґи або ваша команда поки не має закріплених проєктів.
            </p>
            <Button asChild variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              <Link to="/author/manga/new">
                Створити перший проєкт
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="bg-card border border-border rounded-lg overflow-hidden flex flex-col group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                {/* Image & Overlay */}
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                  <ImageWithFallback 
                    src={project.cover_url} 
                    alt={project.title_ua}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="secondary" className="flex-1 gap-2">
                        <Link to={`/manga/${project.id}`}>
                          <Eye className="h-4 w-4" />
                          Перегляд
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary" className="flex-1 gap-2">
                        <Link to={`/author/manga/${project.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          Редагувати
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold rounded border border-white/20">
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {project.title_ua}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 mt-auto">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Розділи</p>
                      <p className="font-semibold text-sm">{project.chapters_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Оновлено</p>
                      <p className="font-semibold text-sm truncate">
                        {project.updated_at ? new Date(project.updated_at).toLocaleDateString('uk-UA') : 'Невідомо'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex gap-2">
                    <Button asChild className="flex-1 bg-[#59631f] hover:bg-[#59631f]/90 gap-2">
                      <Link to={`/author/manga/${project.id}/chapter/new`}>
                        <Upload className="h-4 w-4" />
                        Новий розділ
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthorLayout>
  );
}