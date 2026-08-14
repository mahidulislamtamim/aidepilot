const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure we never accidentally run Electron as plain Node
delete process.env.ELECTRON_RUN_AS_NODE;

const isDev = !app.isPackaged;
const API_PORT = process.env.AIDEPLOT_PORT || '3847';
const API_HOST = '127.0.0.1';

let mainWindow = null;
let stopServer = null;
let isQuitting = false;

function getAppRoot() {
  return isDev ? path.join(__dirname, '..') : app.getAppPath();
}

function getStaticDir() {
  return path.join(getAppRoot(), 'frontend', 'dist');
}

function getSchemaPath() {
  return path.join(getAppRoot(), 'backend', 'dist', 'db', 'schema.sql');
}

function getSqlJsDir() {
  const roots = [
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist'),
    path.join(getAppRoot(), 'node_modules', 'sql.js', 'dist'),
    path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist'),
  ];
  for (const dir of roots) {
    if (dir && fs.existsSync(path.join(dir, 'sql-wasm.wasm'))) return dir;
  }
  return roots[0];
}

function getDataDir() {
  return path.join(app.getPath('userData'), 'data');
}

function configureBackendEnv() {
  process.env.PORT = String(API_PORT);
  process.env.HOST = API_HOST;
  process.env.AIDEPLOT_DATA_DIR = getDataDir();
  process.env.AIDEPLOT_STATIC_DIR = getStaticDir();
  process.env.AIDEPLOT_SCHEMA_PATH = getSchemaPath();
  process.env.AIDEPLOT_SQLJS_DIR = getSqlJsDir();
}

async function startBackend() {
  configureBackendEnv();

  const entry = path.join(getAppRoot(), 'backend', 'dist', 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Backend entry not found at ${entry}. Run "npm run build" before launching Electron.`
    );
  }

  // Clear require cache so restarts pick up env-sensitive module init
  try {
    delete require.cache[require.resolve(entry)];
  } catch {
    /* ignore */
  }

  const backend = require(entry);
  if (typeof backend.startServer !== 'function') {
    throw new Error('Backend startServer() export is missing');
  }

  await backend.startServer();
  stopServer = typeof backend.stopServer === 'function' ? backend.stopServer : null;
}

function shutdownBackend() {
  try {
    if (typeof stopServer === 'function') stopServer();
  } catch (err) {
    console.error('Failed to stop backend:', err);
  }
  stopServer = null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'AidePilot',
    backgroundColor: '#0f1117',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Dev with Vite: use AIDEPLOT_ELECTRON_VITE=1 and keep npm run dev running
  if (isDev && process.env.AIDEPLOT_ELECTRON_VITE === '1') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await startBackend();
    await mainWindow.loadURL(`http://${API_HOST}:${API_PORT}`);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (err) {
    console.error(err);
    const detail = err && err.message ? err.message : String(err);
    dialog.showErrorBox(
      'AidePilot failed to start',
      `${detail}\n\nIf the port is in use, close other AidePilot windows and try again.`
    );
    shutdownBackend();
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  shutdownBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((err) => {
      dialog.showErrorBox('AidePilot failed to start', err.message || String(err));
    });
  }
});
