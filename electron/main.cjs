const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const allowedSchemes = new Set(['file:', 'data:', 'blob:', 'devtools:']);

function isAllowedLocalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return allowedSchemes.has(parsed.protocol);
  } catch {
    return false;
  }
}

function hardenLocalSession() {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !isAllowedLocalUrl(details.url) });
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');

  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    title: 'WLKT Mechanics 材料力学求解器',
    backgroundColor: '#f4f7fb',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedLocalUrl(url)) {
      event.preventDefault();
    }
  });

  win.loadURL(pathToFileURL(indexPath).toString());
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  hardenLocalSession();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

