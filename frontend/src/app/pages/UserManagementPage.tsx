import { useState } from 'react';
import { Search, Edit, Ban, RotateCcw } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { BanModal } from '../components/BanModal';

interface User {
  id: string;
  nickname: string;
  email: string;
  avatar: string;
  role: string;
  status: 'active' | 'banned';
  banReason?: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    nickname: 'КитайськийДракон',
    email: 'dragon@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'reader',
    status: 'active',
  },
  {
    id: '2',
    nickname: 'SakuraBlossom',
    email: 'sakura@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'author',
    status: 'active',
  },
  {
    id: '3',
    nickname: 'SpamBot2024',
    email: 'spam@bad.com',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
    role: 'reader',
    status: 'banned',
    banReason: 'Розміщення спаму та реклами',
  },
  {
    id: '4',
    nickname: 'MoonlightEditor',
    email: 'moon@example.com',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
    role: 'moderator',
    status: 'active',
  },
];

const roleLabels: { [key: string]: string } = {
  reader: 'Читач',
  author: 'Автор',
  moderator: 'Модератор',
  admin: 'Адміністратор',
};

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [banReason, setBanReason] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditModalOpen(true);
  };

  const handleBan = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setBanModalOpen(true);
  };

  const handleRestore = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: 'active', banReason: undefined } : user
      )
    );
  };

  const confirmRoleChange = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? { ...user, role: newRole } : user))
      );
    }
    setEditModalOpen(false);
  };

  const confirmBan = (reason: string, customNote: string, duration: string) => {
    if (selectedUser) {
      const fullReason = customNote ? `${reason} - ${customNote}` : reason;
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? { ...user, status: 'banned', banReason: fullReason }
            : user
        )
      );
      setBanModalOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Керування користувачами</h1>
          <p className="text-muted-foreground">
            Управління ролями, статусами та доступом користувачів
          </p>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Пошук за email або нікнеймом"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border h-11"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/20">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Користувач</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Роль</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold">Статус</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    {/* User with Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border">
                          <ImageWithFallback
                            src={user.avatar}
                            alt={user.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{user.nickname}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                        {roleLabels[user.role]}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {user.status === 'active' ? (
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                          Активний
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium block w-fit">
                            Заблокований
                          </span>
                          {user.banReason && (
                            <p className="text-xs text-muted-foreground">{user.banReason}</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(user)}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Редагувати роль
                        </Button>
                        {user.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBan(user)}
                            className="gap-1 text-destructive hover:text-destructive border-destructive/30"
                          >
                            <Ban className="h-3 w-3" />
                            Заблокувати
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(user.id)}
                            className="gap-1 text-green-500 hover:text-green-500 border-green-500/30"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Відновити
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              Користувачів не знайдено
            </div>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Зміна ролі користувача</DialogTitle>
            <DialogDescription>
              Змінити роль для користувача {selectedUser?.nickname}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Нова роль</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="reader">Читач</SelectItem>
                  <SelectItem value="author">Автор</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="admin">Адміністратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={confirmRoleChange} className="bg-primary hover:bg-primary/90">
              Зберегти зміни
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <BanModal
        open={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        userName={selectedUser?.nickname || ''}
        onConfirm={confirmBan}
      />
    </AdminLayout>
  );
}