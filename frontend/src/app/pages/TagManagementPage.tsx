import { useState } from 'react';
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

interface Tag {
  id: string;
  name: string;
  category: 'Genre' | 'Theme' | 'Format';
  mangaCount: number;
  isVisible: boolean;
}

const mockTags: Tag[] = [
  { id: '1', name: 'Фентезі', category: 'Genre', mangaCount: 342, isVisible: true },
  { id: '2', name: 'Бойовик', category: 'Genre', mangaCount: 289, isVisible: true },
  { id: '3', name: 'Романтика', category: 'Genre', mangaCount: 256, isVisible: true },
  { id: '4', name: 'Драма', category: 'Genre', mangaCount: 198, isVisible: true },
  { id: '5', name: 'Комедія', category: 'Genre', mangaCount: 167, isVisible: true },
  { id: '6', name: 'Школа', category: 'Theme', mangaCount: 145, isVisible: true },
  { id: '7', name: 'Магія', category: 'Theme', mangaCount: 234, isVisible: true },
  { id: '8', name: 'Дракони', category: 'Theme', mangaCount: 87, isVisible: true },
  { id: '9', name: 'Помста', category: 'Theme', mangaCount: 93, isVisible: true },
  { id: '10', name: 'Подорож у часі', category: 'Theme', mangaCount: 56, isVisible: true },
  { id: '11', name: 'Манхва', category: 'Format', mangaCount: 523, isVisible: true },
  { id: '12', name: 'Манга', category: 'Format', mangaCount: 412, isVisible: true },
  { id: '13', name: 'Веб-комікс', category: 'Format', mangaCount: 178, isVisible: true },
  { id: '14', name: 'Маньхуа', category: 'Format', mangaCount: 89, isVisible: true },
  { id: '15', name: 'Надприродне', category: 'Theme', mangaCount: 67, isVisible: false },
];

const categoryColors = {
  Genre: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Theme: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Format: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function TagManagementPage() {
  const [tags, setTags] = useState<Tag[]>(mockTags);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<'Genre' | 'Theme' | 'Format'>('Genre');

  const handleToggleVisibility = (tagId: string) => {
    setTags(prev =>
      prev.map(tag =>
        tag.id === tagId ? { ...tag, isVisible: !tag.isVisible } : tag
      )
    );
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag: Tag = {
      id: (tags.length + 1).toString(),
      name: newTagName,
      category: newTagCategory,
      mangaCount: 0,
      isVisible: true,
    };
    
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setNewTagCategory('Genre');
    setIsAddModalOpen(false);
  };

  const handleEditTag = () => {
    if (!editingTag || !newTagName.trim()) return;
    
    setTags(prev =>
      prev.map(tag =>
        tag.id === editingTag.id
          ? { ...tag, name: newTagName, category: newTagCategory }
          : tag
      )
    );
    
    setEditingTag(null);
    setNewTagName('');
    setNewTagCategory('Genre');
    setIsEditModalOpen(false);
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цей тег?')) {
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    }
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagCategory(tag.category);
    setIsEditModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tags className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold">Налаштування тегів</h1>
                <p className="text-muted-foreground">
                  Управління тегами, жанрами та категоріями платформи
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#59631f] hover:bg-[#59631f]/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              Додати новий тег
            </Button>
          </div>
          <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Tags Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/20">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Назва тегу
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Категорія
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Кількість манг
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">
                    Статус
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground w-32">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium">{tag.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[tag.category]}`}>
                        {tag.category === 'Genre' ? 'Жанр' : tag.category === 'Theme' ? 'Тема' : 'Формат'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-muted-foreground">{tag.mangaCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleVisibility(tag.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tag.isVisible ? 'bg-[#59631f]' : 'bg-secondary'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tag.isVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                        <span className="sr-only">
                          {tag.isVisible ? 'Видимий' : 'Прихований'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(tag)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Редагувати</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Видалити</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="flex justify-end gap-2 opacity-20 mt-8">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 18C4 18 10 14 14 6C14 6 18 10 14 18C10 18 4 18 4 18Z" fill="#59631f" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 22C5 22 12 17 16 8C16 8 21 13 16 22C12 22 5 22 5 22Z" fill="#59631f" />
          </svg>
        </div>
      </div>

      {/* Add Tag Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Додати новий тег
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Назва тегу</Label>
              <Input
                id="tag-name"
                placeholder="Введіть назву тегу..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-category">Категорія</Label>
              <Select value={newTagCategory} onValueChange={(value: 'Genre' | 'Theme' | 'Format') => setNewTagCategory(value)}>
                <SelectTrigger id="tag-category" className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Genre">Жанр</SelectItem>
                  <SelectItem value="Theme">Тема</SelectItem>
                  <SelectItem value="Format">Формат</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={handleAddTag}
              disabled={!newTagName.trim()}
              className="bg-[#59631f] hover:bg-[#59631f]/90"
            >
              Додати тег
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Редагувати тег
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Назва тегу</Label>
              <Input
                id="edit-tag-name"
                placeholder="Введіть назву тегу..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tag-category">Категорія</Label>
              <Select value={newTagCategory} onValueChange={(value: 'Genre' | 'Theme' | 'Format') => setNewTagCategory(value)}>
                <SelectTrigger id="edit-tag-category" className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Genre">Жанр</SelectItem>
                  <SelectItem value="Theme">Тема</SelectItem>
                  <SelectItem value="Format">Формат</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={handleEditTag}
              disabled={!newTagName.trim()}
              className="bg-[#59631f] hover:bg-[#59631f]/90"
            >
              Зберегти зміни
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}