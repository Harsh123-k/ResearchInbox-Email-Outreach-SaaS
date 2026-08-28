import React from 'react';
import { X, Clock, Send, User, Mail, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { EmailItem } from '../types';

interface EmailDetailModalProps {
  email: EmailItem | null;
  onClose: () => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                email.status === 'Sent'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : email.status === 'Failed'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {email.status}
            </span>
            <h3 className="text-xs font-semibold text-gray-900 truncate max-w-md">{email.subject}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border border-gray-200">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">From</p>
              <p className="font-semibold text-gray-900">{email.sender_name} <span className="text-gray-500 font-normal">({email.sender_email})</span></p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">To</p>
              <p className="font-semibold text-gray-900">{email.recipient_email}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Scheduled Time</p>
              <p className="text-gray-700">{new Date(email.scheduled_time).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Delivery Status / Time</p>
              <p className="text-gray-700">
                {email.sent_at ? new Date(email.sent_at).toLocaleString() : email.status}
              </p>
            </div>
          </div>

          {email.error_message && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Delivery Error</p>
                <p className="text-[11px]">{email.error_message}</p>
              </div>
            </div>
          )}

          {/* Email Body Preview */}
          <div>
            <p className="text-[11px] font-medium text-gray-500 mb-1.5">Email Body</p>
            <div
              className="p-4 bg-white border border-gray-200 rounded-md max-h-60 overflow-y-auto leading-relaxed text-gray-800 text-xs"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-[#F9FAFB] flex items-center justify-between">
          <div>
            {email.preview_url && (
              <a
                href={email.preview_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-800 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md transition"
              >
                <span>Open in Ethereal Mail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded-md hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
