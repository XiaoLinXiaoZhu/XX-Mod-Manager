// preload.ts — Electron preload 脚本
//
// 在 contextIsolation: true 下，这是渲染进程访问主进程的唯一桥梁。
// contextBridge.exposeInMainWorld 将安全 API 暴露到 window.electronAPI。
//
// WIP: 当前仅暴露最小 IPC 接口。原有代码中直接 require('@xxmm/ipc')、
// require('electron')、require('fs') 的调用需要迁移到 window.electronAPI 或
// 通过 ctx.ipc（插件系统）访问。

import { contextBridge, ipcRenderer } from "electron";

export type ElectronAPI = {
  ipc: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    send: (channel: string, ...args: unknown[]) => void;
    on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  };
};

const api: ElectronAPI = {
  ipc: {
    invoke: (channel: string, ...args: unknown[]) =>
      ipcRenderer.invoke(channel, ...args),

    send: (channel: string, ...args: unknown[]) =>
      ipcRenderer.send(channel, ...args),

    on: (channel: string, callback: (...args: unknown[]) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);
