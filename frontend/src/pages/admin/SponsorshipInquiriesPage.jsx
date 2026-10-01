import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import {
  Briefcase,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  Trash2,
  Reply,
  Clock,
  Check,
  X,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe,
  Building2,
  Calendar,
  Sparkles,
  Inbox
} from 'lucide-react';

const parseSponsorshipDetails = (rawMessage) => {
  if (!rawMessage || typeof rawMessage !== 'string') return null;
  if (!rawMessage.includes('--- Inquirer Message ---')) return null;

  const [metaText, ...bodyParts] = rawMessage.split('--- Inquirer Message ---');
  const body = bodyParts.join('--- Inquirer Message ---').trim();
  const meta = {};

  metaText.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim();
      if (key && val) {
        meta[key] = val;
      }
    }
  });

  return { meta, body };
};

export default function SponsorshipInquiriesPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [statusFilter, setStatusFilter] = useState('unread');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch only Sponsorship Inquiries (type: 'sponsorship')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sponsorship-inquiries', { status: statusFilter, search, page }],
    queryFn: async () => {
      const res = await adminApi.listContactMessages({
        status: statusFilter,
        search,
        page,
        limit: 15,
        type: 'sponsorship'
      });
      return res.data;
    }
  });

  const messages = data?.messages || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateContactMessage(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['admin-sponsorship-inquiries']);
      queryClient.invalidateQueries(['admin-contact-messages']);
      if (selectedMessage?.id === updated?.id) {
        setSelectedMessage(updated);
      }
      setAlertMsg({ type: 'success', text: 'Inquiry status updated.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update inquiry status' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sponsorship-inquiries']);
      queryClient.invalidateQueries(['admin-contact-messages']);
      setSelectedMessage(null);
      setAlertMsg({ type: 'success', text: 'Inquiry deleted successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete inquiry' });
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ messageIds, status, isRead }) =>
      adminApi.bulkUpdateContactMessages(messageIds, { status, isRead }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-sponsorship-inquiries']);
      queryClient.invalidateQueries(['admin-contact-messages']);
      setSelectedMessageIds([]);
      setAlertMsg({ type: 'success', text: res.message || 'Batch update applied.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Batch action failed' });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (messageIds) => adminApi.bulkDeleteContactMessages(messageIds),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-sponsorship-inquiries']);
      queryClient.invalidateQueries(['admin-contact-messages']);
      setSelectedMessageIds([]);
      setSelectedMessage(null);
      setAlertMsg({ type: 'success', text: res.message || 'Selected inquiries removed.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete inquiries' });
    }
  });

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      updateMutation.mutate({ id: msg.id, data: { isRead: true } });
    }
  };

  const handleBulkMarkRead = () => {
    if (selectedMessageIds.length === 0) return;
    bulkUpdateMutation.mutate({ messageIds: selectedMessageIds, isRead: true });
  };

  const handleBulkMarkResolved = () => {
    if (selectedMessageIds.length === 0) return;
    bulkUpdateMutation.mutate({ messageIds: selectedMessageIds, status: 'resolved' });
  };

  const handleBulkDelete = async () => {
    if (selectedMessageIds.length === 0) return;
    const ok = await confirm({
      title: `Delete ${selectedMessageIds.length} Sponsorship Inquiries?`,
      message: 'Are you sure you want to permanently delete these selected inquiries? This action cannot be undone.',
      confirmText: 'Delete Selected',
      confirmVariant: 'danger'
    });
    if (ok) {
      bulkDeleteMutation.mutate(selectedMessageIds);
    }
  };

  const parsedSponsorship = selectedMessage ? parseSponsorshipDetails(selectedMessage.message) : null;

  return (
    <AdminLayout
      title="Sponsorship Inquiries"
      subtitle="Track, evaluate, and respond to incoming enterprise sponsorship proposals and custom package inquiries."
    >
      <Helmet>
        <title>Sponsorship Inquiries | Admin Studio</title>
      </Helmet>

      {/* Alert Banner */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar: Search & Status Filter */}
      <div className="admin-toolbar mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Commercial Deals</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {pagination.total} total {pagination.total === 1 ? 'inquiry' : 'inquiries'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-1 sm:justify-end">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company, name, email, tier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-input pl-9 pr-3 py-1.5 text-xs w-full"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative shrink-0" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              title="Filter by status"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                {statusFilter === 'unread'
                  ? 'Unread'
                  : statusFilter === 'pending'
                  ? 'Pending'
                  : statusFilter === 'resolved'
                  ? 'Resolved'
                  : 'All Statuses'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 animate-scaleUp">
                {[
                  { id: '', label: 'All Statuses' },
                  { id: 'unread', label: 'Unread Only' },
                  { id: 'pending', label: 'Pending Only' },
                  { id: 'resolved', label: 'Resolved Only' }
                ].map((opt) => {
                  const isSelected = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setPage(1);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Messages List Column */}
        <div className="lg:col-span-2 admin-card overflow-hidden shadow-xs flex flex-col">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading sponsorship inquiries...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-16 text-center">
              <Inbox className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Inquiries Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No matching inquiries found for the current search and status filter.
              </p>
            </div>
          ) : (
            <>
              {/* Inbox Header with Bulk Actions */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    checked={messages.length > 0 && selectedMessageIds.length === messages.length}
                    onChange={() => {
                      if (selectedMessageIds.length === messages.length) {
                        setSelectedMessageIds([]);
                      } else {
                        setSelectedMessageIds(messages.map((m) => m.id));
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all inquiries on this page"
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {selectedMessageIds.length > 0
                      ? `${selectedMessageIds.length} selected`
                      : `Inquiries (${messages.length})`}
                  </span>
                </div>

                {selectedMessageIds.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={handleBulkMarkRead}
                      disabled={bulkUpdateMutation.isPending}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Mark selected as read"
                    >
                      Read
                    </button>
                    <button
                      onClick={handleBulkMarkResolved}
                      disabled={bulkUpdateMutation.isPending}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                      title="Mark selected as resolved"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                      className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete selected"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedMessageIds([])}
                      className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Message List */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800/60 max-h-[620px] overflow-y-auto">
                {messages.map((m) => {
                  const isSelected = selectedMessage?.id === m.id;
                  const isChecked = selectedMessageIds.includes(m.id);
                  const parsed = parseSponsorshipDetails(m.message);
                  const cleanSubject = m.subject?.replace(/^\[Sponsorship\]\s*/, '') || 'Sponsorship Inquiry';
                  const brandName = parsed?.meta?.['Company / Brand'] || m.name;
                  const tierName = parsed?.meta?.['Sponsorship Format'] || cleanSubject;

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMessage(m)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-600/15 border-l-3 border-blue-500'
                          : isChecked
                          ? 'bg-blue-50/40 dark:bg-blue-900/15'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => {
                              setSelectedMessageIds((prev) =>
                                prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                              );
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
                            <Briefcase className="w-2.5 h-2.5 mr-1" />
                            {tierName.length > 22 ? `${tierName.substring(0, 20)}...` : tierName}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              !m.isRead
                                ? 'text-slate-900 dark:text-white font-bold'
                                : 'text-slate-700 dark:text-slate-300 font-medium'
                            }`}
                          >
                            {brandName}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="pl-6">
                        <p className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate mb-1">
                          {m.name} &bull; <span className="text-slate-500 dark:text-slate-400">{m.email}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {parsed ? parsed.body : m.message}
                        </p>
                      </div>

                      <div className="pl-6 mt-2 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {m.isResolved ? (
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                              <Clock className="w-3 h-3 mr-0.5" /> Pending Deal
                            </span>
                          )}
                          {!m.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Unread" />
                          )}
                        </div>

                        {parsed?.meta?.['Budget / Timeline'] && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {parsed.meta['Budget / Timeline']}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Detail View Column */}
        <div className="lg:col-span-3 admin-card p-6 shadow-xs flex flex-col justify-between">
          {selectedMessage ? (
            <div className="space-y-6">
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Sponsorship Inquiry</span>
                    </span>
                    {selectedMessage.isResolved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {parsedSponsorship?.meta?.['Company / Brand']
                      ? `${parsedSponsorship.meta['Company / Brand']} — ${selectedMessage.subject.replace(/^\[Sponsorship\]\s*/, '')}`
                      : selectedMessage.subject.replace(/^\[Sponsorship\]\s*/, '')}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMessage.name}
                    </span>
                    <span>&bull;</span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status & Delete Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: selectedMessage.id,
                        data: { isResolved: !selectedMessage.isResolved }
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      selectedMessage.isResolved
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {selectedMessage.isResolved ? 'Resolved ✓' : 'Mark Resolved'}
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Delete Inquiry Permanently',
                        message: 'Are you sure you want to permanently delete this sponsorship inquiry? All contact records and message details will be removed.',
                        confirmText: 'Delete Inquiry',
                        confirmVariant: 'danger'
                      });
                      if (ok) {
                        deleteMutation.mutate(selectedMessage.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Campaign & Company Overview Card */}
              {parsedSponsorship && (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Campaign & Company Overview
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Company / Brand</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {parsedSponsorship.meta['Company / Brand'] || selectedMessage.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Requested Sponsorship Tier</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {parsedSponsorship.meta['Sponsorship Format'] || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Budget / Timeline</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {parsedSponsorship.meta['Budget / Timeline'] || 'Standard Scope'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Company Website</span>
                      {parsedSponsorship.meta['Website'] && parsedSponsorship.meta['Website'] !== 'Not provided' ? (
                        <a
                          href={
                            parsedSponsorship.meta['Website'].startsWith('http')
                              ? parsedSponsorship.meta['Website']
                              : `https://${parsedSponsorship.meta['Website']}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          <span>{parsedSponsorship.meta['Website']}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Inquirer Objectives & Campaign Brief
                </h4>
                <div className="p-4 rounded-xl admin-card-inner text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {parsedSponsorship ? parsedSponsorship.body : selectedMessage.message}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply to {selectedMessage.name}</span>
                </a>

                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Lead Reference ID: <span className="font-mono">{selectedMessage.id}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-20 text-center text-slate-400 dark:text-slate-500 text-xs my-auto">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No inquiry selected</p>
              <p className="mt-1">Select any submission from the left inbox to view company details, requested tiers, and brief.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
