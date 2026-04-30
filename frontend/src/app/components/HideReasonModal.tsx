import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EyeOff } from 'lucide-react';

interface HideReasonModalProps {
  open: boolean;
  onClose: () => void;
  contentType: 'manga' | 'comment';
  contentTitle: string;
  onConfirm: (reason: string, customNote: string) => void;
}

const mangaHideReasons = [
  'Порушення авторських прав (DMCA)',
  'Непристойна обкладинка / Матеріали 18+ без маркування',
  'Низька якість сканів або перекладу',
  'Реклама сторонніх ресурсів у розділах',
  'Опис/назва не відповідають дійсності',
  'Повторна публікація (дублікат)',
  'Інше (вписати причину)',
];

const commentHideReasons = [
  'Спам, флуд та реклама',
  'Образи, агресія або цькування',
  'Нецензурна та груба лексика',
  'Спойлери без відповідного приховання',
  'Провокація конфліктів (тролінг)',
  'Пропаганда ненависті або дискримінація',
  'Інше (вписати причину)',
];

export function HideReasonModal({ open, onClose, contentType, contentTitle, onConfirm }: HideReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customNote, setCustomNote] = useState('');

  const reasons = contentType === 'manga' ? mangaHideReasons : commentHideReasons;

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, customNote);
    // Reset form
    setSelectedReason('');
    setCustomNote('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <EyeOff className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Приховати {contentType === 'manga' ? 'манґу' : 'коментар'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {contentTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Reason Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="hide-reason" className="text-sm font-medium">
              Причина приховання <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger
                id="hide-reason"
                className={`bg-secondary border-border ${!selectedReason ? 'border-destructive/50' : ''}`}
              >
                <SelectValue placeholder="Оберіть причину..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Comment Textarea */}
          <div className="space-y-2">
            <Label htmlFor="hide-note" className="text-sm font-medium">
              Додатковий коментар <span className="text-muted-foreground text-xs">(опціонально)</span>
            </Label>
            <Textarea
              id="hide-note"
              placeholder="Додайте детальний опис причини приховання..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={3}
            />
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
            className="bg-[#59631f] hover:bg-[#59631f]/90"
          >
            Підтвердити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
