import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle } from 'lucide-react';

interface BanModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: (reason: string, customNote: string, duration: string) => void;
}

const banReasons = [
  'Спам та реклама',
  'Образи та агресивна поведінка',
  'Непристойна аватарка',
  'Порушення авторських прав',
  'Інше (вписати причину)',
];

const banDurations = [
  { value: '1day', label: '1 день' },
  { value: '1week', label: '1 тиждень' },
  { value: '1month', label: '1 місяць' },
  { value: 'permanent', label: 'Назавжди' },
];

export function BanModal({ open, onClose, userName, onConfirm }: BanModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [duration, setDuration] = useState('1week');

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, customNote, duration);
    // Reset form
    setSelectedReason('');
    setCustomNote('');
    setDuration('1week');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-destructive/30">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Блокування користувача</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Користувач: <span className="font-medium text-foreground">{userName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Reason Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="ban-reason" className="text-sm font-medium">
              Причина блокування <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger 
                id="ban-reason" 
                className={`bg-secondary border-border ${!selectedReason ? 'border-destructive/50' : ''}`}
              >
                <SelectValue placeholder="Оберіть причину..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {banReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Comment Textarea */}
          <div className="space-y-2">
            <Label htmlFor="ban-note" className="text-sm font-medium">
              Додатковий коментар <span className="text-muted-foreground text-xs">(опціонально)</span>
            </Label>
            <Textarea
              id="ban-note"
              placeholder="Додайте детальний опис порушення..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          {/* Duration Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="ban-duration" className="text-sm font-medium">
              Тривалість блокування
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="ban-duration" className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {banDurations.map((dur) => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
          >
            Скасувати
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Підтвердити бан
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
