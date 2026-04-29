import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Upload, GripVertical, X, Eye, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AuthorLayout } from '../components/AuthorLayout';

interface PageImage {
  id: string;
  file: File;
  preview: string;
  order: number;
}

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function ChapterUploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [volume, setVolume] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pages, setPages] = useState<PageImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newPages: PageImage[] = [];
    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newPages.push({
          id: `${Date.now()}-${index}`,
          file,
          preview,
          order: pages.length + index + 1,
        });
      }
    });

    setPages(prev => [...prev, ...newPages]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleRemovePage = (pageId: string) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      // Reorder remaining pages
      return filtered.map((page, index) => ({
        ...page,
        order: index + 1,
      }));
    });
  };

  const handleReorder = (pageId: string, direction: 'up' | 'down') => {
    setPages(prev => {
      const index = prev.findIndex(p => p.id === pageId);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.length - 1)
      ) {
        return prev;
      }

      const newPages = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newPages[index], newPages[swapIndex]] = [newPages[swapIndex], newPages[index]];

      return newPages.map((page, idx) => ({
        ...page,
        order: idx + 1,
      }));
    });
  };

  const handlePublish = async () => {
    if (!chapterNumber || pages.length === 0) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      // 1. Upload pages
      const formData = new FormData();
      formData.append('manga_id', id || '');
      formData.append('chapter_number', chapterNumber);
      pages.forEach(p => {
        formData.append('pages', p.file);
      });

      const uploadRes = await fetch(`${apiUrl}/author/chapter/pages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload pages');
      }

      const { urls } = await uploadRes.json();

      // 2. Create chapter record
      const chapterRes = await fetch(`${apiUrl}/author/chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          manga_id: parseInt(id || '0'),
          volume: volume ? parseInt(volume) : null,
          chapter_number: parseFloat(chapterNumber),
          title: chapterTitle,
          pages_url: JSON.stringify(urls),
        }),
      });

      if (!chapterRes.ok) {
        const errData = await chapterRes.json();
        throw new Error(errData.error || 'Failed to create chapter');
      }

      // Success! Navigate back to manga projects or detail
      navigate(`/author/projects`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    console.log('Opening preview...');
  };

  return (
    <AuthorLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Завантаження розділу</h1>
          <p className="text-muted-foreground">
            Додайте новий розділ до вашого проєкту
          </p>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent mt-4" />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Chapter Info Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6">Інформація про розділ</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Volume */}
            <div className="space-y-2">
              <Label htmlFor="volume" className="text-sm font-semibold">
                Том
              </Label>
              <Input
                id="volume"
                type="number"
                placeholder="1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="bg-secondary border-border"
                min="0"
              />
            </div>

            {/* Chapter Number */}
            <div className="space-y-2">
              <Label htmlFor="chapter-number" className="text-sm font-semibold">
                Номер розділу <span className="text-destructive">*</span>
              </Label>
              <Input
                id="chapter-number"
                type="number"
                step="0.1"
                placeholder="10.5"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                className="bg-secondary border-border"
                required
              />
            </div>

            {/* Chapter Title */}
            <div className="space-y-2">
              <Label htmlFor="chapter-title" className="text-sm font-semibold">
                Назва розділу
              </Label>
              <Input
                id="chapter-title"
                placeholder="Необов'язково"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6">Сторінки розділу</h2>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {/* Decorative leaf patterns */}
            <div className="absolute top-6 left-6 opacity-10 pointer-events-none">
              <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                <path d="M10 45C10 45 25 35 35 15C35 15 45 25 35 45C25 45 10 45 10 45Z" fill="#59631f" />
              </svg>
            </div>
            <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M12 54C12 54 30 42 42 18C42 18 54 30 42 54C30 54 12 54 12 54Z" fill="#59631f" />
              </svg>
            </div>

            <label htmlFor="page-upload" className="cursor-pointer block p-16 text-center relative z-10">
              <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium mb-2">
                Перетягніть архів або зображення сюди
              </p>
              <p className="text-muted-foreground mb-4">
                або клікніть для вибору файлів
              </p>
              <p className="text-sm text-muted-foreground">
                Підтримуються: PNG, JPG, ZIP архіви. Максимум 100 файлів
              </p>
            </label>
            <input
              id="page-upload"
              type="file"
              accept="image/*,.zip"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Page Management Grid */}
        {pages.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                Порядок сторінок ({pages.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                Перетягніть для зміни порядку
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className="relative group bg-secondary rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors"
                >
                  {/* Page Number Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                    {page.order}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemovePage(page.id)}
                    className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Image Preview */}
                  <div className="aspect-[2/3] overflow-hidden">
                    <img
                      src={page.preview}
                      alt={`Page ${page.order}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Reorder Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReorder(page.id, 'up')}
                      disabled={index === 0}
                      className="p-1 bg-secondary hover:bg-primary transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      onClick={() => handleReorder(page.id, 'down')}
                      disabled={index === pages.length - 1}
                      className="p-1 bg-secondary hover:bg-primary transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 opacity-20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 22C5 22 12 17 16 8C16 8 21 13 16 22C12 22 5 22 5 22Z" fill="#59631f" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
              </svg>
            </div>

            <div className="flex gap-3">
              {/* <Button
                variant="outline"
                onClick={handlePreview}
                className="border-[#aeba68] text-[#aeba68] hover:bg-[#aeba68]/10 px-6"
                disabled={pages.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Попередній перегляд
              </Button> */}
              <Button
                onClick={handlePublish}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                disabled={!chapterNumber || pages.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Публікація...
                  </>
                ) : (
                  'Опублікувати розділ'
                )}
              </Button>
            </div>
          </div>

          {pages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Завантажте хоча б одну сторінку перед публікацією
            </p>
          )}
        </div>
      </div>
    </AuthorLayout>
  );
}
