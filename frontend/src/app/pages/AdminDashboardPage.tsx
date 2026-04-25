import { useState } from 'react';
import { Users, BookOpen, Image, AlertTriangle, AlertCircle, PieChart, List, TrendingUp, TrendingDown, Shield, FileWarning, Link as LinkIcon } from 'lucide-react';
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

const genreData: GenreData[] = [
  { name: 'Фентезі', value: 2845, color: '#59631f' },
  { name: 'Романтика', value: 2134, color: '#aeba68' },
  { name: 'Бойовик', value: 1987, color: '#8b9456' },
  { name: 'Драма', value: 1456, color: '#6b7542' },
  { name: 'Комедія', value: 1234, color: '#4a5230' },
  { name: 'Пригоди', value: 987, color: '#a3b060' },
  { name: 'Інше', value: 543, color: '#c5d078' },
];

const registrationData = [
  { month: 'Жовт', count: 342 },
  { month: 'Лист', count: 489 },
  { month: 'Груд', count: 567 },
  { month: 'Січ', count: 723 },
  { month: 'Лют', count: 891 },
  { month: 'Берез', count: 1045 },
];

const topTeams: TeamRanking[] = [
  { rank: 1, teamName: 'Dragon Scans Team', chaptersPublished: 45, totalViews: 123456, badge: 'gold' },
  { rank: 2, teamName: 'Sakura Translation', chaptersPublished: 38, totalViews: 98234, badge: 'silver' },
  { rank: 3, teamName: 'Moonlight Editors', chaptersPublished: 32, totalViews: 87123, badge: 'bronze' },
  { rank: 4, teamName: 'Phoenix Rising', chaptersPublished: 28, totalViews: 76543 },
  { rank: 5, teamName: 'Eastern Legends', chaptersPublished: 24, totalViews: 65432 },
];

const badgeColors = {
  gold: 'from-amber-400 to-yellow-600',
  silver: 'from-gray-300 to-gray-500',
  bronze: 'from-amber-600 to-orange-800',
};

export function AdminDashboardPage() {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  const totalGenreViews = genreData.reduce((sum, genre) => sum + genre.value, 0);

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
                +12.3%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">12,458</div>
            <div className="text-sm text-muted-foreground">Усього користувачів</div>
            <p className="text-xs text-primary mt-2">+1,234 цього тижня</p>
          </div>

          {/* Active Teams */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-purple-500/20 inline-block mb-4">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold mb-1">147</div>
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
                -1.4%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">1,847</div>
            <div className="text-sm text-muted-foreground">Бібліотека манг</div>
            <p className="text-xs text-primary mt-2">+23 нові цього місяця</p>
          </div>

          {/* Total Pages */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-blue-500/20 inline-block mb-4">
              <Image className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-1">2.4M</div>
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
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
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
                {genreData
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
                  })}
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

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={registrationData}>
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
                  {registrationData.map((entry, index) => (
                    <Cell
                      key={`bar-cell-${entry.month}-${index}`}
                      fill={`rgba(89, 99, 31, ${0.4 + (index / registrationData.length) * 0.6})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
                {topTeams.map((team) => (
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
          </div>
        </div>

        {/* Moderation Overview */}
        <div className="bg-card border border-destructive/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Огляд модерації</h2>
              <p className="text-sm text-muted-foreground">Очікують затвердження</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Teams */}
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Заявки на команди</span>
                </div>
                <span className="text-2xl font-bold text-primary">5</span>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" disabled>
                <LinkIcon className="h-4 w-4" />
                Переглянути заявки
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