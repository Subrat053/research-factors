import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  Mail,
  Search,
  CheckCircle2,
  Trash2,
  Reply,
  Clock,
  Check,
  X,
  Loader2,
  MessageSquare
} from 'lucide-react';

export default function ContactMessagesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('unread');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Inquiries
  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-messages', { status: statusFilter, search, page }],
    queryFn: async () => {
      const res = await adminApi.listContactMessages({ status: statusFilter, search, page, limit: 15 });
      return res.data;
    }
  });

  const messages = data?.messages || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateContactMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-contact-messages']);
      setAlertMsg({ type: 'success', text: 'Message updated.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update message' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-contact-messages']);
      setSelectedMessage(null);
      setAlertMsg({ type: 'success', text: 'Message deleted.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete message' });
    }
  });

  const handleSelectMessage = (m) => {
    setSelectedMessage(m);
    if (!m.isRead) {
      updateMutation.mutate({ id: m.id, data: { isRead: true } });
    }
  };

  return (
    <AdminLayout
      title="Reader Inquiries & Helpdesk"
      subtitle="Review submissions from the public contact form, track resolutions, and dispatch replies"
    >
      <Helmet>
        <title>Contact Messages — Research Factors Admin</title>
      </Helmet>

      {/* Alerts */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          {[
            { id: 'unread', label: 'Unread' },
            { id: 'pending', label: 'Pending Resolution' },
            { id: 'resolved', label: 'Resolved' },
            { id: '', label: 'All Inquiries' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Inquiries Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading inbox...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-16 text-center">
              <Mail className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Inquiries Found</h3>
              <p className="text-xs text-slate-400 mt-1">Inbox is clear for the chosen filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
              {messages.map((m) => {
                const isSelected = selectedMessage?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMessage(m)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600/15 border-l-2 border-blue-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${!m.isRead ? 'text-white font-bold' : 'text-slate-300'}`}>
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h5 className="text-xs text-slate-200 truncate font-medium">{m.subject}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{m.message}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {!m.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                      )}
                      {m.isResolved && (
                        <span className="inline-flex items-center text-[10px] text-emerald-400 font-semibold">
                          <Check className="w-3 h-3 mr-0.5" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Detail View */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          {selectedMessage ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-serif font-bold text-white mb-1">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{selectedMessage.name}</span>
                    <span>&lt;{selectedMessage.email}&gt;</span>
                    <span>·</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: selectedMessage.id,
                        data: { isResolved: !selectedMessage.isResolved }
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      selectedMessage.isResolved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {selectedMessage.isResolved ? 'Resolved ✓' : 'Mark Resolved'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this contact message permanently?')) {
                        deleteMutation.mutate(selectedMessage.id);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply via Email Client</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-20 text-center text-slate-500 text-xs my-auto">
              Select an inquiry from the list to view full communication details.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
