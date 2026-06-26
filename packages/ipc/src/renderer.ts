// renderer.ts — 渲染进程侧 IPC 工具
//
// 使用方式：
//   const ipc = createIPCRenderer();
//   const mods = await ipc.invoke(GetMods, modSourcePath);
//   ipc.send(Snack, "hello", "info");
//   const unsub = ipc.on(WakeUp, (event) => { ... });

import type { IpcRendererEvent } from "electron";
import type { HandleChannel, PushChannel, SendChannel } from "./channel";

// ---- 内部：惰性获取 electron 模块 ----

function getIpcRenderer(): Electron.IpcRenderer {
  return require("electron").ipcRenderer;
}

// ---- IPCRenderer：渲染进程调用 ----

export interface IPCRenderer {
  /** 调用主进程的 handle handler，返回 Promise */
  invoke<Name extends string, Req extends unknown[], Res>(
    channel: HandleChannel<Name, Req, Res>,
    ...args: Req
  ): Promise<Res>;

  /** 向主进程单向发送消息 */
  send<Name extends string, Req extends unknown[]>(
    channel: SendChannel<Name, Req>,
    ...args: Req
  ): void;

  /** 监听来自主进程的推送消息，返回取消订阅函数 */
  on<Name extends string, Req extends unknown[]>(
    channel: PushChannel<Name, Req>,
    handler: (event: IpcRendererEvent, ...args: Req) => void,
  ): () => void;
}

/** 创建渲染进程 IPC 客户端 */
export function createIPCRenderer(): IPCRenderer {
  const ipcRenderer = getIpcRenderer();
  return {
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel.name, ...args);
    },
    send(channel, ...args) {
      ipcRenderer.send(channel.name, ...args);
    },
    on(channel, handler) {
      // wrapped 是类型不安全的桥接层（外部 API 由泛型保证安全）
      const wrapped = (event: IpcRendererEvent, ...args: unknown[]) => {
        (handler as (event: IpcRendererEvent, ...args: unknown[]) => void)(
          event,
          ...args,
        );
      };
      ipcRenderer.on(channel.name, wrapped);
      return () => {
        ipcRenderer.removeListener(channel.name, wrapped);
      };
    },
  };
}
