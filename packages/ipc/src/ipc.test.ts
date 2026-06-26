// @xxmm/ipc 测试（嵌套命名空间）
//
// 运行：bun test packages/ipc/src/ipc.test.ts

import { describe, test, expect, mock, beforeEach } from "bun:test";
import { h, s, p } from "./channel";
import { createIPCMain, createWindowIPC } from "./main";
import { createClient } from "./client";

// ---- 测试用嵌套 channel 定义 ----

const TestIPC = {
  window: {
    minimize: h<[], void>("minimize-window"),
    setBounds: h<[boundsStr: string], void>("set-bounds"),
  },
  fs: {
    readFile: h<[path: string], string>("fs-read-file"),
    readDir: h<[path: string], string[]>("fs-read-dir"),
  },
  app: {
    snack: s<[message: string, type?: string]>("snack"),
    mainWindowReady: s("main-window-ready"),
  },
  lifecycle: {
    wakeUp: p("wakeUp"),
    windowBlur: p("windowBlur"),
  },
} as const;

// ---- mock electron ----

const mockIpcMain = { handle: mock(), on: mock() };
const mockIpcRenderer = {
  invoke: mock(),
  send: mock(),
  on: mock(),
  removeListener: mock(),
};
const mockWebContents = { send: mock() };
const mockBrowserWindow = { webContents: mockWebContents };

mock.module("electron", () => ({
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
}));

// ---- 测试 ----

describe("createIPCMain（嵌套 channel 传入）", () => {
  beforeEach(() => {
    mockIpcMain.handle.mockReset();
    mockIpcMain.on.mockReset();
  });

  test("handle 接受嵌套路径的 channel", () => {
    const ipc = createIPCMain();
    ipc.handle(TestIPC.window.minimize, mock(() => {}));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(
      "minimize-window",
      expect.any(Function),
    );
  });

  test("on 接受嵌套路径的 channel", () => {
    const ipc = createIPCMain();
    ipc.on(TestIPC.app.snack, mock());
    expect(mockIpcMain.on).toHaveBeenCalledWith("snack", expect.any(Function));
  });
});

describe("createClient（嵌套结构）", () => {
  beforeEach(() => {
    mockIpcRenderer.invoke.mockReset();
    mockIpcRenderer.send.mockReset();
    mockIpcRenderer.on.mockReset();
    mockIpcRenderer.removeListener.mockReset();
  });

  test("嵌套 handle channel → 嵌套调用方法", async () => {
    mockIpcRenderer.invoke.mockResolvedValue(["mod1"]);
    const ipc = createClient(TestIPC);

    const result = await ipc.fs.readDir("/path");

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("fs-read-dir", "/path");
    expect(result).toEqual(["mod1"]);
  });

  test("深层嵌套 handle channel", async () => {
    mockIpcRenderer.invoke.mockResolvedValue("content");
    const ipc = createClient(TestIPC);

    const result = await ipc.fs.readFile("/f.txt");

    expect(result).toBe("content");
  });

  test("嵌套 send channel → 嵌套调用方法", () => {
    const ipc = createClient(TestIPC);

    ipc.app.snack("hello", "info");

    expect(mockIpcRenderer.send).toHaveBeenCalledWith("snack", "hello", "info");
  });

  test("顶层 on 监听嵌套 push channel", () => {
    const ipc = createClient(TestIPC);
    const handler = mock();

    const unsub = ipc.on(TestIPC.lifecycle.wakeUp, handler);

    expect(mockIpcRenderer.on).toHaveBeenCalledWith("wakeUp", expect.any(Function));

    // 触发
    const listener = mockIpcRenderer.on.mock.calls[0][1];
    listener({ sender: {} });
    expect(handler).toHaveBeenCalledWith({ sender: {} });

    unsub();
    expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith("wakeUp", expect.any(Function));
  });

  test("push channel 不作为 client 方法暴露", () => {
    const ipc = createClient(TestIPC);
    // lifecycle 存在但是不包含方法（或方法是 undefined）
    expect(ipc.lifecycle).toBeDefined();
    // wakeUp 不应是函数
    expect(typeof (ipc.lifecycle as any).wakeUp).toBe("undefined");
  });
});

describe("createWindowIPC", () => {
  beforeEach(() => {
    mockWebContents.send.mockReset();
  });

  test("send 接受嵌套 push channel", () => {
    const winIPC = createWindowIPC(mockBrowserWindow as any);
    winIPC.send(TestIPC.lifecycle.wakeUp);
    expect(mockWebContents.send).toHaveBeenCalledWith("wakeUp");
  });
});

describe("端到端（嵌套）", () => {
  beforeEach(() => {
    mockIpcMain.handle.mockReset();
    mockIpcRenderer.invoke.mockReset();
  });

  test("主进程 handle + 渲染进程嵌套 client 桥接", async () => {
    const mainIPC = createIPCMain();
    mainIPC.handle(TestIPC.window.setBounds, async (_event, boundsStr) => {
      expect(boundsStr).toBe('{"x":100}');
    });

    mockIpcRenderer.invoke.mockImplementation(
      async (channel: string, ...args: unknown[]) => {
        const handler = mockIpcMain.handle.mock.calls.find(
          (c: unknown[]) => c[0] === channel,
        )?.[1];
        if (!handler) throw new Error(`No handler for ${channel}`);
        return handler({ sender: {} }, ...args);
      },
    );

    const ipc = createClient(TestIPC);
    await ipc.window.setBounds('{"x":100}');

    // 不抛异常即通过
  });
});
