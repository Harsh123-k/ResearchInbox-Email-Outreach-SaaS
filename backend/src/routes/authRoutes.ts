import { Router } from 'express';
import { AuthService } from '../services/authService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db } from '../config/database';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await AuthService.register(email, password, name);
    const token = AuthService.generateToken(user);
    res.json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const result = await AuthService.loginWithPassword(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

authRouter.post('/google', async (req, res) => {
  try {
    const { credential, email, name, avatar } = req.body;
    if (email) {
      const user = await AuthService.register(email, undefined, name, avatar, 'google_' + Date.now());
      const token = AuthService.generateToken(user);
      return res.json({ user, token });
    }
    const result = await AuthService.verifyGoogleToken(credential || 'reachinbox.user@gmail.com');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

authRouter.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?').get(req.user?.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

authRouter.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});
