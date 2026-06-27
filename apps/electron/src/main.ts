// main.ts — Electron 主进程入口（ESM + TypeScript）
//
// bun build 将本文件及其依赖打包为 dist/main.mjs，由 Electron 执行。
// 开发：bun build --watch → electron dist/main.mjs
// 生产：bun build --minify → electron-builder

import { app, BrowserWindow, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createIPCMain, createWindowIPC, IPC } from "@xxmm/ipc";
import { parseBoundsStr, parseWindowBounds } from "@xxmm/types";

// 导入 handler 注册模块（副作用导入——各自调用 register(ipc)）
import "./hmcHandler.ts";
import "./fsWatchHandler.ts";

// preload 脚本路径
import { fileURLToPath as _fileURLToPath } from "node:url";
const __filename = _fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRELOAD_PATH = path.join(__dirname, "preload.mjs");


// fileSystem.js 仍是 CJS——bun build 处理 CJS/ESM 互操作
import {
  setMainWindow,
  setCustomConfigFolder,
} from "./fileSystem.js";

// ---- 初始化 ----
const ipc = createIPCMain();

let currentMainWindow: BrowserWindow | undefined;
let winIPC: ReturnType<typeof createWindowIPC> | null = null;

// ---- 启动参数解析 ----
let devMode = process.argv.includes("--dev");
console.log("process.argv", process.argv);

let firstpage = process.argv.includes("--firstpage");
console.log("firstpage", firstpage);

let switchConfig = process.argv.includes("--switchConfig");
console.log("switchConfig", switchConfig);

let devTools = process.argv.includes("--devTools");
console.log("devTools", devTools);

let ifCustomConfig = process.argv.includes("--customConfig");
console.log("customConfig", ifCustomConfig);

let customConfigFolder = "";
if (ifCustomConfig) {
  const index = process.argv.indexOf("--customConfig");
  customConfigFolder = process.argv[index + 1]!;
  console.log("customConfigFolder", customConfigFolder);
  setCustomConfigFolder(customConfigFolder);
}

// ---- 渲染进程获取参数 (handle) ----
ipc.handle(IPC.app.getArgs, async () => {
  return {
    devMode,
    firstpage,
    switchConfig,
    devTools,
    ifCustomConfig,
    customConfigFolder,
  };
});

// ---- 获取参数的同步版本 (send) ----
ipc.on(IPC.app.getArgsSync, (event) => {
  console.log("get-args-sync", {
    devMode,
    firstpage,
    switchConfig,
    devTools,
    ifCustomConfig,
    customConfigFolder,
  });
  event.returnValue = {
    devMode,
    firstpage,
    switchConfig,
    devTools,
    ifCustomConfig,
    customConfigFolder,
  };
});

// ---- 设置自定义配置文件夹 (send) ----
ipc.on(IPC.config.setCustomFolderSend, (_event, folder) => {
  console.log("set-custom-config-folder", folder);
  ifCustomConfig = true;
  customConfigFolder = folder;
  setCustomConfigFolder(folder);
});

// ---- 唤醒机制 ----
let wakeUpCondition = 0;
const wakeUpNeeds = 2;

function sendWakeUp() {
  if (currentMainWindow && winIPC) {
    console.log("send wakeUp", currentMainWindow == null);
    winIPC.send(IPC.lifecycle.wakeUp);
  }
}

// ---- 创建窗口 ----
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
  });

  currentMainWindow = mainWindow;
  setMainWindow(mainWindow);
  winIPC = createWindowIPC(mainWindow);

  currentMainWindow.on("blur", () => {
    console.debug("window blur");
    winIPC!.send(IPC.lifecycle.windowBlur);
  });

  currentMainWindow.on("focus", () => {
    console.debug("window focus");
    winIPC!.send(IPC.lifecycle.windowFocus);
  });

  console.log("===== createWindow =====");

  if (devMode) {
    mainWindow.loadURL("http://localhost:3000/");
    if (firstpage) {
      mainWindow.loadURL(
        "http://localhost:3000/apps/desktop/first-load/index.html",
      );
    }
    if (switchConfig) {
      mainWindow.loadURL(
        "http://localhost:3000/apps/desktop/switch-config/index.html",
      );
    }
    if (devTools) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    // NOTE: 生产模式路径。bun build 打包后 __dirname 指向输出目录。
    // 当前假设输出在 apps/electron/dist/，HTML 在 dist/ 下（Vite 构建产物）。
    const projectRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../..",
    );
    mainWindow.loadFile(path.join(projectRoot, "dist/index.html"));
  }

  mainWindow.setMenuBarVisibility(false);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    console.log("main window is ready");
  });
};

