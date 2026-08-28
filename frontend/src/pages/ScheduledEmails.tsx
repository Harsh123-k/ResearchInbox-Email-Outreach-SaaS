import React from 'react';
import { Clock, Eye, XCircle, Plus, Mail } from 'lucide-react';
import { EmailItem } from '../types';

interface ScheduledEmailsProps {
  emails: EmailItem[];
  loading: boolean;
  onSelectEmail: (email: EmailItem) => void;
  onCancelEmail: (id: string) => void;
  onOpenCompose: () => void;
}

export const ScheduledEmails: React.FC<ScheduledEmailsProps> = ({
  emails,
  loading,
  onSelectEmail,
  onCancelEmail,
  onOpenCompose,
}) => {
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Scheduled Emails</h2>
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
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No scheduled emails</h3>
        <p className="text-xs text-gray-500 max-w-sm mb-4">
          Create your first scheduled email campaign to automatically reach prospects.
        </p>
        <button
          onClick={onOpenCompose}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3.5 rounded-md flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Compose New Email</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Title & Count */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Scheduled Emails</h2>
          <p className="text-xs text-gray-500">{emails.length} queued for delivery</p>
        </div>
        <button
          onClick={onOpenCompose}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-1.5 px-3 rounded-md flex items-center space-x-1.5 shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Email</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-gray-200 text-[11px] font-semibold text-gray-500 select-none">
              <th className="py-2.5 px-4">Recipient</th>
              <th className="py-2.5 px-4">Subject</th>
              <th className="py-2.5 px-4">Sender</th>
              <th className="py-2.5 px-4">Scheduled Time</th>
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
                <td className="py-3 px-4 text-gray-500 truncate max-w-[160px]">
                  {email.sender_name}
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                  {new Date(email.scheduled_time).toLocaleString()}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                    Scheduled
                  </span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => onSelectEmail(email)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onCancelEmail(email.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Cancel Job"
                    >
                      <XCircle className="w-3.5 h-3.5" />
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
