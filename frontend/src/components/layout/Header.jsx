import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { SearchModal } from '../search/SearchModal.jsx';
import {
  Search,
  PenTool,
  Bookmark,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout, hasPermission } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-paper-border bg-white/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* 1. Left Masthead Branding */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center group py-1">
              <img
                src="/logo.png"
                alt="Research Factors — Research. Read. Share."
                className="h-10 sm:h-11 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/"
                className={`transition-colors ${
                  isActive('/') ? 'text-rfblue font-semibold' : 'text-ink-muted hover:text-ink-darkest'
                }`}
              >
                Home
              </Link>
              <Link
                to="/research"
                className={`transition-colors ${
                  isActive('/research') ? 'text-rfblue font-semibold' : 'text-ink-muted hover:text-ink-darkest'
                }`}
              >
                All Research
              </Link>
              <Link
                to="/research?category=technology"
                className="text-ink-muted hover:text-ink-darkest transition-colors"
              >
                Technology
              </Link>
              <Link
                to="/research?category=science"
                className="text-ink-muted hover:text-ink-darkest transition-colors"
              >
                Science
              </Link>
              <Link
                to="/research?sort=popular"
                className="text-ink-muted hover:text-ink-darkest transition-colors"
              >
                Trending
              </Link>
            </nav>
          </div>

          {/* 2. Right Actions (Search + Auth) */}
          <div className="flex items-center space-x-4">
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-paper-border bg-paper hover:bg-paper-warm text-ink-light hover:text-ink text-xs transition-colors"
              title="Search articles (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded border border-paper-border">
                ⌘K
              </kbd>
            </button>

            {/* User Account / Navigation */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-full hover:bg-paper transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-rfblue text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-ink-darkest">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-light" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-paper-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-paper-border/60">
                      <p className="text-xs font-bold text-ink-darkest truncate">{user?.fullName}</p>
                      <p className="text-[11px] text-ink-light truncate">{user?.email}</p>
                    </div>

                    {/* Write Article Link (if permitted) */}
                    {hasPermission('article.create') && (
                      <Link
                        to="/author/articles/create"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-rfblue hover:bg-rfblue-50 transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5 mr-2" />
                        Write Research Article
                      </Link>
                    )}

                    {/* Admin Link (if admin) */}
                    {(user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN')) && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-ink-darkest hover:bg-paper transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 mr-2 text-rfred" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/account/bookmarks"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-xs text-ink-muted hover:bg-paper transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 mr-2" />
                      Saved Research
                    </Link>

                    <Link
                      to="/account/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-xs text-ink-muted hover:bg-paper transition-colors"
                    >
                      <User className="w-3.5 h-3.5 mr-2" />
                      Profile & Account
                    </Link>

                    <div className="border-t border-paper-border/60 my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs text-rfred hover:bg-rfred-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-ink-muted hover:text-rfblue transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700 rounded-full shadow-xs transition-colors"
                >
                  Join Platform
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-ink-muted hover:text-ink focus:outline-none"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-paper-border bg-white px-4 pt-2 pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-sm font-medium text-ink"
            >
              Home
            </Link>
            <Link
              to="/research"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-sm font-medium text-ink"
            >
              All Research
            </Link>
            <Link
              to="/research?category=technology"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-sm font-medium text-ink"
            >
              Technology
            </Link>
            <Link
              to="/research?category=science"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-sm font-medium text-ink"
            >
              Science
            </Link>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
