// hmcHandler.js — HMC（Hardware Mouse Control）IPC handler 注册
//
// 仅在 Windows 上加载 hmc-win32 原生模块。
// 其他平台调用返回空数组/null/无操作。

const { IPC } = require("@xxmm/ipc");

function register(ipc) {
  // ---- 条件加载 HMC 原生模块 ----
  let HMC = null;
  if (process.platform === "win32") {
    try {
      HMC = require("hmc-win32");
      console.log("[HMC] Native module loaded");
    } catch (e) {
      console.warn("[HMC] Not available:", e.message);
    }
  } else {
    console.log("[HMC] Skipped — not on Windows");
  }

  // 存储 getProcessWindow / getForegroundWindow 返回的原生窗口对象。
  // key 为数字 handle（返回给渲染进程），value 为原生窗口对象。
  const windowMap = new Map();
  let nextHandle = 1;

  ipc.handle(IPC.hmc.getProcessList, async (_event, name) => {
    if (!HMC) return [];
    try {
      return HMC.getProcessNameList(name);
    } catch (e) {
      console.error("[HMC] getProcessList error:", e);
      return [];
    }
  });

  ipc.handle(IPC.hmc.getProcessWindow, async (_event, pid) => {
    if (!HMC) return null;
    try {
      const win = HMC.getProcessWindow(pid);
      if (!win) return null;
      const handle = nextHandle++;
      windowMap.set(handle, win);
      return handle;
    } catch (e) {
      console.error("[HMC] getProcessWindow error:", e);
      return null;
    }
  });

  ipc.handle(IPC.hmc.getForegroundWindow, async () => {
    if (!HMC) return 0;
    try {
      const win = HMC.getForegroundWindow();
      if (!win) return 0;
      const handle = nextHandle++;
      windowMap.set(handle, win);
      return handle;
    } catch (e) {
      console.error("[HMC] getForegroundWindow error:", e);
      return 0;
    }
  });

  ipc.handle(IPC.hmc.sendKey, async (_event, vk, down) => {
    if (!HMC) return;
    try {
      HMC.sendKeyboard(vk, down);
    } catch (e) {
      console.error("[HMC] sendKey error:", e);
    }
  });

  ipc.handle(IPC.hmc.setFocus, async (_event, hwnd) => {
    const win = windowMap.get(hwnd);
    if (win) {
      try {
        win.setFocus(true);
      } catch (e) {
        console.error("[HMC] setFocus error:", e);
      } finally {
        windowMap.delete(hwnd);
      }
    }
  });
}

module.exports = { register };
