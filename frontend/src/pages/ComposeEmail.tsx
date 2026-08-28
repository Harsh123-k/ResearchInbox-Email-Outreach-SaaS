import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  X,
  Clock,
  Send,
  Check,
  AlertCircle,
  FileText,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Sender } from '../types';
import { api } from '../services/api';
import { RichTextEditor } from '../components/RichTextEditor';

interface ComposeEmailProps {
  onClose: () => void;
  onScheduledSuccess: () => void;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({ onClose, onScheduledSuccess }) => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [recipients, setRecipients] = useState<string[]>(['sarah.connor@example.com', 'alex.mercer@innovate.co']);
  const [inputRecipient, setInputRecipient] = useState<string>('');
  const [subject, setSubject] = useState<string>('Quick follow-up regarding our discussion');
  const [body, setBody] = useState<string>(
    '<p>Hi there,</p><p>I wanted to follow up on our previous conversation regarding optimizing your outreach workflows with ReachInbox.</p><p>Let me know if you have 10 minutes this week to connect!</p><p>Best regards,<br><b>Growth Team</b></p>'
  );

  // Scheduling controls
  const [startTime, setStartTime] = useState<string>(() => {
    // Default to 10 minutes in the future in local ISO datetime-local format
    const future = new Date(Date.now() + 10 * 60 * 1000);
    const tzOffset = future.getTimezoneOffset() * 60000;
    const localISOTime = new Date(future.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [delaySec, setDelaySec] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);

  // CSV Upload stats
  const [uploadStats, setUploadStats] = useState<{
    totalDetected: number;
    validCount: number;
    duplicateCount: number;
  } | null>(null);

  // Button States: 'normal' | 'loading' | 'success' | 'error'
  const [scheduleState, setScheduleState] = useState<'normal' | 'loading' | 'success' | 'error'>('normal');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchSenders = async () => {
      try {
        const res = await api.get('/senders');
        setSenders(res.data.senders || []);
        if (res.data.senders?.length > 0) {
          const defaultSender = res.data.senders.find((s: Sender) => s.is_default) || res.data.senders[0];
          setSelectedSenderId(defaultSender.id);
        }
      } catch (err) {
        console.error('Error fetching senders:', err);
      }
    };
    fetchSenders();
  }, []);

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = inputRecipient.trim().replace(',', '').toLowerCase();
      if (email && email.includes('@') && !recipients.includes(email)) {
        setRecipients([...recipients, email]);
        setInputRecipient('');
      }
    }
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter((r) => r !== emailToRemove));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/emails/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { emails, totalDetected, validCount, duplicateCount } = res.data;
      setUploadStats({ totalDetected, validCount, duplicateCount });

      // Merge unique emails
      const merged = Array.from(new Set([...recipients, ...emails]));
      setRecipients(merged);
    } catch (err: any) {
      alert('Error parsing file: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (recipients.length === 0) {
      setErrorMessage('Please add at least one recipient email.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Please enter an email body.');
      return;
    }

    setScheduleState('loading');

    try {
      const res = await api.post('/emails/schedule', {
        senderId: selectedSenderId,
        recipients,
        subject,
        body,
        startTime: new Date(startTime).toISOString(),
        delayMs: delaySec * 1000,
        hourlyLimit,
      });

      setScheduleState('success');
      setTimeout(() => {
        onScheduledSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setScheduleState('error');
      setErrorMessage(err.response?.data?.error || 'Failed to schedule emails. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="px-6 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-gray-900">Compose New Email</h2>
          </div>

          {/* Action Controls on the Right */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>

            {/* Primary Green Action Button */}
            <button
              type="button"
              onClick={handleScheduleSubmit}
              disabled={scheduleState === 'loading' || scheduleState === 'success'}
              className={`text-xs font-semibold px-4 py-1.5 rounded-md text-white shadow-sm flex items-center space-x-1.5 transition ${
                scheduleState === 'loading'
                  ? 'bg-emerald-500 opacity-80 cursor-wait'
                  : scheduleState === 'success'
                  ? 'bg-emerald-700'
                  : scheduleState === 'error'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              }`}
            >
              {scheduleState === 'loading' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  <span>Scheduling...</span>
                </>
              ) : scheduleState === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Scheduled!</span>
                </>
              ) : scheduleState === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Retry</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span>Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* From Selector */}
          <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
            <label className="w-16 font-medium text-gray-500 shrink-0">From:</label>
            <select
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} &lt;{s.email}&gt;
                </option>
              ))}
            </select>
          </div>

          {/* To / Recipient Area with Chips & CSV Upload */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <div className="flex items-start space-x-3">
              <label className="w-16 font-medium text-gray-500 pt-1.5 shrink-0">To:</label>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center p-2 bg-gray-50 border border-gray-200 rounded-md focus-within:bg-white focus-within:border-emerald-500 min-h-[38px] transition">
                {recipients.slice(0, 6).map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center bg-white border border-gray-200 text-gray-800 text-[11px] font-medium px-2 py-0.5 rounded shadow-2xs"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="ml-1.5 text-gray-400 hover:text-gray-700 p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {recipients.length > 6 && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    +{recipients.length - 6} more leads
                  </span>
                )}

                <input
                  type="text"
                  value={inputRecipient}
                  onChange={(e) => setInputRecipient(e.target.value)}
                  onKeyDown={handleAddRecipient}
                  placeholder={recipients.length === 0 ? 'Type email and press Enter...' : 'Add more...'}
                  className="flex-1 bg-transparent border-none text-xs text-gray-800 focus:outline-none min-w-[140px]"
                />
              </div>
            </div>

            {/* CSV / TXT Upload Strip */}
            <div className="flex items-center justify-between pl-19 pr-1">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer inline-flex items-center space-x-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded transition shadow-2xs">
                  <UploadCloud className="w-3 h-3" />
                  <span>Upload CSV / TXT</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {uploadStats && (
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>✓ {uploadStats.totalDetected} detected (Valid: {uploadStats.validCount}, Duplicates: {uploadStats.duplicateCount})</span>
                  </span>
                )}
              </div>

              {recipients.length > 0 && (
                <span className="text-[11px] text-gray-500">
                  Total: <strong className="text-gray-800 font-semibold">{recipients.length}</strong> leads
                </span>
              )}
            </div>
          </div>

          {/* Subject Line */}
          <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
            <label className="w-16 font-medium text-gray-500 shrink-0">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick follow up regarding..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
            />
          </div>

          {/* Scheduling Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Start Time */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Start Time</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Delay between emails */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Delay between emails</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={delaySec}
                  onChange={(e) => setDelaySec(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 pr-12"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                  sec
                </span>
              </div>
            </div>

            {/* Hourly Limit */}
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 text-blue-500" />
                <span>Hourly Limit (Redis)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 pr-14"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                  emails/hr
                </span>
              </div>
            </div>
          </div>

          {/* Email Body Editor */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Email Body</label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
        </div>
      </div>
    </div>
  );
};
