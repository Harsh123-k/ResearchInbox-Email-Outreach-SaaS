import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (credential?: string, email?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('reachinbox_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('reachinbox_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('reachinbox_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('reachinbox_user', JSON.stringify(res.data.user));
        } catch (err) {
          localStorage.removeItem('reachinbox_token');
          localStorage.removeItem('reachinbox_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await api.post('/auth/login', { email, password: password || 'password123' });
    const { user, token } = res.data;
    setUser(user);
    setToken(token);
    localStorage.setItem('reachinbox_token', token);
    localStorage.setItem('reachinbox_user', JSON.stringify(user));
  };

  const loginWithGoogle = async (credential?: string, email?: string) => {
    const res = await api.post('/auth/google', {
      credential,
      email: email || 'ansh.kamboj@reachinbox.ai',
      name: 'Ansh Kamboj',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&q=80',
    });
    const { user, token } = res.data;
    setUser(user);
    setToken(token);
    localStorage.setItem('reachinbox_token', token);
    localStorage.setItem('reachinbox_user', JSON.stringify(user));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('reachinbox_token');
    localStorage.removeItem('reachinbox_user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
