import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { ScrollToTop } from './components/common/ScrollToTop.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { PageLoadingFallback } from './components/feedback/SkeletonLoader.jsx';

function EditorRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/admin/editor/${id}` : '/admin/editor'} replace />;
}

// 1. Public Pages (Lazy Loaded)
const HomePage = lazy(() => import('./pages/public/HomePage.jsx'));
const ResearchListingPage = lazy(() => import('./pages/public/ResearchListingPage.jsx'));
const ArticleDetailPage = lazy(() => import('./pages/public/ArticleDetailPage.jsx'));
const CategoryPage = lazy(() => import('./pages/public/CategoryPage.jsx'));
const BookmarksPage = lazy(() => import('./pages/public/BookmarksPage.jsx'));
const SponsorshipPage = lazy(() => import('./pages/public/SponsorshipPage.jsx'));
const AboutPage = lazy(() => import('./pages/public/AboutPage.jsx'));
const ContactPage = lazy(() => import('./pages/public/ContactPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage.jsx'));
const TermsPage = lazy(() => import('./pages/public/TermsPage.jsx'));
const CookiePolicyPage = lazy(() => import('./pages/public/CookiePolicyPage.jsx'));
const EditorialGuidelinesPage = lazy(() => import('./pages/public/EditorialGuidelinesPage.jsx'));

// 2. Authentication Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));

// 3. Authoring Manuscript Studio (Lazy Loaded)
const ArticleEditorPage = lazy(() => import('./pages/author/ArticleEditorPage.jsx'));
const ArticlePreviewPage = lazy(() => import('./pages/author/ArticlePreviewPage.jsx'));

// 4. Editorial Admin & Governance Backoffice (Lazy Loaded)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const ArticleManagementPage = lazy(() => import('./pages/admin/ArticleManagementPage.jsx'));
const ArticleReviewQueuePage = lazy(() => import('./pages/admin/ArticleReviewQueuePage.jsx'));
const ModerationQueuePage = lazy(() => import('./pages/admin/ModerationQueuePage.jsx'));
const ReportTriagePage = lazy(() => import('./pages/admin/ReportTriagePage.jsx'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage.jsx'));
const AuthorManagementPage = lazy(() => import('./pages/admin/AuthorManagementPage.jsx'));
const CategoryManagementPage = lazy(() => import('./pages/admin/CategoryManagementPage.jsx'));
const TagManagementPage = lazy(() => import('./pages/admin/TagManagementPage.jsx'));
const MediaLibraryPage = lazy(() => import('./pages/admin/MediaLibraryPage.jsx'));
const ContactMessagesPage = lazy(() => import('./pages/admin/ContactMessagesPage.jsx'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage.jsx'));
const RolesPermissionsPage = lazy(() => import('./pages/admin/RolesPermissionsPage.jsx'));
const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage.jsx'));
const SeoAuditPage = lazy(() => import('./pages/admin/SeoAuditPage.jsx'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage.jsx'));

// 5. Development-Only Agentation (100% Tree-shaken from Production Builds)
const DevAgentation = lazy(() =>
  import.meta.env.DEV
    ? import('agentation').then(mod => ({ default: mod.Agentation }))
    : Promise.resolve({ default: () => null })
);

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
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ModalProvider>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                <ScrollToTop />
                {/* Visual Feedback for AI Development - DEV only */}
                {import.meta.env.DEV && (
                  <Suspense fallback={null}>
                    <DevAgentation />
                  </Suspense>
                )}
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    {/* Public Magazine Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/research" element={<ResearchListingPage />} />
                    <Route path="/categories/:categorySlug" element={<CategoryPage />} />
                    <Route path="/sponsorship" element={<SponsorshipPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                    <Route path="/editorial-guidelines" element={<EditorialGuidelinesPage />} />

                    {/* Category-Scoped Dynamic Article Route (e.g. /rf/:categorySlug/:slug) */}
                    <Route path="/:categorySlug/:slug" element={<ArticleDetailPage />} />

                    {/* Backward-Compatible Article Routes */}
                    <Route path="/research/:slug" element={<ArticleDetailPage />} />
                    <Route path="/articles/:slug" element={<ArticleDetailPage />} />
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
                    <Route path="/editor" element={<Navigate to="/admin/editor" replace />} />
                    <Route path="/editor/:id" element={<EditorRedirect />} />
                    <Route
                      path="/admin/editor"
                      element={
                        <ProtectedRoute requiredPermission="article.create">
                          <ArticleEditorPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/editor/:id"
                      element={
                        <ProtectedRoute requiredPermission="article.create">
                          <ArticleEditorPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/research/preview/:id"
                      element={
                        <ProtectedRoute
                          requiredAnyPermission={['article.create', 'article.update_own', 'article.approve']}
                        >
                          <ArticlePreviewPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Editorial Admin & Author Backoffice */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute
                          requiredAnyPermission={[
                            'article.create',
                            'article.update_own',
                            'article.approve',
                            'comment.moderate',
                            'user.read_list',
                            'author.approve',
                            'category.manage',
                            'tag.manage',
                            'media.manage',
                            'contact.manage',
                            'audit.read',
                            'role.manage',
                            'setting.manage'
                          ]}
                        >
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/articles"
                      element={
                        <ProtectedRoute requiredAnyPermission={['article.create', 'article.update_own', 'article.approve']}>
                          <ArticleManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/articles/review"
                      element={
                        <ProtectedRoute requiredPermission="article.approve">
                          <ArticleReviewQueuePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/moderation"
                      element={
                        <ProtectedRoute requiredPermission="comment.moderate">
                          <ModerationQueuePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/moderation/reports"
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
                    <Route
                      path="/admin/roles"
                      element={
                        <ProtectedRoute requiredPermission="role.manage">
                          <RolesPermissionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute requiredPermission="setting.manage">
                          <SystemSettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/seo"
                      element={
                        <ProtectedRoute requiredPermission="setting.manage">
                          <SeoAuditPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/profile"
                      element={
                        <ProtectedRoute>
                          <AdminProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Fallback */}
                    <Route
                      path="*"
                      element={
                        <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-center">
                          <div>
                            <h2 className="text-4xl font-bold text-ink-darkest mb-2">404</h2>
                            <p className="text-sm text-ink-muted mb-6">The editorial page you are looking for does not exist.</p>
                            <Link to="/" className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700">
                              Return Home
                            </Link>
                          </div>
                        </div>
                      }
                    />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ModalProvider>
          </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
