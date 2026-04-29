import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Loader2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  user_id: number;
}

interface CommentsSectionProps {
  chapterId: number | string;
}

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export function CommentsSection({ chapterId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [user, setUser] = useState<{ id: number; role: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchComments();
  }, [chapterId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/chapters/${chapterId}/comments`);
      if (response.ok) {
        const json = await response.json();
        setComments(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Потрібно авторизуватися, щоб залишити коментар');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${apiUrl}/users/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chapter_id: Number(chapterId),
          content: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      } else {
        setError('Не вдалося додати коментар');
      }
    } catch (err) {
      setError('Помилка мережі');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей коментар?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/users/comments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="mt-12 border-t border-border pt-8">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        Коментарі
        <span className="text-sm font-normal text-muted-foreground ml-2">
          {comments.length}
        </span>
      </h2>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Поділіться вашими думками..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] bg-secondary/50 border-border/50 focus:border-primary/50 transition-all resize-none p-4"
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <div className="flex justify-end">
          <Button
            disabled={isSubmitting || !newComment.trim()}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Надіслати
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border/50">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Тут ще немає коментарів. Будьте першим!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border/50">
                  {comment.user?.avatar_url ? (
                    <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {comment.user?.username || 'Користувач'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  {(user?.id === comment.user_id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-sm leading-relaxed border border-border/20">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
