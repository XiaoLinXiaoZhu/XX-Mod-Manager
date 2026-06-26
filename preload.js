const { contextBridge } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

contextBridge.exposeInMainWorld("electronAPI", {
	fs: {
		readFileSync: fs.readFileSync,
		readdir: fs.readdir,
		statSync: fs.statSync,
		existsSync: fs.existsSync,
	},
	path: {
		join: path.join,
		resolve: path.resolve,
	},
});
