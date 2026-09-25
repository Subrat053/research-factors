import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import { authApi } from '../../services/auth.api.js';
import { articlesApi } from '../../services/articles.api.js';
import { LOGO_URL } from '../../services/media.api.js';
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
  ChevronDown,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout, hasPermission, hasAnyPermission } = useAuth();
  const confirm = useConfirm();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const categoryHoverTimeoutRef = useRef(null);
  const location = useLocation();

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    const ok = await confirm({
      title: 'Are you sure?',
      message: 'You can always log in later to your account.',
      confirmText: 'Yes, Logout',
      cancelText: 'No',
      variant: 'danger'
    });
    if (ok) {
      logout();
    }
  };

  const handleCategoryMouseEnter = () => {
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }
    setIsCategoryOpen(true);
  };

  const handleCategoryMouseLeave = () => {
    categoryHoverTimeoutRef.current = setTimeout(() => {
      setIsCategoryOpen(false);
    }, 150);
  };

  const { data: publicSettingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => authApi.getPublicSettings(),
    staleTime: 60 * 1000
  });
  const allowRegistration = publicSettingsData?.data?.allowRegistration ?? true;

  // Fetch dynamic categories for Category dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 5 * 60 * 1000
  });
  const categories = categoriesData?.data || [
    { id: 'tech', name: 'Technology', slug: 'technology', description: 'AI, software, gadgets & semiconductors' },
    { id: 'biz', name: 'Business', slug: 'business', description: 'Markets, startups, strategy & enterprise' },
    { id: 'sci', name: 'Science', slug: 'science', description: 'Space, empirical research & developments' },
    { id: 'life', name: 'Lifestyle', slug: 'lifestyle', description: 'Travel, food, health & wellness' },
    { id: 'pol', name: 'Policy', slug: 'policy', description: 'Governance, economics & global policy' }
  ];

  const ADMIN_PERMISSIONS = [
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
  ];

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close drawer and dropdown on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoryOpen(false);
    setIsMobileCategoryOpen(false);
  }, [location.pathname]);

  // Clean up category hover timer on unmount
  useEffect(() => {
    return () => {
      if (categoryHoverTimeoutRef.current) {
        clearTimeout(categoryHoverTimeoutRef.current);
      }
    };
  }, []);

  // Global keyboard shortcuts: '/' or Cmd+K / Ctrl+K for search, Escape to close modals/drawers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsCategoryOpen(false);
        setIsSearchOpen(false);
        return;
      }

      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close desktop Category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-paper-border bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between">
            {/* 1. LEFT: Brand Masthead Logo */}
            <div className="flex items-center shrink-0 lg:flex-1 lg:justify-start">
              <Link to="/" className="flex items-center py-1 shrink-0" aria-label="Research Factors Home">
                <img
                  src={LOGO_URL}
                  alt="Research Factors — Research. Read. Share."
                  className="h-8 sm:h-10 w-auto object-contain transition-opacity duration-200 hover:opacity-90 shrink-0"
                />
              </Link>
            </div>

            {/* 2. MIDDLE: Desktop Navigation Links (Centered) */}
            <nav className="hidden lg:flex items-center justify-center space-x-6 xl:space-x-8 text-sm font-medium text-ink-muted shrink-0">
              <Link
                to="/"
                className={`py-1.5 transition-colors ${
                  isActive('/') ? 'text-rfblue font-semibold' : 'hover:text-ink-darkest'
                }`}
              >
                Home
              </Link>

              {/* Merged "Category" Item (Click -> /research, Hover -> Dynamic Categories Dropdown) */}
              <div
                className="relative"
                ref={categoryDropdownRef}
                onMouseEnter={handleCategoryMouseEnter}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <Link
                  to="/research"
                  className={`flex items-center py-1.5 transition-colors ${
                    location.pathname.startsWith('/research') ||
                    location.pathname.startsWith('/categories') ||
                    isCategoryOpen
                      ? 'text-rfblue font-semibold'
                      : 'hover:text-ink-darkest'
                  }`}
                  aria-expanded={isCategoryOpen}
                  aria-haspopup="true"
                >
                  <span>Category</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                      isCategoryOpen ? 'rotate-180 text-rfblue' : ''
                    }`}
                  />
                </Link>

                {/* Dropdown Menu on Hover with Smooth Framer Motion Animations */}
                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div
                      key="category-dropdown"
                      initial={{ opacity: 0, y: 8, scale: 0.96, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                      exit={{ opacity: 0, y: 6, scale: 0.96, x: '-50%' }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 top-full pt-1.5 w-80 z-50 pointer-events-auto"
                    >
                      <div className="rounded-xl bg-white shadow-xl border border-paper-border py-2.5 overflow-hidden">
                        {/* <div className="px-3.5 py-1.5 border-b border-paper-border/60 text-xs font-bold uppercase tracking-wider text-ink-light flex items-center justify-between">
                          <span>Research Categories</span>
                          <Link
                            to="/research"
                            onClick={() => setIsCategoryOpen(false)}
                            className="text-[11px] font-semibold text-rfblue hover:underline lowercase tracking-normal"
                          >
                            all research
                          </Link>
                        </div> */}
                        <div className="p-1.5 max-h-[360px] overflow-y-auto space-y-0.5">
                          {categories.map((cat) => (
                            <Link
                              key={cat.id || cat.slug}
                              to={`/categories/${cat.slug}`}
                              onClick={() => setIsCategoryOpen(false)}
                              className="flex flex-col px-3.5 py-2 rounded-lg hover:bg-paper transition-colors group"
                            >
                              <span className="text-sm font-semibold text-ink-darkest group-hover:text-rfblue transition-colors">
                                {cat.name}
                              </span>
                              {cat.description && (
                                <span className="text-xs text-ink-light line-clamp-1 mt-0.5">
                                  {cat.description}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                        {/* <div className="p-2 border-t border-paper-border/60 bg-slate-50/50">
                          <Link
                            to="/research"
                            onClick={() => setIsCategoryOpen(false)}
                            className="flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold text-rfblue hover:text-rfblue-700 transition-colors"
                          >
                            <span>Universal Research Archive</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div> */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/research?sort=popular"
                className="py-1.5 hover:text-ink-darkest transition-colors"
              >
                Trending
              </Link>

              <Link
                to="/sponsorship"
                className={`py-1.5 transition-colors flex items-center space-x-1.5 ${
                  isActive('/sponsorship') ? 'text-rfblue font-semibold' : 'hover:text-ink-darkest'
                }`}
              >
                <span>For Sponsorship</span>
              </Link>

              <Link
                to="/about"
                className={`py-1.5 transition-colors ${
                  isActive('/about') ? 'text-rfblue font-semibold' : 'hover:text-ink-darkest'
                }`}
              >
                About
              </Link>
            </nav>

            {/* 3. RIGHT: Search and Profile Actions */}
            <div className="flex items-center justify-end space-x-2.5 sm:space-x-3 shrink-0 lg:flex-1">
              {/* Search Trigger: Compact Icon on Mobile, Pill on Desktop */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center sm:justify-start h-9 sm:h-10 w-9 sm:w-auto px-0 sm:px-3 rounded-xl border border-paper-border bg-paper hover:bg-paper-warm text-ink-muted hover:text-ink transition-all shadow-2xs group"
                title="Search articles, topics... (/ or Ctrl+K)"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-ink-light group-hover:text-rfblue transition-colors sm:mr-2 shrink-0" />
                <span className="hidden sm:inline text-xs sm:text-sm font-medium text-ink-muted group-hover:text-ink">
                  Search
                </span>
                
              </button>

              {/* Desktop Only: Become an Author CTA (Readers & Guests) */}
              {/* {(!isAuthenticated || !hasPermission('article.create')) && (
                <Link
                  to={isAuthenticated ? '/contact' : '/register'}
                  className="hidden xl:inline-flex items-center h-10 px-4 rounded-lg text-xs sm:text-sm font-semibold text-ink hover:text-rfblue bg-white border border-paper-border hover:bg-paper transition-colors"
                >
                  <PenTool className="w-4 h-4 mr-1.5 text-rfblue" />
                  <span>Become an Author</span>
                </Link>
              )} */}

              {/* Desktop Only: User Profile Dropdown or Auth Links */}
              {isAuthenticated ? (
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center h-10 space-x-2 p-1 rounded-full hover:bg-paper transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-rfblue text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-ink-darkest max-w-[110px] truncate">
                      {user?.firstName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-light" />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        key="user-dropdown"
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-60 rounded-xl bg-white shadow-xl border border-paper-border py-2 z-50 overflow-hidden"
                        onMouseLeave={() => setIsUserMenuOpen(false)}
                      >
                        <div className="px-4 py-2.5 border-b border-paper-border/60">
                          <p className="text-sm font-bold text-ink-darkest truncate">{user?.fullName}</p>
                          <p className="text-xs text-ink-light truncate">{user?.email}</p>
                        </div>

                        {/* Write Article Link (if permitted) */}
                        {hasPermission('article.create') && (
                          <Link
                            to="/admin/editor"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2.5 text-xs sm:text-sm font-medium text-rfblue hover:bg-rfblue-50 transition-colors"
                          >
                            <PenTool className="w-4 h-4 mr-2" />
                            Write Article
                          </Link>
                        )}

                        {/* Unified Dashboard Link */}
                        {(hasAnyPermission(ADMIN_PERMISSIONS) || hasPermission('article.create')) && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2.5 text-xs sm:text-sm font-medium text-ink-darkest hover:bg-paper transition-colors"
                          >
                            <Shield className="w-4 h-4 mr-2 text-rfblue" />
                            {hasPermission('article.approve') || hasPermission('user.read_list')
                              ? 'Admin Dashboard'
                              : 'Author Studio'}
                          </Link>
                        )}

                        <Link
                          to="/admin/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs sm:text-sm text-ink-muted hover:bg-paper transition-colors"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Profile & Settings
                        </Link>

                        <Link
                          to="/bookmarks"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs sm:text-sm text-ink-muted hover:bg-paper transition-colors"
                        >
                          <Bookmark className="w-4 h-4 mr-2" />
                          Saved Research
                        </Link>

                        <div className="border-t border-paper-border/60 my-1" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2.5 text-xs sm:text-sm text-rfred hover:bg-rfred-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
                  <Link
                    to="/login"
                    className="h-10 flex items-center text-xs sm:text-sm font-semibold text-ink-muted hover:text-rfblue transition-colors px-3 py-1"
                  >
                    Sign In
                  </Link>
                  {allowRegistration && (
                    <Link
                      to="/register"
                      className="h-10 inline-flex items-center justify-center px-4 text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 rounded-lg shadow-xs transition-colors"
                    >
                      Join
                    </Link>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle Button (Strictly on mobile < lg) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-paper-border bg-paper hover:bg-paper-warm text-ink transition-colors focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* PERSISTENT MOBILE SLIDE-OVER DRAWER (Smooth Open & Close Animation from Right) */}
      {/* ========================================================================= */}

      {/* 1. Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-ink-darkest/60 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* 2. Slide-Over Drawer Panel */}
      <aside
        className={`fixed inset-y-0 right-0 w-[310px] sm:w-[350px] max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-paper-border bg-paper/40 shrink-0">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
            <img src={LOGO_URL} alt="Research Factors" className="h-8 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-paper border border-paper-border hover:bg-slate-200 text-ink-darkest flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* USER ACCOUNT CARD (Redesigned Editorial Treatment) */}
          {isAuthenticated ? (
            <div className="p-4 rounded-2xl bg-white border border-paper-border shadow-2xs">
              {/* Profile Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rfblue to-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-rfblue/10 shrink-0">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-darkest truncate">{user?.fullName}</p>
                  <p className="text-xs text-ink-light truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rfblue-50 text-rfblue border border-rfblue-100/70">
                    {hasPermission('article.approve') || hasPermission('user.read_list')
                      ? 'Administrator'
                      : hasPermission('article.create')
                      ? 'Author'
                      : 'Reader'}
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-1 pt-3 border-t border-paper-border/70">
                {hasPermission('article.create') && (
                  <Link
                    to="/admin/editor"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rfblue hover:bg-rfblue-50 transition-colors"
                  >
                    <PenTool className="w-4 h-4 mr-2.5 shrink-0" />
                    <span>Write Article</span>
                  </Link>
                )}

                {(hasAnyPermission(ADMIN_PERMISSIONS) || hasPermission('article.create')) && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-ink-darkest hover:bg-paper transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2.5 text-rfblue shrink-0" />
                    <span>
                      {hasPermission('article.approve') || hasPermission('user.read_list')
                        ? 'Admin Dashboard'
                        : 'Author Studio'}
                    </span>
                  </Link>
                )}

                <Link
                  to="/admin/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm text-ink-muted hover:text-ink-darkest hover:bg-paper transition-colors"
                >
                  <User className="w-4 h-4 mr-2.5 shrink-0" />
                  <span>Profile & Settings</span>
                </Link>

                <Link
                  to="/bookmarks"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm text-ink-muted hover:text-ink-darkest hover:bg-paper transition-colors"
                >
                  <Bookmark className="w-4 h-4 mr-2.5 shrink-0" />
                  <span>Saved Research</span>
                </Link>

                <div className="pt-2 mt-1 border-t border-paper-border/60">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rfred bg-rfred-50/60 hover:bg-rfred-50 border border-rfred-100/60 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white border border-paper-border shadow-2xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-light">
                Reader Community
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Sign in to participate in research discussions, bookmark papers, and follow authors.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center py-2 text-xs sm:text-sm font-semibold text-ink bg-white border border-paper-border rounded-xl hover:bg-paper-warm transition-colors"
                >
                  Sign In
                </Link>
                {allowRegistration && (
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center py-2 text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 rounded-xl shadow-2xs transition-colors"
                  >
                    Join
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-ink-light px-3 mb-1">
              Navigation
            </span>
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-rfblue-50 text-rfblue font-semibold' : 'text-ink-darkest hover:bg-paper'
              }`}
            >
              <span>Home</span>
            </Link>

            {/* Interactive Category Accordion Item */}
            <div className="rounded-xl overflow-hidden transition-colors">
              <button
                type="button"
                onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isMobileCategoryOpen ||
                  location.pathname.startsWith('/categories') ||
                  location.pathname.startsWith('/research')
                    ? 'bg-rfblue-50/70 text-rfblue font-semibold'
                    : 'text-ink-darkest hover:bg-paper'
                }`}
                aria-expanded={isMobileCategoryOpen}
              >
                <span>Category</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileCategoryOpen ? 'rotate-180 text-rfblue' : 'text-ink-light'
                  }`}
                />
              </button>

              {/* Expandable Accordion Menu with Smooth Framer Motion Animation */}
              <AnimatePresence>
                {isMobileCategoryOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3 py-1.5 space-y-1 border-l-2 border-rfblue-200 ml-3.5 my-1.5">
                      {/* <Link
                        to="/research"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-rfblue hover:bg-rfblue-50 transition-colors uppercase tracking-wider"
                      >
                        <span>All Research Archive</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link> */}

                      {categories.map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          to={`/categories/${cat.slug}`}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm sm:text-sm font-medium transition-colors ${
                            location.pathname === `/categories/${cat.slug}`
                              ? 'bg-rfblue-50 text-rfblue font-semibold'
                              : 'text-ink-muted hover:text-rfblue hover:bg-paper'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <ArrowRight className="w-4 h-4 text-ink-muted opacity-50" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/research?sort=popular"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-ink-darkest hover:bg-paper transition-colors"
            >
              <span>Trending Research</span>
            </Link>
            <Link
              to="/sponsorship"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-rfblue bg-rfblue-50/60 hover:bg-rfblue-50 transition-colors"
            >
              <span>For Sponsorship</span>
              {/* <Sparkles className="w-3.5 h-3.5 text-rfblue" /> */}
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/about') ? 'bg-rfblue-50 text-rfblue font-semibold' : 'text-ink-darkest hover:bg-paper'
              }`}
            >
              <span>About Us</span>
            </Link>
          </div>

          {/* Become an Author Callout (for readers & guests) */}
          {(!isAuthenticated || !hasPermission('article.create')) && (
            <div className="p-4 rounded-xl border border-rfblue-100 bg-rfblue-50/60 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-rfblue">
                <PenTool className="w-3.5 h-3.5" />
                <span>Contribute Research</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Share your research, comparisons, or structured analysis with our readership.
              </p>
              <Link
                to={isAuthenticated ? '/contact' : '/register'}
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center text-xs font-bold text-rfblue hover:underline pt-1"
              >
                <span>Become an Author</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-5 border-t border-paper-border bg-slate-50/90 text-center text-xs shrink-0 space-y-2.5">
          {/* Quick Utility Links */}
          {/* <div className="flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-ink-muted font-medium">
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="hover:text-rfblue transition-colors">
              About
            </Link>
            <span className="text-paper-border">•</span>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="hover:text-rfblue transition-colors">
              Contact
            </Link>
            <span className="text-paper-border">•</span>
            <Link to="/sponsorship" onClick={() => setIsMenuOpen(false)} className="hover:text-rfblue transition-colors">
              Sponsorship
            </Link>
            <span className="text-paper-border">•</span>
            <Link to="/privacy-policy" onClick={() => setIsMenuOpen(false)} className="hover:text-rfblue transition-colors">
              Privacy
            </Link>
            <span className="text-paper-border">•</span>
            <Link to="/terms" onClick={() => setIsMenuOpen(false)} className="hover:text-rfblue transition-colors">
              Terms
            </Link>
          </div> */}

          {/* <p className="text-[11px] text-ink-muted leading-relaxed font-normal">
            Empirical Research, Product Comparisons & Editorial Insights.
          </p> */}
          <p className="text-[13px] text-ink-light">
            © {new Date().getFullYear()} ResearchFactors. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