// ---- 应用就绪 ----
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  console.log("===== createWindow end =====");
  wakeUpCondition++;
  console.log("wakeUp condition count", wakeUpCondition);
  if (wakeUpCondition === wakeUpNeeds) {
    sendWakeUp();
  }
});

// ---- 主窗口就绪（渲染进程通知）----
ipc.on(IPC.app.mainWindowReady, (_event) => {
  console.log("main-window-ready", currentMainWindow == null);
  wakeUpCondition++;
  console.log("wakeUp condition count", wakeUpCondition);
  if (wakeUpCondition === wakeUpNeeds) {
    sendWakeUp();
  }
});

// ---- 应用生命周期 ----
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("web-contents-created", (_e, contents) => {
  contents.on("crashed", () => {
    if (!contents.isDestroyed()) {
      contents.reload();
    }
  });
});

app.on("render-process-gone", (_e, webContents, details) => {
  console.log("render-process-gone", details);
  if (!webContents.isDestroyed()) {
    webContents.reload();
  }
});

// ---- 新窗口 (send) ----
ipc.on(IPC.mod.openNewWindow, (_event, arg) => {
  console.log("open-new-window", arg);

  const pagePath =
    arg === "firstLoad"
      ? "apps/desktop/first-load"
      : arg === "switchConfig"
        ? "apps/desktop/switch-config"
        : arg;

  const newWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
  });

  if (devMode) {
    newWindow.loadURL(`http://localhost:3000/${pagePath}/index.html`);
  } else {
    const projectRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../..",
    );
    const filePath = path.join(projectRoot, `dist/${pagePath}/index.html`);
    console.log("filePath", filePath);
    newWindow.loadFile(filePath);
  }
});

// ---- 刷新主窗口 (send) ----
ipc.on(IPC.mod.refresh, (_event) => {
  currentMainWindow?.reload();
});

// ---- 窗口控制 (handle) ----
ipc.handle(IPC.window.minimize, async () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

ipc.handle(IPC.window.maximize, async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipc.handle(IPC.window.close, async () => {
  BrowserWindow.getFocusedWindow()?.close();
});

ipc.handle(IPC.window.toggleFullscreen, async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return false;
  if (win.isFullScreen()) {
    win.setFullScreen(false);
    return false;
  } else {
    win.setFullScreen(true);
    return true;
  }
});

ipc.handle(IPC.window.pin, async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return false;
  win.setAlwaysOnTop(true);
  console.log("pin-window", win.isAlwaysOnTop());
  return true;
});

ipc.handle(IPC.window.unpin, async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return false;
  win.setAlwaysOnTop(false);
  console.log("unpin-window", win.isAlwaysOnTop());
  return false;
});

ipc.handle(IPC.window.setBounds, async (event, boundsStr) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const bounds = parseWindowBounds(parseBoundsStr(boundsStr));
    console.log("set-bounds", bounds, win == null);

    if (win && bounds) {
      const screenArea = screen.getDisplayMatching(bounds).workArea;

      if (bounds.x === -1 || bounds.y === -1) {
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        console.log("set-bounds", { x, y, width, height });
        win.setBounds({ x, y, width, height });
      } else if (
        bounds.x + bounds.width > screenArea.x + screenArea.width ||
        bounds.x > screenArea.x + screenArea.width ||
        bounds.x < screenArea.x ||
        bounds.y + bounds.height > screenArea.y + screenArea.height ||
        bounds.y > screenArea.y + screenArea.height ||
        bounds.y < screenArea.y
      ) {
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        console.log("set-bounds", { x, y, width, height });
        win.setBounds({ x, y, width, height });
      } else {
        win.setBounds(bounds);
      }
    }
  } catch (e) {
    console.error("set-bounds", e);
  }
});

// ---- 通知转发 (send → 手动 push 到主窗口) ----
ipc.on(IPC.app.snack, (_event, message, type = "info") => {
  currentMainWindow?.webContents.send("snack", message, type);
});

// ---- 导出（供 fileSystem.js 等外部模块引用）----
export { currentMainWindow };
export const getMainWindow = () => currentMainWindow;
