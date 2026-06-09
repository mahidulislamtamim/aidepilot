import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { HistoryEntry } from '../types';
import { paramId } from '../utils/params';

const router = Router();

router.get('/workspace/:workspaceId', (req: Request, res: Response) => {
  const db = getDb();
  const limit = parseInt(req.query.limit as string) || 50;
  const history = db
    .prepare('SELECT * FROM history WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(paramId(req, 'workspaceId'), limit) as unknown as HistoryEntry[];
  res.json(history);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM history WHERE id = ?').get(paramId(req)) as unknown as HistoryEntry | undefined;
  if (!entry) return res.status(404).json({ error: 'History entry not found' });
  res.json(entry);
});

router.delete('/workspace/:workspaceId', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM history WHERE workspace_id = ?').run(paramId(req, 'workspaceId'));
  res.status(204).send();
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM history WHERE id = ?').run(paramId(req));
  if (result.changes === 0) return res.status(404).json({ error: 'History entry not found' });
  res.status(204).send();
});

export default router;
