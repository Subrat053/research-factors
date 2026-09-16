import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
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
  Activity
} from 'lucide-react';

export function AdminLayout({ children, title, subtitle, actions }) {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || false;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'Core Editorial',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
        { name: 'All Manuscripts', path: '/admin/articles', icon: FileText, exact: true },
        { name: 'Review Queue', path: '/admin/articles/review-queue', icon: Clock }
      ]
    },
    {
      label: 'Taxonomy & Assets',
      items: [
        { name: 'Authors', path: '/admin/authors', icon: UserCheck },
        { name: 'Categories', path: '/admin/categories', icon: FolderTree },
        { name: 'Tags & Merge', path: '/admin/tags', icon: Tags },
        { name: 'Media Assets', path: '/admin/media', icon: Image }
      ]
    },
    {
      label: 'Community & Moderation',
      items: [
        { name: 'Comments', path: '/admin/comments', icon: MessageSquare },
        { name: 'Reports Triage', path: '/admin/reports', icon: Flag },
        { name: 'Contact Inquiries', path: '/admin/contact-messages', icon: Mail }
      ]
    },
    {
      label: 'Governance & Security',
      items: [
        { name: 'User Directory', path: '/admin/users', icon: Users },
        { name: 'Audit Trail', path: '/admin/audit-logs', icon: ScrollText }
      ]
    },
    ...(isSuperAdmin
      ? [
          {
            label: 'Super Admin Systems',
            items: [
              { name: 'Roles & Permissions', path: '/admin/roles', icon: KeyRound },
              { name: 'System Settings', path: '/admin/settings', icon: Settings }
            ]
          }
        ]
      : [])
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/logo-icon.png"
              alt="Research Factors"
              className="w-8 h-8 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-serif font-bold text-white tracking-tight text-base block leading-none">
                Research Factors
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mt-1">
                Editorial Control
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Pill */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            {isSuperAdmin ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <ShieldCheck className="w-3 h-3 mr-1" /> Super Admin
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Staff Admin
              </span>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                {group.label}
              </h4>
              <nav className="space-y-0.5">
                {group.items.map((item, iIdx) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={iIdx}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Magazine</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 bg-slate-950">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="hidden sm:inline">Administration</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-semibold text-slate-100">{title || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Database Connected</span>
            </div>
          </div>
        </header>

        {/* Header Title & Actions Bar */}
        {(title || actions) && (
          <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-slate-800/40 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center space-x-3">{actions}</div>}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
