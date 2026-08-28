import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db } from '../config/database';

export const senderRouter = Router();

senderRouter.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  let senders = db.prepare('SELECT * FROM senders WHERE user_id = ? ORDER BY is_default DESC').all(userId) as any[];

  if (senders.length === 0) {
    const id = 'snd_' + Date.now();
    db.prepare('INSERT INTO senders (id, user_id, name, email, is_default) VALUES (?, ?, ?, ?, 1)')
      .run(id, userId, req.user!.name, req.user!.email);
    senders = [{ id, user_id: userId, name: req.user!.name, email: req.user!.email, is_default: 1 }];
  }

  res.json({ senders });
});

senderRouter.post('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { name, email, isDefault } = req.body;

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const id = 'snd_' + Date.now();
  if (isDefault) {
    db.prepare('UPDATE senders SET is_default = 0 WHERE user_id = ?').run(userId);
  }

  db.prepare('INSERT INTO senders (id, user_id, name, email, is_default) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, name, email, isDefault ? 1 : 0);

  res.json({ id, name, email, is_default: isDefault ? 1 : 0 });
});
