// fsWatchHandler.js — 文件系统监听 IPC handler 注册
//
// NOTE: 使用 Node.js 内置 fs.watch，而非 chokidar。
// 选择理由：
// - 零外部依赖，不需要额外安装
// - 对于本项目的使用场景（监听 INI 文件变更），Node 内置 fs.watch 足够
// - chokidar 的主要优势（跨平台一致性、轮询回退）在当前 Electron 42 + Windows 11
//   环境下不是必需的
// - 如果未来遇到 fs.watch 的跨平台问题，可以替换为 chokidar——IPC 接口
//   (fs.watch → watcherId, fs.unwatch, fileChanged push) 保持不变
//
// ISSUE: Node.js fs.watch 的 recursive 选项在 Linux 上可能不可靠。
// 当前应用主要面向 Windows，此问题暂时不处理。如果在 Linux 上遇到问题，
// 可将底层实现替换为 chokidar，上层不变。

const fs = require("node:fs");
const path = require("node:path");
const { IPC } = require("@xxmm/ipc");

/**
 * @param {ReturnType<typeof import("@xxmm/ipc").createIPCMain>} ipc
 * @param {() => import("@xxmm/ipc").WindowIPC | null} getWinIPC — 延迟获取 winIPC（窗口创建后才可用）
 */
function register(ipc, getWinIPC) {
  /** watcherId → fs.FSWatcher */
  const watchers = new Map();

  // 累积变更事件，debounce 后批量推送（避免高频事件淹没渲染进程）
  // NOTE: 100ms debounce 是经验值，对于 INI 文件变更的 modStatusKeeper 场景足够。
  const pendingChanges = new Map(); // watcherId → FsWatchEvent[]

  function flushChanges(watcherId) {
    const winIPC = getWinIPC();
    if (!winIPC) return;

    const changes = pendingChanges.get(watcherId);
    if (!changes || changes.length === 0) return;

    pendingChanges.delete(watcherId);
    winIPC.send(IPC.lifecycle.fileChanged, watcherId, [...changes]);
  }

  ipc.handle(IPC.fs.watch, async (_event, dirPath, recursive = false) => {
    const watcherId = `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const watcher = fs.watch(dirPath, { recursive }, (eventType, filename) => {
        if (!filename) return;

        // 忽略临时文件和 swap 文件
        if (filename.startsWith(".") || filename.endsWith("~") || filename.endsWith(".swp")) {
          return;
        }

        const change = {
          event: eventType === "rename" ? "change" : eventType, // normalize
          path: path.join(dirPath, filename),
        };

        // 累积变更，100ms 后批量推送
        let pending = pendingChanges.get(watcherId);
        if (!pending) {
          pending = [];
          pendingChanges.set(watcherId, pending);
        }
        pending.push(change);

        // debounce
        clearTimeout(watcher._flushTimer);
        watcher._flushTimer = setTimeout(() => flushChanges(watcherId), 100);
      });

      watcher.on("error", (err) => {
        console.error(`[fsWatch] Watcher ${watcherId} error:`, err);
      });

      watchers.set(watcherId, watcher);
      console.log(`[fsWatch] Started watching: ${dirPath} (${watcherId})`);
      return watcherId;
    } catch (e) {
      console.error(`[fsWatch] Failed to watch ${dirPath}:`, e);
      throw e;
    }
  });

  ipc.handle(IPC.fs.unwatch, async (_event, watcherId) => {
    const watcher = watchers.get(watcherId);
    if (watcher) {
      watcher.close();
      watchers.delete(watcherId);
      pendingChanges.delete(watcherId);
      console.log(`[fsWatch] Stopped watching: ${watcherId}`);
    }
  });
}

module.exports = { register };
