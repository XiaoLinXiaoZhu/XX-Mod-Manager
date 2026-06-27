// hmcHandler.js — HMC（Hardware Mouse Control）IPC handler 注册
//
// NOTE: HMC (hmc-win32) 是 Windows-only 的 C++ 原生 Node.js 插件。
// 在非 Windows 平台上，所有 handler 返回空数组/null/无操作。
// 这是设计选择——让插件自行处理降级逻辑，而非在 IPC 层抛出异常。
//
// ISSUE: Bun 对 Node.js 原生 addon (N-API) 的兼容性不完整。
// 如果未来迁移到 Electrobun (Bun 运行时)，hmc-win32 可能无法加载。
// 届时需要评估：1) 用 Bun FFI 重写 HMC 调用；2) 或等待 Bun N-API 支持完善。
//
// 架构决策：暴露低层 HMC API（getProcessList / sendKey / setFocus），
// 而非封装高层 refreshGame(processName, vk)。原因：
// - IPC 层保持薄，插件自行组合逻辑
// - 不同游戏可能有不同的刷新序列，封装会限制灵活性
// - 旧的 refreshAfterApplyPlugin 的 sendKey + setFocus 序列本身就是插件业务逻辑

const { IPC } = require("@xxmm/ipc");

function register(ipc) {
  // ---- 条件加载 HMC 原生模块 ----
  let HMC = null;
  if (process.platform === "win32") {
    try {
      HMC = require("hmc-win32");
      console.log("[HMC] Native module loaded");
    } catch (e) {
      // ISSUE: hmc-win32 未安装时静默降级，插件调用返回空值。
      // 好处是不会阻止应用启动，坏处是用户不知道功能缺失。
      // TODO: 未来可加 snack 通知告知用户 HMC 不可用。
      console.warn("[HMC] Not available:", e.message);
    }
  } else {
    console.log("[HMC] Skipped — not on Windows");
  }

  // 存储 getProcessWindow / getForegroundWindow 返回的原生窗口对象。
  // key 为数字 handle（返回给渲染进程），value 为原生窗口对象。
  // NOTE: 原生窗口对象无法通过 IPC 序列化，因此用数字 handle 代理。
  // 渲染进程拿到 handle 后回传 setFocus(handle)，主进程查找实际窗口对象执行。
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
