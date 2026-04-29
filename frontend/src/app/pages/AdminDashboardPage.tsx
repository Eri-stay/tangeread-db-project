import { useState, useEffect } from 'react';
import { Users, BookOpen, Image, AlertTriangle, AlertCircle, PieChart, List, TrendingUp, TrendingDown, Shield, FileWarning, Link as LinkIcon, Database, Play, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface GenreData {
  name: string;
  value: number;
  color: string;
}

interface TeamRanking {
  rank: number;
  teamName: string;
  chaptersPublished: number;
  totalViews: number;
  badge?: 'gold' | 'silver' | 'bronze';
}

interface PlatformStats {
  totalUsers: number;
  totalTeams: number;
  totalManga: number;
  totalChapters: number;
  totalPages: number;
  newUsersThisWeek: number;
  newMangaThisMonth: number;
  usersGrowthPercent: number;
  mangaGrowthPercent: number;
}

interface GenreStat {
  name: string;
  value: number;
}

interface RegistrationStat {
  month: string;
  count: number;
}



const badgeColors = {
  gold: 'from-amber-400 to-yellow-600',
  silver: 'from-gray-300 to-gray-500',
  bronze: 'from-amber-600 to-orange-800',
};

export function AdminDashboardPage() {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [genreStats, setGenreStats] = useState<GenreStat[]>([]);
  const [registrationStats, setRegistrationStats] = useState<RegistrationStat[]>([]);
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const env = (import.meta as any).env;
  const apiUrl = env?.VITE_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [statsRes, genreRes, regRes, teamRes] = await Promise.all([
          fetch(`${apiUrl}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/admin/genre-stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/admin/registration-stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/admin/team-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (statsRes.ok) setPlatformStats(await statsRes.json());
        if (genreRes.ok) setGenreStats(await genreRes.json());
        if (regRes.ok) setRegistrationStats(await regRes.json());
        if (teamRes.ok) setTeamRankings(await teamRes.json());
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiUrl]);

  const genreColors = ['#59631f', '#aeba68', '#8b9456', '#6b7542', '#4a5230', '#a3b060', '#c5d078'];
  const displayGenreData = genreStats.map((g, i) => ({ ...g, color: genreColors[i % genreColors.length] }));
  const displayRegistrationData = registrationStats;
  const displayTeams = teamRankings;

  const handleAdminAction = async (endpoint: string, method: string, setLoader: (v: boolean) => void) => {
    setLoader(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/admin/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Дія не вдалася');

      setMessage({ text: data.message || 'Успішно виконано', type: 'success' });
      if (endpoint === 'seed' && method === 'DELETE') {
        // Maybe reload page or update stats?
        window.location.reload();
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoader(false);
    }
  };

  const totalGenreViews = displayGenreData.reduce((sum, genre) => sum + genre.value, 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">Аналітичний дашборд</h1>
            <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="h-10 w-10 bg-secondary rounded-lg mb-4" />
                <div className="h-8 w-24 bg-secondary rounded mb-2" />
                <div className="h-4 w-32 bg-secondary rounded" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Аналітичний дашборд</h1>

          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
        </div>

        {/* Platform Growth Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#59631f]/20">
                <Users className="h-6 w-6 text-[#59631f]" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded">
                <TrendingUp className="h-3 w-3" />
                {platformStats?.usersGrowthPercent ? `+${platformStats.usersGrowthPercent}%` : '+0%'}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{platformStats?.totalUsers?.toLocaleString() || '-'}</div>
            <div className="text-sm text-muted-foreground">Усього користувачів</div>
            <p className="text-xs text-primary mt-2">+{platformStats?.newUsersThisWeek?.toLocaleString() || 0} цього тижня</p>
          </div>

          {/* Active Teams */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-purple-500/20 inline-block mb-4">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold mb-1">{platformStats?.totalTeams?.toLocaleString() || '-'}</div>
            <div className="text-sm text-muted-foreground">Активні команди</div>
            <p className="text-xs text-muted-foreground mt-2">Затверджені перекладацькі команди</p>
          </div>

          {/* Library Size */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#aeba68]/20 inline-block mb-4">
                <BookOpen className="h-6 w-6 text-[#aeba68]" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded">
                <TrendingDown className="h-3 w-3" />
                {platformStats?.mangaGrowthPercent !== undefined && platformStats.mangaGrowthPercent !== 0
                  ? `${platformStats.mangaGrowthPercent > 0 ? '+' : ''}${platformStats.mangaGrowthPercent}%`
                  : '+0%'}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{platformStats?.totalManga?.toLocaleString() || '-'}</div>
            <div className="text-sm text-muted-foreground">Бібліотека манг</div>
            <p className="text-xs text-primary mt-2">+{platformStats?.newMangaThisMonth?.toLocaleString() || 0} нові цього місяця</p>
          </div>

          {/* Total Pages */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-blue-500/20 inline-block mb-4">
              <Image className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {platformStats ? (platformStats.totalPages >= 1000000
                ? (platformStats.totalPages / 1000000).toFixed(1) + 'M'
                : platformStats.totalPages >= 1000
                  ? (platformStats.totalPages / 1000).toFixed(1) + 'K'
                  : platformStats.totalPages.toLocaleString())
                : '-'}
            </div>
            <div className="text-sm text-muted-foreground">Завантажені сторінки</div>
            <p className="text-xs text-muted-foreground mt-2">Загальна кількість зображень в БД</p>
          </div>
        </div>

        {/* Content Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Genre Popularity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Популярність жанрів</h2>
                <p className="text-sm text-muted-foreground">
                  На основі закладок користувачів
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
                className="gap-2"
              >
                {viewMode === 'chart' ? (
                  <>
                    <List className="h-4 w-4" />
                    Переглянути як список
                  </>
                ) : (
                  <>
                    <PieChart className="h-4 w-4" />
                    Переглянути як графік
                  </>
                )}
              </Button>
            </div>

            {viewMode === 'chart' ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={displayGenreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {displayGenreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [
                        `${value.toLocaleString()} (${((value / totalGenreViews) * 100).toFixed(1)}%)`,
                        'Закладок',
                      ]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {displayGenreData.length > 0 ? (
                  displayGenreData
                    .sort((a, b) => b.value - a.value)
                    .map((genre, index) => {
                      const percentage = ((genre.value / totalGenreViews) * 100).toFixed(1);
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-6 text-sm text-muted-foreground">#{index + 1}</div>
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: genre.color }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{genre.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {genre.value.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: genre.color,
                                }}
                              />
                            </div>
                          </div>
                          <span
                            className="text-xs font-medium px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${genre.color}20`,
                              color: genre.color,
                            }}
                          >
                            {percentage}%
                          </span>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Немає даних про жанри</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Registration Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">Активність реєстрацій</h2>
              <p className="text-sm text-muted-foreground">
                Нові користувачі за останні 6 місяців
              </p>
            </div>

            {displayRegistrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={displayRegistrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'Реєстрацій']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {displayRegistrationData.map((entry, index) => (
                      <Cell
                        key={`bar-cell-${entry.month}-${index}`}
                        fill={`rgba(89, 99, 31, ${0.4 + (index / displayRegistrationData.length) * 0.6})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Немає даних про реєстрацію</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Teams */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-border bg-secondary/30">
            <h2 className="text-xl font-semibold mb-1">Топ команд цього місяця</h2>
            <p className="text-sm text-muted-foreground">
              Рейтинг на основі опублікованих розділів та переглядів
            </p>
          </div>

          <div className="overflow-x-auto">
            {displayTeams.length > 0 ? (
              <table className="w-full">
                <thead className="border-b border-border bg-secondary/20">
                  <tr>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground w-20">
                      Рейтинг
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                      Назва команди
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">
                      Опубліковано розділів
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">
                      Загальна к-ть переглядів
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayTeams.map((team) => (
                    <tr key={team.rank} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-center">
                        {team.badge ? (
                          <div
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${badgeColors[team.badge]} text-white font-bold text-sm shadow-lg`}
                          >
                            {team.rank}
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-muted-foreground">
                            {team.rank}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{team.teamName}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-[#59631f]/20 text-[#59631f] rounded-full text-sm font-medium">
                          {team.chaptersPublished}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-[#aeba68]/20 text-[#aeba68] rounded-full text-sm font-medium">
                          {team.totalViews.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Немаєданих про команди</p>
              </div>
            )}
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-card border border-border rounded-lg p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Керування базою даних</h2>
              <p className="text-sm text-muted-foreground">Інструменти для розробки та тестування</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
              {message.type === 'success' ? <Shield className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <h3 className="font-medium mb-2">Наповнити базу (Seed)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Запускає скрипт seed.py для імпорту 200 манг та 1000 користувачів. Це може зайняти кілька хвилин.
              </p>
              <Button
                onClick={() => handleAdminAction('seed', 'POST', setIsSeeding)}
                disabled={isSeeding || isDeleting}
                className="w-full gap-2 bg-[#59631f] hover:bg-[#59631f]/90"
              >
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Запустити Seeding
              </Button>
            </div>

            <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <h3 className="font-medium mb-2 text-destructive">Видалити все</h3>
              <p className="text-sm text-muted-foreground mb-4 text-destructive/70">
                Очищує всі таблиці (манга, розділи, коментарі тощо), крім адмінів. Дія незворотна!
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Ви впевнені, що хочете видалити ВСІ дані (крім адмінів)?')) {
                    handleAdminAction('seed', 'DELETE', setIsDeleting);
                  }
                }}
                disabled={isSeeding || isDeleting}
                className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Очистити базу
              </Button>
            </div>
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
    </AdminLayout>
  );
}
