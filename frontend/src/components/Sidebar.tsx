import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Send, Plus, CheckCircle2, MessageSquare, RefreshCw, Unplug, Check } from 'lucide-react';
import { api } from '../services/api';
import { SlackStatus } from '../types';

interface SidebarProps {
  scheduledCount: number;
  sentCount: number;
  onOpenCompose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ scheduledCount, sentCount, onOpenCompose }) => {
  const [slack, setSlack] = useState<SlackStatus>({ connected: false });
  const [connectingSlack, setConnectingSlack] = useState(false);

  const fetchSlackStatus = async () => {
    try {
      const res = await api.get('/slack/status');
      setSlack(res.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSlackStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SLACK_CONNECTED') {
        fetchSlackStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectSlack = async () => {
    setConnectingSlack(true);
    try {
      // Direct instant Slack connection for smooth experience
      await api.post('/slack/connect-demo');
      await fetchSlackStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingSlack(false);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      await api.post('/slack/disconnect');
      setSlack({ connected: false });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col justify-between p-3 select-none shrink-0 h-[calc(100vh-3.5rem)]">
      <div>
        {/* Primary Action Button */}
        <button
          onClick={onOpenCompose}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs py-2 px-3 rounded-md flex items-center justify-center space-x-1.5 shadow-sm transition mb-4"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Compose New Email</span>
        </button>

        {/* Navigation Section */}
        <div className="space-y-1">
          <NavLink
            to="/scheduled"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Scheduled</span>
            </div>
            {scheduledCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {scheduledCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/sent"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <div className="flex items-center space-x-2.5">
              <Send className="w-4 h-4 text-gray-500" />
              <span>Sent</span>
            </div>
            {sentCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {sentCount}
              </span>
            )}
          </NavLink>
        </div>
      </div>

      {/* Slack Integration Box */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-800">Slack</span>
          </div>
          {slack.connected && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center space-x-1">
              <Check className="w-2.5 h-2.5" />
              <span>Active</span>
            </span>
          )}
        </div>

        {slack.connected ? (
          <div>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-medium mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{slack.teamName || 'Slack Connected'}</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2 truncate">Channel: {slack.channelName || '#general'}</p>
            <button
              onClick={handleDisconnectSlack}
              className="w-full text-center text-[11px] text-rose-600 hover:text-rose-700 font-medium py-1 px-2 border border-rose-200 hover:bg-rose-50 rounded transition"
            >
              Disconnect Slack
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[11px] text-gray-500 mb-2.5">Get real-time delivery alerts directly inside Slack.</p>
            <button
              onClick={handleConnectSlack}
              disabled={connectingSlack}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[11px] font-medium py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 shadow-2xs transition disabled:opacity-60"
            >
              {connectingSlack ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-gray-500" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3 h-3 text-[#4A154B]" />
                  <span>Connect Slack</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
