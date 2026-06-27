// main.js — 类型安全 IPC 迁移版
// 使用 @xxmm/ipc 的 createIPCMain / createWindowIPC 替代裸 ipcMain.handle/on
const { app, BrowserWindow, screen } = require("electron");
const _path = require("node:path");
const { createIPCMain, createWindowIPC, IPC } = require("@xxmm/ipc");
const { parseBoundsStr, parseWindowBounds } = require("@xxmm/types");

const ipc = createIPCMain();

require("./fileSystem.js");
require("./hmcHandler.js").register(ipc);
const setMainWindow = require("./fileSystem.js").setMainWindow;
const setCustomConfigFolder =
  require("./fileSystem.js").setCustomConfigFolder;

let currentMainWindow;
let winIPC = null; // 窗口创建后赋值

// ---- 启动参数解析 ----

let devMode = false;
devMode = process.argv.includes("--dev");
console.log("process.argv", process.argv);

let firstpage = false;
firstpage = process.argv.includes("--firstpage");
console.log("firstpage", firstpage);

let switchConfig = false;
switchConfig = process.argv.includes("--switchConfig");
console.log("switchConfig", switchConfig);

let devTools = false;
devTools = process.argv.includes("--devTools");
console.log("devTools", devTools);

let ifCustomConfig = false;
ifCustomConfig = process.argv.includes("--customConfig");
console.log("customConfig", ifCustomConfig);

let customConfigFolder = "";
if (ifCustomConfig) {
  const index = process.argv.indexOf("--customConfig");
  customConfigFolder = process.argv[index + 1];
  console.log("customConfigFolder", customConfigFolder);
  setCustomConfigFolder(customConfigFolder);
}

// ---- 渲染进程获取参数 (handle) ----
ipc.handle(IPC.app.getArgs, async () => {
  return {
    devMode: devMode,
    firstpage: firstpage,
    switchConfig: switchConfig,
    devTools: devTools,
    ifCustomConfig: ifCustomConfig,
    customConfigFolder: customConfigFolder,
  };
});

// ---- 获取参数的同步版本 (send) ----
ipc.on(IPC.app.getArgsSync, (event) => {
  //debug
  console.log("get-args-sync", {
    devMode: devMode,
    firstpage: firstpage,
    switchConfig: switchConfig,
    devTools: devTools,
    ifCustomConfig: ifCustomConfig,
    customConfigFolder: customConfigFolder,
  });
  event.returnValue = {
    devMode: devMode,
    firstpage: firstpage,
    switchConfig: switchConfig,
    devTools: devTools,
    ifCustomConfig: ifCustomConfig,
    customConfigFolder: customConfigFolder,
  };
});

// ---- 设置自定义配置文件夹 (send) ----
ipc.on(IPC.config.setCustomFolderSend, (_event, folder) => {
  console.log("set-custom-config-folder", folder);
  ifCustomConfig = true;
  customConfigFolder = folder;
  setCustomConfigFolder(folder);
});

// ---- 创建窗口 ----
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  currentMainWindow = mainWindow;
  setMainWindow(mainWindow);
  winIPC = createWindowIPC(mainWindow);

  // ---- 监听窗口显隐 ----
  currentMainWindow.on("blur", () => {
    console.debug("window blur");
    winIPC.send(IPC.lifecycle.windowBlur);
  });

  currentMainWindow.on("focus", () => {
    console.debug("window focus");
    winIPC.send(IPC.lifecycle.windowFocus);
  });

  //debug
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
    mainWindow.loadFile("dist/index.html");
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

// ---- 唤醒机制 ----
let wakeUpCondition = 0;
const wakeUpNeeds = 2;

function sendWakeUp() {
  if (currentMainWindow && winIPC) {
    //debug
    console.log("send wakeUp", currentMainWindow == null);
    winIPC.send(IPC.lifecycle.wakeUp);
  }
}

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

  // Map legacy arg values to new monorepo paths
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
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (devMode) {
    newWindow.loadURL(`http://localhost:3000/${pagePath}/index.html`);
  } else {
    const path = require("node:path");
    const filePath = path.join(
      __dirname,
      `../../../dist/${pagePath}/index.html`,
    );
    console.log("filePath", filePath);
    newWindow.loadFile(filePath);
  }
});

// ---- 刷新主窗口 (send) ----
ipc.on(IPC.mod.refresh, (_event) => {
  currentMainWindow.reload();
});

// ---- 窗口控制 (handle) ----

ipc.handle(IPC.window.minimize, async () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipc.handle(IPC.window.maximize, async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipc.handle(IPC.window.close, async () => {
  BrowserWindow.getFocusedWindow().close();
});

ipc.handle(IPC.window.toggleFullscreen, async () => {
  const win = BrowserWindow.getFocusedWindow();
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
  win.setAlwaysOnTop(true);
  //debug
  console.log("pin-window", win.isAlwaysOnTop());
  return true;
});

ipc.handle(IPC.window.unpin, async () => {
  const win = BrowserWindow.getFocusedWindow();
  win.setAlwaysOnTop(false);
  //debug
  console.log("unpin-window", win.isAlwaysOnTop());
  return false;
});

// 设置窗口大小
ipc.handle(IPC.window.setBounds, async (event, boundsStr) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    // 边界校验：parseBoundsStr 校验品牌类型，parseWindowBounds 解析为结构化对象
    const bounds = parseWindowBounds(parseBoundsStr(boundsStr));
    //debug
    console.log("set-bounds", bounds, win == null);

    if (win && bounds) {
      const screenArea = screen.getDisplayMatching(bounds).workArea;

      // 如果 bounds 的 x,y 为 -1，表示居中
      if (bounds.x === -1 || bounds.y === -1) {
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        //debug
        console.log("set-bounds", { x: x, y: y, width: width, height: height });
        win.setBounds({ x: x, y: y, width: width, height: height });
      } else if (
        bounds.x + bounds.width > screenArea.x + screenArea.width ||
        bounds.x > screenArea.x + screenArea.width ||
        bounds.x < screenArea.x ||
        bounds.y + bounds.height > screenArea.y + screenArea.height ||
        bounds.y > screenArea.y + screenArea.height ||
        bounds.y < screenArea.y
      ) {
        // 适配并居中到屏幕区域
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        //debug
        console.log("set-bounds", { x: x, y: y, width: width, height: height });
        win.setBounds({ x: x, y: y, width: width, height: height });
      } else {
        win.setBounds(bounds);
      }
    }
  } catch (e) {
    console.error("set-bounds", e);
  }
});

// ---- 通知转发 (send → 手动 push 到主窗口) ----
// snack 按 SendChannel 接收，再通过 webContents.send 转发到主窗口渲染进程
// NOTE: snack 在 channels.ts 中定义为 SendChannel，这里的手动转发不经过类型系统
ipc.on(IPC.app.snack, (_event, message, type = "info") => {
  currentMainWindow.webContents.send("snack", message, type);
});

require("./fsWatchHandler.js").register(ipc, () => winIPC);

module.exports = {
  currentMainWindow,
  getMainWindow: () => {
    return currentMainWindow;
  },
};
