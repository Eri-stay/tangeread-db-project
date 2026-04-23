import { useState } from 'react';
import { BarChart3, Users, Star, MessageSquare, Heart, Leaf } from 'lucide-react';
import { AuthorLayout } from '../components/AuthorLayout';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Project {
  id: string;
  title: string;
}

interface ChapterStats {
  chapter: string;
  publishDate: string;
  views: number;
  comments: number;
  isTopPerformer?: boolean;
}

const mockProjects: Project[] = [
  { id: '1', title: 'Безсмертний Культиватор' },
  { id: '2', title: 'Тінь та Кістка' },
  { id: '3', title: 'Легенда про Вічного Воїна' },
];

const viewsOverTimeData = [
  { day: 'Пн', views: 245 },
  { day: 'Вт', views: 312 },
  { day: 'Ср', views: 428 },
  { day: 'Чт', views: 389 },
  { day: 'Пт', views: 567 },
  { day: 'Сб', views: 823 },
  { day: 'Нд', views: 912 },
];

const ratingDistributionData = [
  { rating: '1★', count: 12 },
  { rating: '2★', count: 8 },
  { rating: '3★', count: 15 },
  { rating: '4★', count: 23 },
  { rating: '5★', count: 34 },
  { rating: '6★', count: 56 },
  { rating: '7★', count: 89 },
  { rating: '8★', count: 145 },
  { rating: '9★', count: 234 },
  { rating: '10★', count: 412 },
];

const chapterPerformanceData: ChapterStats[] = [
  { chapter: 'Розділ 45', publishDate: '20 берез. 2026', views: 1823, comments: 47, isTopPerformer: true },
  { chapter: 'Розділ 44', publishDate: '13 берез. 2026', views: 1654, comments: 38 },
  { chapter: 'Розділ 43', publishDate: '06 берез. 2026', views: 1543, comments: 42 },
  { chapter: 'Розділ 42', publishDate: '27 лют. 2026', views: 1489, comments: 35 },
  { chapter: 'Розділ 41', publishDate: '20 лют. 2026', views: 1378, comments: 31 },
  { chapter: 'Розділ 40', publishDate: '13 лют. 2026', views: 1267, comments: 29 },
];

export function AuthorAnalyticsPage() {
  const [selectedProject, setSelectedProject] = useState('1');

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Статистика</h1>
              <p className="text-muted-foreground">Аналітика та метрики вашого контенту</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Project Selector */}
        <div className="mb-8">
          <Label htmlFor="project-select" className="text-sm mb-2 block">
            Оберіть проєкт
          </Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger id="project-select" className="w-full max-w-md bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {mockProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Readers */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-sm text-muted-foreground">Загальна кількість читачів</h3>
            </div>
            <p className="text-3xl font-semibold">3,456</p>
            <p className="text-xs text-muted-foreground mt-2">Унікальні користувачі</p>
          </div>

          {/* Average Rating */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-sm text-muted-foreground">Середній рейтинг</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold">8.7</p>
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">З 1028 оцінок</p>
          </div>

          {/* Total Comments */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-sm text-muted-foreground">Всього коментарів</h3>
            </div>
            <p className="text-3xl font-semibold">1,234</p>
            <p className="text-xs text-muted-foreground mt-2">+87 цього тижня</p>
          </div>

          {/* Bookmarks */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Heart className="h-5 w-5 text-pink-400" />
              </div>
              <h3 className="text-sm text-muted-foreground">Додано в Улюблене</h3>
            </div>
            <p className="text-3xl font-semibold">892</p>
            <p className="text-xs text-muted-foreground mt-2">+23 цього місяця</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views Over Time */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Перегляди за часом
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={viewsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" style={{ fontSize: '12px' }} />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#59631f"
                  strokeWidth={3}
                  dot={{ fill: '#59631f', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-4">Останні 7 днів</p>
          </div>

          {/* Rating Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              Розподіл оцінок
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ratingDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="rating" stroke="#888" style={{ fontSize: '11px' }} />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#aeba68" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-4">Кількість користувачів за оцінками</p>
          </div>
        </div>

        {/* Chapter Performance Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h2 className="text-lg font-semibold">Продуктивність розділів</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/20">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Розділ
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Дата публікації
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Перегляди
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Кількість коментарів
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chapterPerformanceData.map((chapter, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-secondary/20 transition-colors ${
                      chapter.isTopPerformer ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {chapter.isTopPerformer && (
                          <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className="font-medium">{chapter.chapter}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{chapter.publishDate}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium">
                        {chapter.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium">
                        {chapter.comments}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="flex justify-end gap-2 opacity-20 mt-8">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 22C5 22 12 17 16 8C16 8 21 13 16 22C12 22 5 22 5 22Z" fill="#59631f" />
          </svg>
        </div>
      </div>
    </AuthorLayout>
  );
}
