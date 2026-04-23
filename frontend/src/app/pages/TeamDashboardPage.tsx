import { useState } from 'react';
import { UserMinus, Search, UserPlus, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { AuthorLayout } from '../components/AuthorLayout';

interface TeamMember {
  id: string;
  nickname: string;
  avatar: string;
  role: string;
}

interface SearchResult {
  id: string;
  nickname: string;
  avatar: string;
  email: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    nickname: 'КитайськийДракон',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'Перекладач',
  },
  {
    id: '2',
    nickname: 'SakuraBlossom',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'Клінер',
  },
  {
    id: '3',
    nickname: 'MoonlightEditor',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
    role: 'Редактор',
  },
  {
    id: '4',
    nickname: 'TypeMaster',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
    role: 'Тайпер',
  },
];

// Mock user database for search
const mockUsers: SearchResult[] = [
  {
    id: '5',
    nickname: 'ihnore_ihor',
    avatar: 'https://i.pinimg.com/736x/d9/df/b1/d9dfb178d24b4da545af08e8d31bcc34.jpg',
    email: 'ihor@example.com',
  },
  {
    id: '6',
    nickname: 'anna',
    avatar: 'https://i.pinimg.com/736x/71/c5/2b/71c52bd601dd55c8f82daf440289a2ec.jpg',
    email: 'anna@example.com',
  },
  {
    id: '7',
    nickname: 'olexandr',
    avatar: 'https://i.pinimg.com/1200x/e6/23/84/e6238482f5b711ea0fe0b46fe8f511d5.jpg',
    email: 'olexandr@example.com',
  },
];

const roleOptions = ['Перекладач', 'Клінер', 'Тайпер', 'Редактор'];

export function TeamDashboardPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Перекладач');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [initialMembers, setInitialMembers] = useState<SearchResult[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    setShowSuccess(false);

    // Simulate search delay
    setTimeout(() => {
      const found = mockUsers.find(
        user => 
          user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (found) {
        // Check if user is already in team
        const isAlreadyMember = teamMembers.some(member => member.id === found.id);
        if (isAlreadyMember) {
          setSearchError('Користувач вже є членом команди');
        } else {
          setSearchResult(found);
        }
      } else {
        setSearchError('Користувача не знайдено');
      }
      setIsSearching(false);
    }, 500);
  };

  const handleAddMember = () => {
    if (!searchResult) return;

    const newMember: TeamMember = {
      id: searchResult.id,
      nickname: searchResult.nickname,
      avatar: searchResult.avatar,
      role: selectedRole,
    };

    setTeamMembers(prev => [...prev, newMember]);
    setSearchQuery('');
    setSearchResult(null);
    setSearchError('');
    setShowSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const handleSubmitApplication = () => {
    setApplicationSubmitted(true);
    setShowApplicationModal(false);
    // Reset form
    setTeamName('');
    setTeamDescription('');
    setInitialMembers([]);
  };

  const handleAddInitialMember = () => {
    const found = mockUsers.find(user => 
      user.nickname.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );

    if (found && !initialMembers.some(m => m.id === found.id)) {
      setInitialMembers(prev => [...prev, found]);
      setMemberSearchQuery('');
    }
  };

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Мої команди</h1>
              <p className="text-muted-foreground">
                Керуйте своїми перекладацькими командами
              </p>
            </div>
            <Button 
              onClick={() => setShowApplicationModal(true)}
              className="bg-[#59631f] hover:bg-[#59631f]/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              Подати заявку на створення команди
            </Button>
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
        <div className="mb-6 p-6 bg-card border-2 border-primary/30 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Dragon Scans Team</h2>
              <p className="text-muted-foreground">
                Професійна команда перекладачів та редакторів східної манги та манхви
              </p>
            </div>
            <div className="opacity-20">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M12 54C12 54 30 42 42 18C42 18 54 30 42 54C30 54 12 54 12 54Z" fill="#59631f" />
              </svg>
            </div>
          </div>
        </div>

        {/* Members Table */}
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
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border">
                          <ImageWithFallback
                            src={member.avatar}
                            alt={member.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{member.nickname}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                      >
                        <SelectTrigger className="w-[180px] bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
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

        {/* Leader Tools - Add Member */}
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
                    placeholder="ihnore_ihor або email..."
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
                      <SelectItem key={role} value={role}>
                        {role}
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
                        src={searchResult.avatar}
                        alt={searchResult.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{searchResult.nickname}</p>
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

            {/* Decorative leaf motifs */}
            <div className="flex justify-end gap-2 opacity-20 pt-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 14C3 14 8 11 11 5C11 5 14 8 11 14C8 14 3 14 3 14Z" fill="#59631f" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
              </svg>
            </div>
          </div>
        </div>
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
                            src={member.avatar}
                            alt={member.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.nickname}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInitialMembers(prev => prev.filter(m => m.id !== member.id))}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmitApplication}
                disabled={!teamName.trim() || !teamDescription.trim()}
                className="flex-1 bg-[#59631f] hover:bg-[#59631f]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Подати заявку
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