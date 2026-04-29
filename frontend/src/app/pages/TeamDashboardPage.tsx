import { useState, useEffect } from 'react';
import { UserMinus, Search, UserPlus, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { AuthorLayout } from '../components/AuthorLayout';

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

const roleOptions = [
  { value: 'leader', label: 'Лідер' },
  { value: 'translator', label: 'Перекладач' },
  { value: 'cleaner', label: 'Клінер' },
  { value: 'typer', label: 'Тайпер' },
  { value: 'editor', label: 'Редактор' },
];

function getRoleLabel(role: string) {
  return roleOptions.find(r => r.value === role)?.label || role;
}

interface SearchResult {
  id: number;
  username: string;
  avatar_url: string;
  email: string;
}

interface InitialMember extends SearchResult {
  role: string;
}

export function TeamDashboardPage() {
  const [team, setTeam] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('translator');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  
  const [initialMembers, setInitialMembers] = useState<InitialMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState<{ status: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<SearchResult | null>(null);

  const fetchTeam = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/users/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTeam(json.data);
      }
    } catch (e) {}
  };

  const fetchUser = () => {
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
  };

  useEffect(() => {
    fetchUser();
    fetchTeam();
    
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${apiUrl}/users/team-application`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) setExistingApplication(json.data);
      })
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    setShowSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Пошук не вдався');
      const json = await res.json();
      const results = json.data || [];
      const found = results[0]; // For simplicity, take the first one or we can show a list

      if (found) {
        const isAlreadyMember = team.members?.some((m: any) => m.UserID === found.id);
        if (isAlreadyMember) {
          setSearchError('Користувач вже є членом команди');
        } else {
          setSearchResult(found);
        }
      } else {
        setSearchError('Користувача не знайдено');
      }
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!searchResult || !team) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/team/${team.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: searchResult.id, role: selectedRole }),
      });

      if (!res.ok) throw new Error('Не вдалося додати учасника');
      
      await fetchTeam();
      setSearchQuery('');
      setSearchResult(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRoleChange = async (memberId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/team/${team.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error('Не вдалося змінити роль');
      await fetchTeam();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цього учасника?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/team/${team.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Не вдалося видалити учасника');
      await fetchTeam();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmitApplication = async () => {
    if (!teamName.trim() || !teamDescription.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/team-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: teamName, description: teamDescription }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Помилка при подачі заявки');
      }
      setExistingApplication({ status: 'pending', name: teamName });
      setApplicationSubmitted(true);
      setShowApplicationModal(false);
      setTeamName('');
      setTeamDescription('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenApplicationModal = () => {
    if (currentUser) {
      setInitialMembers([{ ...currentUser, role: 'leader' }]);
    } else {
      setInitialMembers([]);
    }
    setShowApplicationModal(true);
  };

  const handleAddInitialMember = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/users/search?q=${memberSearchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const results = json.data || [];
        const found = results[0];
        if (found && !initialMembers.some(m => m.id === found.id)) {
          setInitialMembers(prev => [...prev, { ...found, role: 'translator' }]);
          setMemberSearchQuery('');
        }
      }
    } catch (e) {}
  };

  const handleInitialMemberRoleChange = (memberId: number, newRole: string) => {
    setInitialMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Моя команда</h1>
              <p className="text-muted-foreground">
                Керуйте своєю перекладацькою командою
              </p>
            </div>
            {/* Show apply button to ALL authenticated users who don't have a pending/approved application */}
            {!existingApplication && (
              <Button
                onClick={handleOpenApplicationModal}
                className="bg-[#59631f] hover:bg-[#59631f]/90 gap-2"
              >
                <Plus className="h-4 w-4" />
                Подати заявку на створення команди
              </Button>
            )}
            {existingApplication && existingApplication.status === 'pending' && (
              <span className="px-3 py-2 rounded-md text-sm bg-[#aeba68]/20 text-[#aeba68] border border-[#aeba68]/30">
                Заявка «{existingApplication.name}» на розгляді
              </span>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Application Submitted Notice */}
        {applicationSubmitted && (
          <div className="mb-8 p-6 bg-[#59631f]/10 border border-[#59631f]/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="h-6 w-6 text-[#59631f]" />
              <div>
                <h3 className="font-semibold text-[#59631f]">Заявку успішно подано!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Статус: <span className="text-[#aeba68] font-medium">Очікує на розгляд</span>
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Ваша заявка на створення команди надіслана на розгляд адміністрації. 
              Зазвичай процес перевірки займає 2-3 робочих дні.
            </p>
          </div>
        )}

        {/* Existing Team - Dragon Scans Team */}
        {team ? (
          <div className="mb-6 p-6 bg-card border-2 border-primary/30 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{team.name}</h2>
                <p className="text-muted-foreground">
                  {team.description}
                </p>
              </div>
              <div className="opacity-20">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M12 54C12 54 30 42 42 18C42 18 54 30 42 54C30 54 12 54 12 54Z" fill="#59631f" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          !existingApplication && (
            <div className="mb-8 p-12 bg-card border border-dashed border-border rounded-lg text-center">
              <h2 className="text-xl font-medium mb-2">У вас ще немає команди</h2>
              <p className="text-muted-foreground mb-6">Створіть свою команду, щоб публікувати переклади манґи</p>
              <Button onClick={handleOpenApplicationModal} className="bg-[#59631f] hover:bg-[#59631f]/90">
                Подати заявку на створення
              </Button>
            </div>
          )
        )}

        {team && (
          <div className="mb-8 bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="text-lg font-semibold">Учасники команди</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-secondary/20">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                      Учасник
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                      Внутрішня роль
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground w-24">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {team.members?.map((m: any) => (
                    <tr key={m.UserID} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border">
                            <ImageWithFallback
                              src={m.User?.avatar_url || ''}
                              alt={m.User?.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium">{m.User?.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={m.InternalRole}
                          onValueChange={(value) => handleRoleChange(m.UserID, value)}
                          disabled={m.UserID === currentUser?.id || team.members?.find((me: any) => me.UserID === currentUser?.id)?.InternalRole !== 'leader'}
                        >
                          <SelectTrigger className="w-[180px] bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(m.UserID)}
                          disabled={m.UserID === currentUser?.id && team.members?.length > 1}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="h-4 w-4" />
                          <span className="sr-only">Видалити учасника</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leader Tools - Add Member */}
        {team && team.members?.find((me: any) => me.UserID === currentUser?.id)?.InternalRole === 'leader' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Додавання учасників
            </h2>

            <div className="space-y-6">
              {/* Success Message */}
              {showSuccess && (
                <div className="flex items-center gap-2 p-3 bg-[#59631f]/10 border border-[#59631f]/30 rounded-lg text-[#59631f]">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Учасника успішно додано до команди!</span>
                </div>
              )}

              {/* Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="user-search" className="text-sm">
                    Пошук за нікнеймом або Email
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="nickname або email..."
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <Label htmlFor="member-role" className="text-sm">
                    Внутрішня роль
                  </Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="member-role" className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Button */}
                <div className="space-y-2">
                  <Label className="text-sm text-transparent">Action</Label>
                  <Button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className="w-full bg-[#59631f] hover:bg-[#59631f]/90 gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isSearching ? 'Пошук...' : 'Знайти користувача'}
                  </Button>
                </div>
              </div>

              {/* Search Result */}
              {searchResult && (
                <div className="p-4 bg-secondary/30 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-3">Знайдений користувач:</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border-2 border-primary">
                        <ImageWithFallback
                          src={searchResult.avatar_url || ''}
                          alt={searchResult.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{searchResult.username}</p>
                        <p className="text-xs text-muted-foreground">{searchResult.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleAddMember}
                      size="sm"
                      className="bg-[#59631f] hover:bg-[#59631f]/90 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Додати до команди
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {searchError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{searchError}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Team Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Заявка на створення команди</DialogTitle>
            <DialogDescription>
              Заповніть форму нижче, щоб створити нову перекладацьку команду. 
              Заявка буде розглянута адміністрацією протягом 2-3 робочих днів.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="team-name">Назва команди <span className="text-destructive">*</span></Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Наприклад: Dragon Scans Team"
                className="bg-secondary border-border"
              />
            </div>

            {/* Team Description */}
            <div className="space-y-2">
              <Label htmlFor="team-description">Опис команди <span className="text-destructive">*</span></Label>
              <Textarea
                id="team-description"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Опишіть спеціалізацію вашої команди, досвід учасників та плани..."
                className="bg-secondary border-border min-h-[120px]"
              />
            </div>

            {/* Initial Members */}
            <div className="space-y-2">
              <Label>Початковий склад (необов'язково)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Додайте учасників, які приєднаються до команди одразу після схвалення
              </p>
              
              {/* Add Member Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInitialMember()}
                    placeholder="Нікнейм або Email учасника..."
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddInitialMember}
                  variant="outline"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Додати
                </Button>
              </div>

              {/* Initial Members List */}
              {initialMembers.length > 0 && (
                <div className="space-y-2 mt-4">
                  {initialMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary border-2 border-border">
                          <ImageWithFallback
                            src={member.avatar_url || ''}
                            alt={member.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.username}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleInitialMemberRoleChange(member.id, value)}
                          disabled={!!(currentUser && member.id === currentUser.id)}
                        >
                          <SelectTrigger className="w-[140px] bg-secondary border-border h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value} className="text-xs">
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {currentUser && member.id !== currentUser.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInitialMembers(prev => prev.filter(m => m.id !== member.id))}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmitApplication}
                disabled={!teamName.trim() || !teamDescription.trim() || isSubmitting}
                className="flex-1 bg-[#59631f] hover:bg-[#59631f]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Надсилаємо...' : 'Подати заявку'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApplicationModal(false)}
              >
                Скасувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthorLayout>
  );
}