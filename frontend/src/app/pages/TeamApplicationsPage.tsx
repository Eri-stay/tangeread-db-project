import { useState } from 'react';
import { Check, X, Eye, Mail, User as UserIcon, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AdminLayout } from '../components/AdminLayout';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface TeamMember {
  id: string;
  nickname: string;
  email: string;
  avatar: string;
}

interface TeamApplication {
  id: string;
  teamName: string;
  description: string;
  applicant: {
    id: string;
    nickname: string;
    email: string;
    avatar: string;
  };
  initialMembers: TeamMember[];
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockApplications: TeamApplication[] = [
  {
    id: '1',
    teamName: 'Moonlight Scanlations',
    description: 'Професійна команда перекладачів з 5+ років досвіду роботи з японською мангою. Спеціалізуємося на романтичних та драматичних жанрах. Наша команда складається з кваліфікованих перекладачів, редакторів та клінерів.',
    applicant: {
      id: 'user1',
      nickname: 'MoonlightLeader',
      email: 'moonlight@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    initialMembers: [
      {
        id: 'user2',
        nickname: 'SakuraTranslator',
        email: 'sakura@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      },
      {
        id: 'user3',
        nickname: 'EditorPro',
        email: 'editor@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
    ],
    submittedDate: '2025-03-20',
    status: 'pending',
  },
  {
    id: '2',
    teamName: 'Korean Wave Translations',
    description: 'Команда ентузіастів корейської манхви. Перекладаємо виключно з корейської мови. У нас є досвід роботи з найпопулярнішими тайтлами жанру фентезі та бойовиків.',
    applicant: {
      id: 'user4',
      nickname: 'KoreanMaster',
      email: 'korean@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    initialMembers: [
      {
        id: 'user5',
        nickname: 'HangulExpert',
        email: 'hangul@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
    ],
    submittedDate: '2025-03-22',
    status: 'pending',
  },
  {
    id: '3',
    teamName: 'Fantasy Realm Scans',
    description: 'Нова команда, яка фокусується на фентезійних тайтлах. Маємо досвід у перекладі з англійської та японської мов.',
    applicant: {
      id: 'user6',
      nickname: 'FantasyFan',
      email: 'fantasy@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    initialMembers: [],
    submittedDate: '2025-03-24',
    status: 'pending',
  },
  {
    id: '4',
    teamName: 'Speed Scans Team',
    description: 'Швидкий переклад та якісна обробка. Наша команда спеціалізується на популярних сьонен тайтлах.',
    applicant: {
      id: 'user7',
      nickname: 'SpeedyTL',
      email: 'speedy@example.com',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
    initialMembers: [
      {
        id: 'user8',
        nickname: 'FastEditor',
        email: 'fasteditor@example.com',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      },
      {
        id: 'user9',
        nickname: 'QuickCleaner',
        email: 'quickcleaner@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      },
      {
        id: 'user10',
        nickname: 'TypeFast',
        email: 'typefast@example.com',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      },
    ],
    submittedDate: '2025-03-18',
    status: 'approved',
  },
];

export function TeamApplicationsPage() {
  const [applications, setApplications] = useState<TeamApplication[]>(mockApplications);
  const [selectedApplication, setSelectedApplication] = useState<TeamApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleApprove = (id: string) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status: 'approved' as const } : app)
    );
  };

  const handleReject = (id: string) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status: 'rejected' as const } : app)
    );
  };

  const handleViewDetails = (application: TeamApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const filteredApplications = applications.filter(app => 
    filterStatus === 'all' ? true : app.status === filterStatus
  );

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Заявки на створення команд</h1>
              <p className="text-muted-foreground">
                Перегляд та модерація заявок на створення перекладацьких команд
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Всього заявок</div>
            <div className="text-2xl font-semibold">{applications.length}</div>
          </div>
          <div className="bg-card border border-[#aeba68]/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Очікують розгляду</div>
            <div className="text-2xl font-semibold text-[#aeba68]">{pendingCount}</div>
          </div>
          <div className="bg-card border border-green-500/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Схвалено</div>
            <div className="text-2xl font-semibold text-green-500">{approvedCount}</div>
          </div>
          <div className="bg-card border border-destructive/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Відхилено</div>
            <div className="text-2xl font-semibold text-destructive">{rejectedCount}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-[#59631f] hover:bg-[#59631f]/90' : ''}
          >
            Всі ({applications.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            className={filterStatus === 'pending' ? 'bg-[#aeba68] hover:bg-[#aeba68]/90' : ''}
          >
            Очікують ({pendingCount})
          </Button>
          <Button
            variant={filterStatus === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('approved')}
            className={filterStatus === 'approved' ? 'bg-green-600 hover:bg-green-600/90' : ''}
          >
            Схвалено ({approvedCount})
          </Button>
          <Button
            variant={filterStatus === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('rejected')}
            className={filterStatus === 'rejected' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            Відхилено ({rejectedCount})
          </Button>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{application.teamName}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        application.status === 'pending'
                          ? 'bg-[#aeba68]/20 text-[#aeba68] border border-[#aeba68]/30'
                          : application.status === 'approved'
                          ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                          : 'bg-destructive/20 text-destructive border border-destructive/30'
                      }`}
                    >
                      {application.status === 'pending'
                        ? 'Очікує розгляду'
                        : application.status === 'approved'
                        ? 'Схвалено'
                        : 'Відхилено'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {application.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Заявник: {application.applicant.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(application.submittedDate).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Початковий склад: {application.initialMembers.length} осіб</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(application)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Переглянути деталі
                </Button>
                {application.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(application.id)}
                      className="gap-2 bg-green-600 hover:bg-green-600/90"
                    >
                      <Check className="h-4 w-4" />
                      Схвалити
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(application.id)}
                      className="gap-2 text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <X className="h-4 w-4" />
                      Відхилити
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {filteredApplications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Немає заявок з таким статусом</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedApplication?.teamName}</DialogTitle>
            <DialogDescription>
              Детальна інформація про заявку на створення команди
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Статус</h3>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    selectedApplication.status === 'pending'
                      ? 'bg-[#aeba68]/20 text-[#aeba68] border border-[#aeba68]/30'
                      : selectedApplication.status === 'approved'
                      ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                      : 'bg-destructive/20 text-destructive border border-destructive/30'
                  }`}
                >
                  {selectedApplication.status === 'pending'
                    ? 'Очікує розгляду'
                    : selectedApplication.status === 'approved'
                    ? 'Схвалено'
                    : 'Відхилено'}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Опис команди</h3>
                <p className="text-foreground leading-relaxed">{selectedApplication.description}</p>
              </div>

              {/* Applicant */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Заявник</h3>
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border-2 border-border">
                    <ImageWithFallback
                      src={selectedApplication.applicant.avatar}
                      alt={selectedApplication.applicant.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedApplication.applicant.nickname}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{selectedApplication.applicant.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial Members */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Початковий склад ({selectedApplication.initialMembers.length})
                </h3>
                {selectedApplication.initialMembers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApplication.initialMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border border-border"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border">
                          <ImageWithFallback
                            src={member.avatar}
                            alt={member.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.nickname}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Початковий склад не вказано. Члени команди будуть додані пізніше.
                  </p>
                )}
              </div>

              {/* Submission Date */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Дата подання</h3>
                <p className="text-foreground">
                  {new Date(selectedApplication.submittedDate).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      handleApprove(selectedApplication.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-600/90 gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Схвалити заявку
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedApplication.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/30 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Відхилити заявку
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
