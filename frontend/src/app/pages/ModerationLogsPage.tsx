import { Shield, Calendar } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState } from 'react';

interface LogEntry {
  id: string;
  admin: string;
  action: string;
  object: string;
  reason: string;
  date: string;
  actionType: 'hide' | 'ban' | 'edit' | 'restore' | 'delete';
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    admin: 'Moderator_Alex',
    action: 'Приховано мангу',
    object: 'ID:123 - "Заборонений контент"',
    reason: 'Порушення авторських прав',
    date: '2026-03-25 14:23:15',
    actionType: 'hide',
  },
  {
    id: '2',
    admin: 'Admin_Maria',
    action: 'Заблоковано користувача',
    object: 'User:SpamBot2024',
    reason: 'Розміщення спаму та реклами',
    date: '2026-03-25 13:45:32',
    actionType: 'ban',
  },
  {
    id: '3',
    admin: 'Moderator_Alex',
    action: 'Редаговано коментар',
    object: 'Comment:456 в "Тінь та Кістка" Розділ 12',
    reason: 'Цензура образливого контенту',
    date: '2026-03-25 12:10:08',
    actionType: 'edit',
  },
  {
    id: '4',
    admin: 'Admin_Maria',
    action: 'Відновлено користувача',
    object: 'User:ReformedUser',
    reason: 'Апеляція прийнята після 30-денної блокування',
    date: '2026-03-25 11:30:22',
    actionType: 'restore',
  },
  {
    id: '5',
    admin: 'Moderator_Olena',
    action: 'Приховано коментар',
    object: 'Comment:789 в "Безсмертний Культиватор" Розділ 45',
    reason: 'Спойлери без попередження',
    date: '2026-03-25 10:15:44',
    actionType: 'hide',
  },
  {
    id: '6',
    admin: 'Admin_Maria',
    action: 'Видалено розділ',
    object: 'ID:234 - Розділ 15 з "Піратська копія"',
    reason: 'Неліцензований контент',
    date: '2026-03-24 18:42:19',
    actionType: 'delete',
  },
  {
    id: '7',
    admin: 'Moderator_Alex',
    action: 'Редаговано мангу',
    object: 'ID:567 - "Виправлені теги"',
    reason: 'Оновлення неправильної класифікації жанру',
    date: '2026-03-24 16:20:55',
    actionType: 'edit',
  },
  {
    id: '8',
    admin: 'Moderator_Olena',
    action: 'Заблоковано користувача',
    object: 'User:ToxicTroll99',
    reason: 'Постійні токсичні коментарі та домагання',
    date: '2026-03-24 14:55:12',
    actionType: 'ban',
  },
];

const actionTypeColors: { [key: string]: { bg: string; text: string } } = {
  hide: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
  ban: { bg: 'bg-destructive/20', text: 'text-destructive' },
  edit: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  restore: { bg: 'bg-green-500/20', text: 'text-green-500' },
  delete: { bg: 'bg-destructive/30', text: 'text-destructive' },
};

const actionTypeLabels: { [key: string]: string } = {
  hide: 'Приховування',
  ban: 'Блокування',
  edit: 'Редагування',
  restore: 'Відновлення',
  delete: 'Видалення',
};

export function ModerationLogsPage() {
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [filterActionType, setFilterActionType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = mockLogs.filter((log) => {
    const matchesAdmin = filterAdmin === 'all' || log.admin === filterAdmin;
    const matchesActionType = filterActionType === 'all' || log.actionType === filterActionType;
    const matchesSearch =
      searchQuery === '' ||
      log.object.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAdmin && matchesActionType && matchesSearch;
  });

  const uniqueAdmins = Array.from(new Set(mockLogs.map((log) => log.admin)));

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
                <SelectItem key={admin} value={admin}>
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
                  const colors = actionTypeColors[log.actionType];
                  return (
                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Admin */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{log.admin}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium truncate ${colors.bg} ${colors.text}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Object */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-muted-foreground">
                          {log.object}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-sm truncate" title={log.reason}>
                          {log.reason}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground font-mono">
                          {log.date}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              Записів не знайдено
            </div>
          )}

          {/* Summary Footer */}
          <div className="border-t border-border bg-secondary/10 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Показано записів: <span className="font-semibold text-foreground">{filteredLogs.length}</span> з <span className="font-semibold text-foreground">{mockLogs.length}</span>
              </span>
              <span className="text-muted-foreground">
                Останнє оновлення: {mockLogs[0]?.date}
              </span>
            </div>
          </div>
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
