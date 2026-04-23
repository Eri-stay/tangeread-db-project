import { Plus, Eye, Edit, Trash2, Upload } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { AuthorLayout } from '../components/AuthorLayout';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface Project {
  id: string;
  title: string;
  cover: string;
  status: string;
  chapters: number;
  views: number;
  lastUpdated: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Безсмертний Культиватор',
    cover: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300',
    status: 'Триває',
    chapters: 45,
    views: 125430,
    lastUpdated: '2 дні тому',
  },
  {
    id: '2',
    title: 'Тінь та Кістка',
    cover: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=300',
    status: 'Триває',
    chapters: 12,
    views: 48920,
    lastUpdated: '1 тиждень тому',
  },
];

export function AuthorProjectsPage() {
  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Мої проєкти</h1>
            <p className="text-muted-foreground">
              Керуйте вашими публікаціями
            </p>
          </div>
          <Link to="/author/manga/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Створити проєкт
            </Button>
          </Link>
        </div>

        <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mb-8" />

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <div
              key={project.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all group"
            >
              {/* Cover */}
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                <ImageWithFallback
                  src={project.cover}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold mb-2 truncate">{project.title}</h3>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{project.chapters} розділів</span>
                  <span>{project.views.toLocaleString()} переглядів</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary">{project.status}</span>
                  <span>{project.lastUpdated}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/manga/${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      Переглянути
                    </Button>
                  </Link>
                  <Link to={`/author/manga/${project.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthorLayout>
  );
}