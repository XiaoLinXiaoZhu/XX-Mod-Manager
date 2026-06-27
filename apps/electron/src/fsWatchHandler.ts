// fsWatchHandler.ts — 文件系统监听 IPC handler 注册
//
// NOTE: 使用 Node.js 内置 fs.watch，而非 chokidar。
// 选择理由：零外部依赖；对于 INI 文件变更场景足够。
// 如果未来遇到跨平台问题，替换 chokidar 时 IPC 接口保持不变。

import fs from "node:fs";
import path from "node:path";
import type { IPCMain, WindowIPC } from "@xxmm/ipc";
import { IPC } from "@xxmm/ipc";
import type { FsWatchEvent } from "@xxmm/types";

export function register(
  ipc: IPCMain,
  getWinIPC: () => WindowIPC | null,
): void {
  const watchers = new Map<string, fs.FSWatcher>();
  const pendingChanges = new Map<string, FsWatchEvent[]>();

  function flushChanges(watcherId: string): void {
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

        const change: FsWatchEvent = {
          event: eventType === "rename" ? "change" : eventType as FsWatchEvent["event"],
          path: path.join(dirPath, filename),
        };

        let pending = pendingChanges.get(watcherId);
        if (!pending) {
          pending = [];
          pendingChanges.set(watcherId, pending);
        }
        pending.push(change);

        // debounce 100ms
        clearTimeout((watcher as Record<string, unknown>)._flushTimer as number | undefined);
        (watcher as Record<string, unknown>)._flushTimer = setTimeout(
          () => flushChanges(watcherId),
          100,
        );
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
