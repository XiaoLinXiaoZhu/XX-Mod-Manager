const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
    fs: {
        readFileSync: fs.readFileSync,
        readdir: fs.readdir,
        statSync: fs.statSync,
        existsSync: fs.existsSync
    },
    path: {
        join: path.join,
        resolve: path.resolve
    }
});