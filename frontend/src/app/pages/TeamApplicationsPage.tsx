import { useState, useEffect } from 'react';
import { Check, X, Eye, User as UserIcon, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AdminLayout } from '../components/AdminLayout';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

interface TeamApplication {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  applicant_id: number;
  applicant_name: string;
  applicant_avatar?: string;
}

function StatusBadge({ status }: { status: TeamApplication['status'] }) {
  const map = {
    pending:  { label: 'Очікує розгляду', cls: 'bg-[#aeba68]/20 text-[#aeba68] border border-[#aeba68]/30' },
    approved: { label: 'Схвалено',        cls: 'bg-green-500/20 text-green-500 border border-green-500/30' },
    rejected: { label: 'Відхилено',       cls: 'bg-destructive/20 text-destructive border border-destructive/30' },
  };
  const { label, cls } = map[status];
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

export function TeamApplicationsPage() {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Details modal
  const [selectedApp, setSelectedApp] = useState<TeamApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<TeamApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState<number | null>(null);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/admin/team-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Не вдалось завантажити заявки');
      const json = await res.json();
      setApplications(json.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleApprove = async (app: TeamApplication) => {
    setIsApproving(app.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/admin/team-applications/${app.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Помилка при схваленні');
      }
      // Optimistic update
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
      if (selectedApp?.id === app.id) setSelectedApp(prev => prev ? { ...prev, status: 'approved' } : null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsApproving(null);
    }
  };

  const openRejectModal = (app: TeamApplication) => {
    setRejectTarget(app);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/admin/team-applications/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Помилка при відхиленні');
      }
      setApplications(prev =>
        prev.map(a => a.id === rejectTarget.id
          ? { ...a, status: 'rejected', rejection_reason: rejectReason }
          : a
        )
      );
      if (selectedApp?.id === rejectTarget.id) {
        setSelectedApp(prev => prev ? { ...prev, status: 'rejected', rejection_reason: rejectReason } : null);
      }
      setRejectTarget(null);
      setRejectReason('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsRejecting(false);
    }
  };

  const filtered = applications.filter(a => filterStatus === 'all' || a.status === filterStatus);
  const pendingCount  = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

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
            <Button variant="outline" size="sm" onClick={fetchApplications} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Оновити
            </Button>
          </div>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Stats */}
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: 'all',      label: `Всі (${applications.length})`,    cls: 'bg-[#59631f] hover:bg-[#59631f]/90' },
            { key: 'pending',  label: `Очікують (${pendingCount})`,      cls: 'bg-[#aeba68] hover:bg-[#aeba68]/90' },
            { key: 'approved', label: `Схвалено (${approvedCount})`,     cls: 'bg-green-600 hover:bg-green-600/90' },
            { key: 'rejected', label: `Відхилено (${rejectedCount})`,    cls: 'bg-destructive hover:bg-destructive/90' },
          ] as const).map(({ key, label, cls }) => (
            <Button
              key={key}
              variant={filterStatus === key ? 'default' : 'outline'}
              onClick={() => setFilterStatus(key)}
              className={filterStatus === key ? cls : ''}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p>Завантаження заявок...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <AlertCircle className="h-10 w-10 mb-4" />
            <p className="font-medium mb-2">{error}</p>
            <Button variant="outline" onClick={fetchApplications} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Спробувати знову
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => (
              <div
                key={app.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold">{app.name}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    {app.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{app.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary border border-border">
                          <ImageWithFallback
                            src={app.applicant_avatar || ''}
                            alt={app.applicant_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{app.applicant_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(app.created_at).toLocaleDateString('uk-UA')}</span>
                      </div>
                    </div>
                    {app.status === 'rejected' && app.rejection_reason && (
                      <p className="mt-2 text-sm text-destructive/80 italic">
                        Причина відхилення: {app.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedApp(app); setShowDetails(true); }}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Деталі
                  </Button>

                  {app.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app)}
                        disabled={isApproving === app.id}
                        className="gap-2 bg-green-600 hover:bg-green-600/90"
                      >
                        {isApproving === app.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Check className="h-4 w-4" />}
                        Схвалити
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectModal(app)}
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

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Немає заявок з таким статусом</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Details Modal ── */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedApp?.name}</DialogTitle>
            <DialogDescription>Детальна інформація про заявку</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-5 py-2">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Статус</p>
                <StatusBadge status={selectedApp.status} />
              </div>

              {selectedApp.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Опис команди</p>
                  <p className="text-foreground leading-relaxed text-sm">{selectedApp.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-3">Заявник</p>
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border-2 border-border flex-shrink-0">
                    <ImageWithFallback
                      src={selectedApp.applicant_avatar || ''}
                      alt={selectedApp.applicant_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{selectedApp.applicant_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedApp.applicant_id}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Дата подання</p>
                <p className="text-sm">{new Date(selectedApp.created_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs text-muted-foreground mb-1">Причина відхилення</p>
                  <p className="text-sm text-destructive">{selectedApp.rejection_reason}</p>
                </div>
              )}

              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button
                    onClick={() => { handleApprove(selectedApp); setShowDetails(false); }}
                    disabled={isApproving === selectedApp.id}
                    className="flex-1 bg-green-600 hover:bg-green-600/90 gap-2"
                  >
                    {isApproving === selectedApp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Схвалити заявку
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { openRejectModal(selectedApp); setShowDetails(false); }}
                    className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/30 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Відхилити
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Modal ── */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Відхилення заявки</DialogTitle>
            <DialogDescription>
              Вкажіть причину відхилення заявки <strong>{rejectTarget?.name}</strong>.
              Заявник побачить цю причину.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Причина відхилення..."
              className="bg-secondary border-border min-h-[100px]"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || isRejecting}
                className="flex-1 bg-destructive hover:bg-destructive/90 gap-2"
              >
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Підтвердити відхилення
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectTarget(null)}
                disabled={isRejecting}
              >
                Скасувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
