import React, { useState, useEffect } from 'react';
import { Search, Mail, ChevronDown, LogOut, Layers, ExternalLink, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCompose: () => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onOpenCompose }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Product Logo & Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-gray-900 font-semibold tracking-tight text-base">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Mail className="w-4 h-4" />
          </div>
          <span>ReachInbox</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
          Outreach Studio
        </span>
      </div>

      {/* Middle: Elasticsearch Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails, recipients, subjects, body..."
            className="w-full bg-[#F9FAFB] border border-gray-200 rounded-md pl-9 pr-4 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Bull Board Link + User Profile */}
      <div className="flex items-center space-x-4">
        <a
          href="/admin/queues"
          target="_blank"
          rel="noreferrer"
          title="Open Bull Board Queue Monitor"
          className="flex items-center space-x-1.5 text-xs text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-2.5 py-1.5 rounded-md transition"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">Bull Board</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </a>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-md hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-medium text-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-gray-900 leading-tight">{user?.name || 'Account'}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.email || 'user@reachinbox.ai'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 truncate text-[11px]">{user?.email}</p>
              </div>

              <div className="py-1">
                <a
                  href="/admin/queues"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  <Layers className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  Queue Inspector (Bull Board)
                </a>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center px-3 py-2 text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
