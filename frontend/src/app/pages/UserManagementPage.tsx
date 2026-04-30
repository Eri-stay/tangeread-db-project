import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Edit, Ban, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { BanModal } from '../components/BanModal';
import { UnauthorizedPage } from './UnauthorizedPage';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  role: string;
  is_banned: boolean;
  ban_reason?: string;
}

const roleLabels: { [key: string]: string } = {
  reader: 'Читач',
  author: 'Автор',
  moderator: 'Модератор',
  admin: 'Адміністратор',
};

export function UserManagementPage() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserRole(user.role || '');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';
      const res = await fetch(`${apiUrl}/users/search?q=${searchQuery}&page=${currentPage}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
        if (json.meta) {
          setTotalPages(Math.ceil(json.meta.total / itemsPerPage));
        } else {
          setTotalPages(1);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPage]);


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

  const handleRestore = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';
      const res = await fetch(`${apiUrl}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, is_banned: false, ban_reason: undefined } : user
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmRoleChange = async () => {
    if (selectedUser) {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';
        const res = await fetch(`${apiUrl}/admin/users/${selectedUser.id}/role`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((user) => (user.id === selectedUser.id ? { ...user, role: newRole } : user))
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    setEditModalOpen(false);
  };

  const confirmBan = async (reason: string, customNote: string, duration: string) => {
    if (selectedUser) {
      const fullReason = customNote ? `${reason} - ${customNote}` : reason;
      try {
        const token = localStorage.getItem('token');
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';
        const res = await fetch(`${apiUrl}/admin/users/${selectedUser.id}/ban`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: fullReason })
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === selectedUser.id
                ? { ...user, is_banned: true, ban_reason: fullReason }
                : user
            )
          );
        }
      } catch (e) {
        console.error(e);
      }
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
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">Завантаження...</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                      {/* User with Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border">
                            <ImageWithFallback
                              src={user.avatar_url || ''}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {!user.is_banned ? (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                            Активний
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium block w-fit">
                              Заблокований
                            </span>
                            {user.ban_reason && (
                              <p className="text-xs text-muted-foreground">{user.ban_reason}</p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {user.id !== 1 ? (
                          <div className="flex items-center justify-center gap-2">
                            {/* Only admins can change roles */}
                            {currentUserRole === 'admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRole(user)}
                                className="gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Редагувати роль
                              </Button>
                            )}
                            {!user.is_banned ? (
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
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                              Головний адміністратор
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && users.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              Користувачів не знайдено
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/10">
              <span className="text-sm text-muted-foreground">
                Сторінка {currentPage} з {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Попередня
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Наступна <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
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
              Змінити роль для користувача {selectedUser?.username}
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
        userName={selectedUser?.username || ''}
        onConfirm={confirmBan}
      />
    </AdminLayout>
  );
}