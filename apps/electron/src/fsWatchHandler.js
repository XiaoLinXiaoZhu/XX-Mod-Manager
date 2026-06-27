// fsWatchHandler.js — 文件系统监听 IPC handler 注册
//
// 使用 Node.js 内置 fs.watch，支持 recursive 选项。
// 变更通过 lifecycle.fileChanged push channel 通知渲染进程。

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
