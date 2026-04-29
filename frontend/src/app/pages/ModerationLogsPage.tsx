import { Shield, Calendar, Loader2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState, useEffect } from 'react';

interface LogEntry {
  id: number;
  admin_id: number;
  admin?: { username: string };
  action_type: string;
  reason?: string;
  target_user_id?: number;
  target_manga_id?: number;
  target_chapter_id?: number;
  target_comment_id?: number;
  created_at: string;
}

const actionTypeColors: { [key: string]: { bg: string; text: string } } = {
  hide_manga: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
  hide_comment: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
  ban_user: { bg: 'bg-destructive/20', text: 'text-destructive' },
  edit_manga: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  edit_comment: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  restore: { bg: 'bg-green-500/20', text: 'text-green-500' },
  delete_chapter: { bg: 'bg-destructive/30', text: 'text-destructive' },
  approve_team: { bg: 'bg-green-500/20', text: 'text-green-500' },
  reject_team: { bg: 'bg-destructive/20', text: 'text-destructive' },
};

const actionTypeLabels: { [key: string]: string } = {
  hide_manga: 'Приховано манґу',
  hide_comment: 'Приховано коментар',
  ban_user: 'Блокування',
  edit_manga: 'Редаговано манґу',
  edit_comment: 'Редаговано коментар',
  restore: 'Відновлення',
  delete_chapter: 'Видалення розділу',
  approve_team: 'Прийнято команду',
  reject_team: 'Відхилено команду',
};

export function ModerationLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [filterActionType, setFilterActionType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/moderation/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.data) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getObjectDescription = (log: LogEntry) => {
    if (log.target_manga_id) return `Manga ID: ${log.target_manga_id}`;
    if (log.target_comment_id) return `Comment ID: ${log.target_comment_id}`;
    if (log.target_user_id) return `User ID: ${log.target_user_id}`;
    if (log.target_chapter_id) return `Chapter ID: ${log.target_chapter_id}`;
    return '---';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAdmin = filterAdmin === 'all' || log.admin?.username === filterAdmin;
    const matchesActionType = filterActionType === 'all' || log.action_type === filterActionType;
    const matchesSearch =
      searchQuery === '' ||
      getObjectDescription(log).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    return matchesAdmin && matchesActionType && matchesSearch;
  });

  const uniqueAdmins = Array.from(new Set(logs.map((log) => log.admin?.username).filter(Boolean)));

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Журнал аудиту</h1>
              <p className="text-muted-foreground">
                Повний журнал модераційних дій на платформі
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              type="search"
              placeholder="Пошук за об'єктом або причиною..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <Select value={filterAdmin} onValueChange={setFilterAdmin}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Всі адміністратори" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Всі адміністратори</SelectItem>
              {uniqueAdmins.map((admin) => (
                <SelectItem key={admin} value={admin!}>
                  {admin}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterActionType} onValueChange={setFilterActionType}>
            <SelectTrigger className="w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Всі дії" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Всі дії</SelectItem>
              {Object.entries(actionTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Завантаження журналу...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-secondary/20">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Адміністратор</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Дія</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Об'єкт</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Причина</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Дата
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => {
                    const colors = actionTypeColors[log.action_type] || { bg: 'bg-secondary', text: 'text-muted-foreground' };
                    return (
                      <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                        {/* Admin */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="font-medium">{log.admin?.username || `ID: ${log.admin_id}`}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${colors.bg} ${colors.text}`}
                          >
                            {actionTypeLabels[log.action_type] || log.action_type}
                          </span>
                        </td>

                        {/* Object */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-muted-foreground">
                            {getObjectDescription(log)}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-sm truncate" title={log.reason}>
                            {log.reason || 'Без причини'}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground font-mono">
                            {new Date(log.created_at).toLocaleString('uk-UA')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredLogs.length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground">
              Записів не знайдено
            </div>
          )}

          {/* Summary Footer */}
          {!loading && (
            <div className="border-t border-border bg-secondary/10 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Показано записів: <span className="font-semibold text-foreground">{filteredLogs.length}</span> з <span className="font-semibold text-foreground">{logs.length}</span>
                </span>
                <span className="text-muted-foreground">
                  Останнє оновлення: {logs[0]?.created_at ? new Date(logs[0].created_at).toLocaleString('uk-UA') : '---'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1 text-primary">Увага: Конфіденційна інформація</p>
              <p className="text-muted-foreground">
                Цей журнал містить конфіденційну інформацію про модераційні дії. 
                Доступ обмежений та всі перегляди логуються для цілей аудиту безпеки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
