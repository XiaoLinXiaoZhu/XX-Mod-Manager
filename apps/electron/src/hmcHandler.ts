// hmcHandler.ts — HMC（Hardware Mouse Control）IPC handler 注册
//
// NOTE: HMC (hmc-win32) 是 Windows-only 的 C++ 原生 Node.js 插件。
// 在非 Windows 平台上，所有 handler 返回空数组/null/无操作。
// 这是设计选择——让插件自行处理降级逻辑，而非在 IPC 层抛出异常。
//
// ISSUE: Bun 对 Node.js 原生 addon (N-API) 的兼容性不完整。
// 如果未来迁移到 Electrobun (Bun 运行时)，hmc-win32 可能无法加载。
// 详见 apps/electron/README.md。
//
// 架构决策：暴露低层 HMC API 而非封装高层 refreshGame()。
// IPC 层保持薄，插件自行组合刷新逻辑。

import { createRequire } from "node:module";
import type { IPCMain } from "@xxmm/ipc";
import { IPC } from "@xxmm/ipc";

// hmc-win32 是 CJS 原生模块，ESM 中通过 createRequire 桥接
const require = createRequire(import.meta.url);

export function register(ipc: IPCMain): void {
  // ---- 条件加载 HMC 原生模块 ----
  let HMC: {
    getProcessNameList: (name: string) => Array<{ pid: number; name: string }>;
    getProcessWindow: (pid: number) => { setFocus: (v: boolean) => void } | null;
    getForegroundWindow: () => { setFocus: (v: boolean) => void };
    sendKeyboard: (vk: number, down: boolean) => void;
  } | null = null;

  if (process.platform === "win32") {
    try {
      HMC = require("hmc-win32");
      console.log("[HMC] Native module loaded");
    } catch (e: unknown) {
      console.warn("[HMC] Not available:", (e as Error).message);
    }
  } else {
    console.log("[HMC] Skipped — not on Windows");
  }

  // NOTE: 原生窗口对象无法通过 IPC 序列化，用数字 handle 代理。
  const windowMap = new Map<number, { setFocus: (v: boolean) => void }>();
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
