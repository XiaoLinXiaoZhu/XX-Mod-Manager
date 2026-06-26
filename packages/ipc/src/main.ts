// main.ts — 主进程侧 IPC 工具
//
//   const ipc = createIPCMain();
//   ipc.handle(IPC.getMods, async (event, modSourcePath) => { ... });
//   ipc.on(IPC.snack, (event, message, type) => { ... });
//
//   const winIPC = createWindowIPC(mainWindow);
//   winIPC.send(IPC.wakeUp);

import type { IpcMainEvent, IpcMainInvokeEvent, BrowserWindow } from "electron";
import type { HandleChannel, PushChannel, SendChannel } from "./channel";

function getIpcMain(): Electron.IpcMain {
  return require("electron").ipcMain;
}

// ---- IPCMain ----

export interface IPCMain {
  handle<Name extends string, Req extends unknown[], Res>(
    channel: HandleChannel<Name, Req, Res>,
    handler: (
      event: IpcMainInvokeEvent,
      ...args: Req
    ) => Res | Promise<Res>,
  ): void;

  on<Name extends string, Req extends unknown[]>(
    channel: SendChannel<Name, Req>,
    handler: (event: IpcMainEvent, ...args: Req) => void,
  ): void;
}

export function createIPCMain(): IPCMain {
  const ipcMain = getIpcMain();
  return {
    handle(channel, handler) {
      ipcMain.handle(channel.name, handler as (...args: unknown[]) => unknown);
    },
    on(channel, handler) {
      ipcMain.on(channel.name, handler as (...args: unknown[]) => void);
    },
  };
}

// ---- WindowIPC ----

export interface WindowIPC {
  send<Name extends string, Req extends unknown[]>(
    channel: PushChannel<Name, Req>,
    ...args: Req
  ): void;
}

export function createWindowIPC(window: BrowserWindow): WindowIPC {
  return {
    send(channel, ...args) {
      window.webContents.send(channel.name, ...args);
    },
  };
}
