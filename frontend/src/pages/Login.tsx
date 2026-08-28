import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('ansh.kamboj@reachinbox.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/scheduled');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(undefined, 'ansh.kamboj@reachinbox.ai');
      navigate('/scheduled');
    } catch (err: any) {
      setError('Google OAuth verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-4">
      {/* Centered Login Card with Figma pink/magenta outline accent */}
      <div className="w-full max-w-[380px] bg-white rounded-xl border border-pink-200/80 shadow-[0_4px_24px_rgba(244,63,94,0.06)] ring-1 ring-pink-300/40 p-7">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white mx-auto mb-3 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Login</h1>
          <p className="text-xs text-gray-500 mt-1">Sign in to your ReachInbox workspace</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
            {error}
          </div>
        )}

        {/* Real Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2.5 py-2 px-3 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-md text-xs font-medium text-gray-700 transition shadow-2xs disabled:opacity-60 mb-4"
        >
          {/* Google SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-2.5 text-[11px] text-gray-400 absolute">or</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-[#FAFAFA] focus:bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              placeholder="name@reachinbox.ai"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-[#FAFAFA] focus:bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              placeholder="••••••••"
            />
          </div>

          {/* Figma Primary Green Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs py-2 px-3 rounded-md transition shadow-sm disabled:opacity-60 flex items-center justify-center space-x-1.5"
          >
            <span>{loading ? 'Signing in...' : 'Login'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Fast Login Preset */}
        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 mb-2">Quick Evaluation Access</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => {
                setEmail('ansh.kamboj@reachinbox.ai');
                setPassword('password123');
              }}
              className="text-[11px] px-2 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 rounded transition"
            >
              Demo Admin
            </button>
            <button
              onClick={() => {
                setEmail('growth@reachinbox.ai');
                setPassword('password123');
              }}
              className="text-[11px] px-2 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 rounded transition"
            >
              Growth Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
