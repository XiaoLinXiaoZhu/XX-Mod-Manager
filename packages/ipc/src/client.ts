// client.ts — 渲染进程 IPC 客户端（支持嵌套命名空间）
//
// createClient(IPC) 将嵌套 channel 定义转换为嵌套调用对象：
//
//   const ipc = createClient(IPC);
//   await ipc.window.minimize();              // handle channel
//   await ipc.fs.readFile("/path");           // handle channel
//   ipc.app.snack("hello", "info");           // send channel
//   const unsub = ipc.on(IPC.lifecycle.wakeUp, handler);  // push → .on()

import type { IpcRendererEvent } from "electron";
import type {
  AnyChannel,
  HandleChannel,
  PushChannel,
  SendChannel,
} from "./channel";

// ---- 类型：递归映射 channel 定义到 client 方法 ----

/** channel 定义树：叶子是 AnyChannel，分支是嵌套记录 */
export type ChannelTree = AnyChannel | { [key: string]: ChannelTree };

/** 将 channel 定义树映射为 client 方法树 */
export type DeepClient<T> = T extends HandleChannel<string, infer Req, infer Res>
  ? (...args: Req) => Promise<Res>
  : T extends SendChannel<string, infer Req>
    ? (...args: Req) => void
    : T extends AnyChannel
      ? never // PushChannel → 不作为方法暴露
      : T extends { [key: string]: unknown }
        ? { [K in keyof T]: DeepClient<T[K]> }
        : never;

// ---- IPCClientOn（顶层 on 方法）----

export interface IPCClientOn {
  /** 监听主进程推送，返回取消订阅函数 */
  on<Name extends string, Req extends unknown[]>(
    channel: PushChannel<Name, Req>,
    handler: (event: IpcRendererEvent, ...args: Req) => void,
  ): () => void;
}

/** createClient 完整返回类型 */
export type IPCClient<T extends Record<string, ChannelTree>> = DeepClient<T> &
  IPCClientOn;

// ---- 实现 ----

function getIpcRenderer(): Electron.IpcRenderer {
  return require("electron").ipcRenderer;
}

function buildClient(
  tree: Record<string, unknown>,
  ipcRenderer: Electron.IpcRenderer,
): unknown {
  const node: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(tree)) {
    if (value !== null && typeof value === "object" && "_mode" in value) {
      const ch = value as AnyChannel;
      if (ch._mode === "handle") {
        node[key] = (...args: unknown[]) =>
          ipcRenderer.invoke(ch.name, ...args);
      } else if (ch._mode === "send") {
        node[key] = (...args: unknown[]) =>
          ipcRenderer.send(ch.name, ...args);
      }
      // push 不生成方法
    } else if (value !== null && typeof value === "object") {
      // 嵌套组：递归
      node[key] = buildClient(
        value as Record<string, unknown>,
        ipcRenderer,
      );
    }
  }

  return node;
}

/** 创建渲染进程 IPC 客户端 */
export function createClient<T extends Record<string, ChannelTree>>(
  channels: T,
): IPCClient<T> {
  const ipcRenderer = getIpcRenderer();

  const client = buildClient(
    channels as Record<string, unknown>,
    ipcRenderer,
  ) as Record<string, unknown>;

  // 顶层挂载 on 方法
  client.on = (
    channel: PushChannel,
    handler: (event: IpcRendererEvent, ...args: unknown[]) => void,
  ) => {
    const wrapped = (event: IpcRendererEvent, ...args: unknown[]) => {
      handler(event, ...args);
    };
    ipcRenderer.on(channel.name, wrapped);
    return () => {
      ipcRenderer.removeListener(channel.name, wrapped);
    };
  };

  return client as IPCClient<T>;
}
