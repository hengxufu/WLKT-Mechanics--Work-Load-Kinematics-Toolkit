const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('wlktDesktop', Object.freeze({
  offlineOnly: true,
  platform: process.platform,
}));

