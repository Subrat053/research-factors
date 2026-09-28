import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { adminApi } from '../../services/admin.api.js';
import { LOGO_URL, LOGO_WHITE_URL } from '../../services/media.api.js';
import {
  LayoutDashboard,
  FileText,
  Clock,
  Users,
  UserCheck,
  FolderTree,
  Tags,
  Image,
  MessageSquare,
  Flag,
  Mail,
  KeyRound,
  Settings,
  ScrollText,
  LogOut,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Activity,
  PenTool,
  Sun,
  Moon,
  Globe,
  Bookmark
} from 'lucide-react';

export function AdminLayout({ children, title, subtitle, actions }) {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sidebar scroll persistence
  const navContainerRef = useRef(null);
  const activeLinkRef = useRef(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('admin_sidebar_scroll');
    if (savedScroll !== null && navContainerRef.current) {
      navContainerRef.current.scrollTop = Number(savedScroll);
    } else if (activeLinkRef.current) {
      activeLinkRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [location.pathname]);

  const handleNavScroll = (e) => {
    sessionStorage.setItem('admin_sidebar_scroll', e.currentTarget.scrollTop);
  };

  const primaryRole = user?.roles?.[0]?.replace(/_/g, ' ') || 'Staff';
  const isSuperAdmin = user?.isSuperAdmin || user?.roles?.includes('SUPER_ADMIN');

  // Dynamic backend health & port query: exclusively displayed for Super Admin
  const { data: healthData, isError: isHealthError } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    enabled: !!isSuperAdmin,
    refetchInterval: 30000,
    staleTime: 15000
  });
  const backendPort = healthData?.data?.system?.port || '5005';

  const canModerateArticles = hasPermission('article.approve') || hasPermission('article.update_any');
  const canCreateArticles = hasPermission('article.create') || hasPermission('article.update_own');
  const articlesLabel = canModerateArticles ? 'All Articles' : 'My Articles';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = [
    {
      items: [
        {
          name: 'Dashboard',
          path: '/admin',
          icon: LayoutDashboard,
          exact: true,
          permissionCheck: () => hasAnyPermission([
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
          ])
        },
        { name: 'Profile', path: '/admin/profile', icon: UserCheck },
        { name: 'Saved Research', path: '/admin/bookmarks', icon: Bookmark }
      ]
    },
    {
      label: 'Users Management',
      items: [
        { name: 'User', path: '/admin/users', icon: Users, permission: 'user.read_list' },
        { name: 'Authors', path: '/admin/authors', icon: UserCheck, permission: 'author.approve' },
        { name: 'Roles & Permissions', path: '/admin/roles', icon: KeyRound, permission: 'role.manage' },
      ]
    },
    {
      label: 'Core Editorial',
      items: [
        // { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
        { name: 'Write Article', path: '/admin/editor', icon: PenTool, permission: 'article.create' },
        {
          name: articlesLabel,
          path: '/admin/articles',
          icon: FileText,
          exact: true,
          permissionCheck: () => canModerateArticles || canCreateArticles
        },
        { name: 'Manage Articles', path: '/admin/articles/review-queue', icon: Clock, permission: 'article.approve' }
      ]
    },
    {
      label: 'Taxonomy & Assets',
      items: [
        // { name: 'Authors', path: '/admin/authors', icon: UserCheck, permission: 'author.approve' },
        { name: 'Categories', path: '/admin/categories', icon: FolderTree, permission: 'category.manage' },
        { name: 'Tags & Merge', path: '/admin/tags', icon: Tags, permission: 'tag.manage' },
        {
          name: 'Media Assets',
          path: '/admin/media',
          icon: Image,
          permissionCheck: () => hasPermission('media.manage')
        }
      ]
    },
    {
      label: 'Moderation',
      items: [
        { name: 'Comments', path: '/admin/comments', icon: MessageSquare, permission: 'comment.moderate' },
        { name: 'Reports Triage', path: '/admin/reports', icon: Flag, permission: 'comment.moderate' },
        { name: 'Contact Inquiries', path: '/admin/contact-messages', icon: Mail, permission: 'contact.manage' }
      ]
    },
    {
      label: 'System & Security',
      items: [
        // { name: 'Roles & Permissions', path: '/admin/roles', icon: KeyRound, permission: 'role.manage' },
        { name: 'System Settings', path: '/admin/settings', icon: Settings, permission: 'setting.manage' },
        { name: 'SEO Governance', path: '/admin/seo', icon: Globe, permission: 'setting.manage' },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText, permission: 'audit.read' },
      ]
    },
  ];

  // Dynamic RBAC: Filter navigation groups & items strictly by user's active permissions
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.permissionCheck) {
          return item.permissionCheck();
        }
        if (item.permission) {
          return hasPermission(item.permission);
        }
        return true;
      })
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          <Link to="/" className="flex items-center group py-1 shrink-0" aria-label="Research Factors Home">
            <img
              src={isDark ? LOGO_WHITE_URL : LOGO_URL}
              alt="Research Factors"
              className="h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[195px] object-contain transition-opacity duration-200 group-hover:opacity-90 shrink-0"
            />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer transition-colors"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Pill */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">
                  {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30">
              <ShieldCheck className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" /> {primaryRole}
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div
          ref={navContainerRef}
          onScroll={handleNavScroll}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
        >
          {visibleNavGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                {group.label}
              </h4>
              <nav className="space-y-0.5">
                {group.items.map((item, iIdx) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={iIdx}
                      ref={active ? activeLinkRef : null}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-600/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Go to Homepage</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </Link>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {/* Quick theme toggle in footer */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center lg:hidden mr-1 shrink-0" aria-label="Research Factors Home">
              <img
                src={isDark ? LOGO_WHITE_URL : LOGO_URL}
                alt="Research Factors"
                className="h-6 sm:h-7 w-auto max-w-[130px] sm:max-w-[150px] object-contain"
              />
            </Link>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="hidden md:inline">Administration</span>
              <span className="hidden md:inline">/</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{title || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {hasPermission('article.create') && !location.pathname.startsWith('/admin/editor') && (
              <Link
                to="/admin/editor"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Write Article</span>
              </Link>
            )}
            {isSuperAdmin && (
              <div
                title={isHealthError ? 'Backend server unreachable' : `Connected to API on port ${backendPort}`}
                className={`flex items-center space-x-2 text-[11px] font-medium border px-2.5 py-1 rounded-full shadow-xs transition-colors ${
                  isHealthError
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isHealthError ? 'bg-red-500 dark:bg-red-400' : 'bg-emerald-600 dark:bg-emerald-400 animate-pulse'}`} />
                <span>{isHealthError ? 'Backend Offline' : `Port: ${backendPort}`}</span>
              </div>
            )}
          </div>
        </header>

        {/* Header Title & Actions Bar */}
        {(title || actions) && (
          <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800/40 bg-slate-100/50 dark:bg-slate-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center space-x-3">{actions}</div>}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full text-slate-800 dark:text-slate-100 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
