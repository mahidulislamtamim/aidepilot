import cors from 'cors';
import express from 'express';
import { closeDb, initDb } from './db/database';
import environmentsRouter from './routes/environments';
import foldersRouter from './routes/folders';
import historyRouter from './routes/history';
import requestsRouter from './routes/requests';
import workspacesRouter from './routes/workspaces';

const app = express();
const PORT = process.env.PORT || 3001;

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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

async function start() {
  await initDb();

  const server = app.listen(PORT, () => {
    console.log(`AidePilot API running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', () => {
    server.close();
    closeDb();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
