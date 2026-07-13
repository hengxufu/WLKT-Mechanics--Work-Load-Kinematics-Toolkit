const { app, BrowserWindow, Menu, protocol, session } = require('electron');
const { existsSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const appScheme = 'wlkt';
const appHost = 'app';
const allowedSchemes = new Set([`${appScheme}:`, 'data:', 'blob:', 'devtools:']);
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.ttf', 'font/ttf'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

protocol.registerSchemesAsPrivileged([
  {
    scheme: appScheme,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
    },
  },
]);

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

function createProtocolResponse(status, body, contentType = 'text/plain; charset=utf-8') {
  return new Response(body, {
    status,
    headers: {
      'content-type': contentType,
      'cache-control': 'no-store',
    },
  });
}

function registerAppProtocol() {
  const distRoot = path.resolve(app.getAppPath(), 'dist');
  const distRootWithSeparator = `${distRoot}${path.sep}`.toLowerCase();

  protocol.handle(appScheme, (request) => {
    const url = new URL(request.url);
    if (url.hostname !== appHost) {
      return createProtocolResponse(404, 'Not found');
    }

    const requestPath = decodeURIComponent(url.pathname);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const targetPath = path.resolve(distRoot, relativePath);
    const normalizedTargetPath = targetPath.toLowerCase();

    if (normalizedTargetPath !== distRoot.toLowerCase() && !normalizedTargetPath.startsWith(distRootWithSeparator)) {
      return createProtocolResponse(403, 'Forbidden');
    }

    if (!existsSync(targetPath) || statSync(targetPath).isDirectory()) {
      return createProtocolResponse(404, 'Not found');
    }

    const extension = path.extname(targetPath).toLowerCase();
    const contentType = mimeTypes.get(extension) || 'application/octet-stream';
    return createProtocolResponse(200, readFileSync(targetPath), contentType);
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');

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
  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedLocalUrl(url)) {
      event.preventDefault();
    }
  });

  win.loadURL(`${appScheme}://${appHost}/index.html`);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerAppProtocol();
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
