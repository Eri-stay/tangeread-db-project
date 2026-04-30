import { createBrowserRouter } from 'react-router';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { ProfilePage } from './pages/ProfilePage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { MangaEditorPage } from './pages/MangaEditorPage';
import { ChapterUploadPage } from './pages/ChapterUploadPage';
import { AuthorProjectsPage } from './pages/AuthorProjectsPage';
import { AuthorAnalyticsPage } from './pages/AuthorAnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ContentModerationPage } from './pages/ContentModerationPage';
import { ModerationLogsPage } from './pages/ModerationLogsPage';
import { TeamApplicationsPage } from './pages/TeamApplicationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

export const createAppRouter = () => {
  return createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'catalog',
          element: <CatalogPage />,
        },
        {
          path: 'manga/:id',
          element: <MangaDetailPage />,
        },
        {
          path: 'unauthorized',
          element: <UnauthorizedPage />,
        },
        // Requires any login
        {
          path: 'profile',
          element: (
            <ProtectedRoute requireAuth>
              <ProfilePage />
            </ProtectedRoute>
          ),
        },
        // Author workspace — author or admin only
        {
          path: '/author/teams',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <TeamDashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/author/projects',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <AuthorProjectsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/author/manga/new',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <MangaEditorPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/author/manga/:id/edit',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <MangaEditorPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/author/manga/:id/chapter/new',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <ChapterUploadPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/author/analytics',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <AuthorAnalyticsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/author/settings',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['author', 'admin']}>
              <div className="p-8">Settings Page - Coming Soon</div>
            </ProtectedRoute>
          ),
        },
        // Admin workspace — admin only
        {
          path: '/admin/dashboard',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/users',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/team-applications',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['admin']}>
              <TeamApplicationsPage />
            </ProtectedRoute>
          ),
        },
        // Moderation — admin or moderator
        {
          path: '/admin/content',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['admin', 'moderator']}>
              <ContentModerationPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin/logs',
          element: (
            <ProtectedRoute requireAuth allowedRoles={['admin', 'moderator']}>
              <ModerationLogsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
    {
      // Reader page without main header/layout
      path: '/read/:id/:chapter',
      element: <ReaderPage />,
    },
  ]);
};