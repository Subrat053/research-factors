import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Agentation } from 'agentation';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';

// Public Pages
import HomePage from './pages/public/HomePage.jsx';
import ResearchListingPage from './pages/public/ResearchListingPage.jsx';
import ArticleDetailPage from './pages/public/ArticleDetailPage.jsx';
import CategoryPage from './pages/public/CategoryPage.jsx';
import BookmarksPage from './pages/public/BookmarksPage.jsx';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// Authoring Manuscript Studio
import ArticleEditorPage from './pages/author/ArticleEditorPage.jsx';

// Editorial Admin & Governance Backoffice
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import ArticleManagementPage from './pages/admin/ArticleManagementPage.jsx';
import ArticleReviewQueuePage from './pages/admin/ArticleReviewQueuePage.jsx';
import ModerationQueuePage from './pages/admin/ModerationQueuePage.jsx';
import ReportTriagePage from './pages/admin/ReportTriagePage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import AuthorManagementPage from './pages/admin/AuthorManagementPage.jsx';
import CategoryManagementPage from './pages/admin/CategoryManagementPage.jsx';
import TagManagementPage from './pages/admin/TagManagementPage.jsx';
import MediaLibraryPage from './pages/admin/MediaLibraryPage.jsx';
import ContactMessagesPage from './pages/admin/ContactMessagesPage.jsx';
import AuditLogsPage from './pages/admin/AuditLogsPage.jsx';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage.jsx';
import SystemSettingsPage from './pages/admin/SystemSettingsPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            {/* Visual Feedback for AI Development */}
            {import.meta.env.DEV && <Agentation />}
            <Routes>
              {/* Public Magazine Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/research" element={<ResearchListingPage />} />
              <Route path="/research/:slug" element={<ArticleDetailPage />} />
              <Route path="/articles/:slug" element={<ArticleDetailPage />} />
              <Route path="/categories/:categorySlug" element={<CategoryPage />} />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <BookmarksPage />
                  </ProtectedRoute>
                }
              />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Authoring Manuscript Studio */}
              <Route
                path="/editor"
                element={
                  <ProtectedRoute requiredPermission="article.create">
                    <ArticleEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editor/:id"
                element={
                  <ProtectedRoute requiredPermission="article.create">
                    <ArticleEditorPage />
                  </ProtectedRoute>
                }
              />

              {/* Editorial Admin Backoffice */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredPermission="article.approve">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/articles"
                element={
                  <ProtectedRoute requiredPermission="article.approve">
                    <ArticleManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/articles/review-queue"
                element={
                  <ProtectedRoute requiredPermission="article.approve">
                    <ArticleReviewQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/comments"
                element={
                  <ProtectedRoute requiredPermission="comment.moderate">
                    <ModerationQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requiredPermission="comment.moderate">
                    <ReportTriagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredPermission="user.read_list">
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/authors"
                element={
                  <ProtectedRoute requiredPermission="author.approve">
                    <AuthorManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute requiredPermission="category.manage">
                    <CategoryManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tags"
                element={
                  <ProtectedRoute requiredPermission="tag.manage">
                    <TagManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/media"
                element={
                  <ProtectedRoute requiredPermission="media.manage">
                    <MediaLibraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contact-messages"
                element={
                  <ProtectedRoute requiredPermission="contact.manage">
                    <ContactMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute requiredPermission="audit.read">
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Exclusive Systems */}
              <Route
                path="/admin/roles"
                element={
                  <ProtectedRoute requiredRole="SUPER_ADMIN">
                    <RolesPermissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole="SUPER_ADMIN">
                    <SystemSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-center">
                    <div>
                      <h2 className="text-4xl font-serif font-bold text-ink-darkest mb-2">404</h2>
                      <p className="text-sm text-ink-muted mb-6">The editorial page you are looking for does not exist.</p>
                      <a href="/" className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700">
                        Return Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
