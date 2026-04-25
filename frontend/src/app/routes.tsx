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
import { TagManagementPage } from './pages/TagManagementPage';
import { TeamApplicationsPage } from './pages/TeamApplicationsPage';
import { Layout } from './components/Layout';

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
          path: 'profile',
          element: <ProfilePage />,
        },
        // Author workspace routes
        {
          path: '/author/teams',
          element: <TeamDashboardPage />,
        },
        {
          path: '/author/projects',
          element: <AuthorProjectsPage />,
        },
        {
          path: '/author/manga/new',
          element: <MangaEditorPage />,
        },
        {
          path: '/author/manga/:id/edit',
          element: <MangaEditorPage />,
        },
        {
          path: '/author/manga/:id/chapter/new',
          element: <ChapterUploadPage />,
        },
        {
          path: '/author/analytics',
          element: <AuthorAnalyticsPage />,
        },
        {
          path: '/author/settings',
          element: <div className="p-8">Settings Page - Coming Soon</div>,
        },
        // Admin workspace routes
        {
          path: '/admin/dashboard',
          element: <AdminDashboardPage />,
        },
        {
          path: '/admin/users',
          element: <UserManagementPage />,
        },
        {
          path: '/admin/content',
          element: <ContentModerationPage />,
        },
        {
          path: '/admin/logs',
          element: <ModerationLogsPage />,
        },
        {
          path: '/admin/tags',
          element: <TagManagementPage />,
        },
        {
          path: '/admin/team-applications',
          element: <TeamApplicationsPage />,
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