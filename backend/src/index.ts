import cors from 'cors';
import express from 'express';
import fs from 'fs';
import type { Server } from 'http';
import path from 'path';
import { closeDb, initDb } from './db/database';
import environmentsRouter from './routes/environments';
import foldersRouter from './routes/folders';
import historyRouter from './routes/history';
import requestsRouter from './routes/requests';
import workspacesRouter from './routes/workspaces';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'AidePilot API', version: '1.0.0' });
});

app.use('/api/workspaces', workspacesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/environments', environmentsRouter);
app.use('/api/history', historyRouter);

function mountStatic() {
  const STATIC_DIR = process.env.AIDEPLOT_STATIC_DIR;
  if (!STATIC_DIR || !fs.existsSync(STATIC_DIR)) return;

  app.use(express.static(STATIC_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
    next();
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

let server: Server | null = null;

export async function startServer(): Promise<{ port: number; host: string }> {
  const PORT = Number(process.env.PORT || 3001);
  const HOST = process.env.HOST || '0.0.0.0';

  mountStatic();
  await initDb();

  await new Promise<void>((resolve, reject) => {
    server = app.listen(PORT, HOST, () => resolve());
    server.on('error', reject);
  });

  console.log(`AidePilot API running on http://${HOST}:${PORT}`);
  return { port: PORT, host: HOST };
}

export function stopServer(): void {
  if (server) {
    server.close();
    server = null;
  }
  closeDb();
}

const isDirectRun =
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  require.main === module;

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  const shutdown = () => {
    stopServer();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
