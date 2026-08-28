import React from 'react';
import { Send, Eye, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { EmailItem } from '../types';

interface SentEmailsProps {
  emails: EmailItem[];
  loading: boolean;
  onSelectEmail: (email: EmailItem) => void;
  onOpenCompose: () => void;
}

export const SentEmails: React.FC<SentEmailsProps> = ({
  emails,
  loading,
  onSelectEmail,
  onOpenCompose,
}) => {
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Sent Emails</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between animate-pulse">
              <div className="w-1/4 h-3.5 bg-gray-200 rounded" />
              <div className="w-1/3 h-3.5 bg-gray-200 rounded" />
              <div className="w-1/6 h-3.5 bg-gray-200 rounded" />
              <div className="w-16 h-5 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
          <Send className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No sent emails yet</h3>
        <p className="text-xs text-gray-500 max-w-sm mb-4">
          Emails sent by the scheduler will automatically show up here with live delivery previews.
        </p>
        <button
          onClick={onOpenCompose}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3.5 rounded-md shadow-sm transition"
        >
          Compose New Email
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Title & Count */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Sent Emails</h2>
          <p className="text-xs text-gray-500">{emails.length} total deliveries processed</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-gray-200 text-[11px] font-semibold text-gray-500 select-none">
              <th className="py-2.5 px-4">Recipient</th>
              <th className="py-2.5 px-4">Subject</th>
              <th className="py-2.5 px-4">Sent Time</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {emails.map((email) => (
              <tr
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className="hover:bg-gray-50/80 cursor-pointer transition"
              >
                <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-[200px]">
                  {email.recipient_email}
                </td>
                <td className="py-3 px-4 text-gray-700 truncate max-w-[280px]">
                  {email.subject}
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                  {email.sent_at ? new Date(email.sent_at).toLocaleString() : new Date(email.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {email.status === 'Sent' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                      Sent
                    </span>
                  ) : email.status === 'Failed' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                      Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                      {email.status}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-2">
                    {email.preview_url && (
                      <a
                        href={email.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded text-[11px] font-medium transition"
                        title="View Delivered Email in Ethereal"
                      >
                        <span>Ethereal Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => onSelectEmail(email)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
