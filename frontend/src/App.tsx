import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { ScheduledEmails } from './pages/ScheduledEmails';
import { SentEmails } from './pages/SentEmails';
import { ComposeEmail } from './pages/ComposeEmail';
import { EmailDetailModal } from './components/EmailDetailModal';
import { EmailItem } from './types';
import { api } from './services/api';

const MainLayout: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [scheduledEmails, setScheduledEmails] = useState<EmailItem[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailItem[]>([]);
  const [searchResults, setSearchResults] = useState<EmailItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);

  const location = useLocation();

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        api.get('/emails/scheduled'),
        api.get('/emails/sent'),
      ]);
      setScheduledEmails(scheduledRes.data.emails || []);
      setSentEmails(sentRes.data.sent || sentRes.data.emails || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and auto-polling every 3 seconds for live job processing feedback
  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 3000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  // Elasticsearch live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/emails/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCancelEmail = async (id: string) => {
    try {
      await api.post(`/emails/${id}/cancel`);
      fetchEmails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel email');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine active view list (search results override if active)
  const currentScheduled = searchResults !== null
    ? searchResults.filter((e) => e.status === 'Scheduled' || e.status === 'Sending')
    : scheduledEmails;

  const currentSent = searchResults !== null
    ? searchResults.filter((e) => e.status === 'Sent' || e.status === 'Failed' || e.status === 'Cancelled')
    : sentEmails;

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col">
      {/* Figma Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCompose={() => setIsComposeOpen(true)}
      />

      {/* Body Area with Sidebar & Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Compact Sidebar */}
        <Sidebar
          scheduledCount={scheduledEmails.length}
          sentCount={sentEmails.length}
          onOpenCompose={() => setIsComposeOpen(true)}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto bg-[#FBFBFB]">
          {searchQuery && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex items-center justify-between">
              <span>
                Elasticsearch results for &ldquo;<strong>{searchQuery}</strong>&rdquo; (Found {searchResults?.length || 0} matching emails)
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline ml-2"
              >
                Clear search
              </button>
            </div>
          )}

          <Routes>
            <Route
              path="/scheduled"
              element={
                <ScheduledEmails
                  emails={currentScheduled}
                  loading={loading || isSearching}
                  onSelectEmail={setSelectedEmail}
                  onCancelEmail={handleCancelEmail}
                  onOpenCompose={() => setIsComposeOpen(true)}
                />
              }
            />
            <Route
              path="/sent"
              element={
                <SentEmails
                  emails={currentSent}
                  loading={loading || isSearching}
                  onSelectEmail={setSelectedEmail}
                  onOpenCompose={() => setIsComposeOpen(true)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/scheduled" replace />} />
          </Routes>
        </main>
      </div>

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <ComposeEmail
          onClose={() => setIsComposeOpen(false)}
          onScheduledSuccess={fetchEmails}
        />
      )}

      {/* Email Detail View Modal */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </AuthProvider>
  );
};
