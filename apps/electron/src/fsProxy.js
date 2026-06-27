// fsProxy.js — 类型安全 IPC 迁移版
// 使用 @xxmm/ipc 的 createClient(IPC) 替代裸 ipcRenderer.invoke
//
// @deprecated 此类仅为 IPC 调用的二次转接层，无额外业务逻辑。
//   下游模块应直接使用 createClient(IPC) 获取类型安全的 IPC 客户端：
//     import { createClient, IPC } from "@xxmm/ipc";
//     const ipc = createClient(IPC);
//     await ipc.fs.readFile(path);    // 替代 fsProxy.readFile(path)
//     await ipc.fs.openDir(path);     // 替代 fsProxy.openDir(path)
//   后续版本将移除此文件。
const { createClient, IPC } = require("@xxmm/ipc");

const ipc = createClient(IPC);

class fsProxy {
  static instance = null;
  constructor() {
    if (fsProxy.instance) {
      return fsProxy.instance;
    }
    fsProxy.instance = this;
  }

  /** @deprecated 使用 ipc.fs.readFile(path) */
  static async readFile(path) {
    return await ipc.fs.readFile(path);
  }

  /** @deprecated 使用 ipc.fs.writeFile(path, data) */
  static async writeFile(path, data) {
    return await ipc.fs.writeFile(path, data);
  }

  /** @deprecated 使用 ipc.fs.createFile(path) */
  static async createFile(path) {
    return await ipc.fs.createFile(path);
  }

  /** @deprecated 使用 ipc.fs.readDir(path) */
  static async readDir(path) {
    return await ipc.fs.readDir(path);
  }

  /** @deprecated 使用 ipc.fs.isDir(path) */
  static async isDir(path) {
    return await ipc.fs.isDir(path);
  }

  /** @deprecated 使用 ipc.fs.openDir(path) */
  static async openDir(path) {
    return await ipc.fs.openDir(path);
  }
}

export default fsProxy;
