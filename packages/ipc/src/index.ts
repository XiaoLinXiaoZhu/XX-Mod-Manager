// @xxmm/ipc — 类型安全的 Electron IPC 层（支持嵌套命名空间）
//
// 快速开始：
//   渲染进程:
//     const ipc = createClient(IPC);
//     await ipc.window.minimize();        // handle → Promise
//     await ipc.fs.readFile("/path");     // handle → Promise
//     ipc.app.snack("hello");             // send → void
//     ipc.on(IPC.lifecycle.wakeUp, fn);   // push → 监听
//
//   主进程:
//     const ipc = createIPCMain();
//     ipc.handle(IPC.window.minimize, handler);
//     const win = createWindowIPC(mainWindow);
//     win.send(IPC.lifecycle.wakeUp);

// channel 定义
export { h, s, p } from "./channel";
export type {
  HandleChannel,
  SendChannel,
  PushChannel,
  AnyChannel,
  HandleHandler,
  SendHandler,
  PushHandler,
} from "./channel";

// 预定义的 channel 集合
export { IPC } from "./channels";

// 渲染进程客户端
export { createClient } from "./client";
export type { IPCClient, IPCClientOn, ChannelTree, DeepClient } from "./client";

// 主进程工具
export { createIPCMain, createWindowIPC } from "./main";
export type { IPCMain, WindowIPC } from "./main";
