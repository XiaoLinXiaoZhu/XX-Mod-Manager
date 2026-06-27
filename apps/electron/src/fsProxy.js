// fsProxy.js — 类型安全 IPC 迁移版
// 使用 @xxmm/ipc 的 createClient(IPC) 替代裸 ipcRenderer.invoke
// 对外 API 保持不变
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

  static async readFile(path) {
    return await ipc.fs.readFile(path);
  }

  static async writeFile(path, data) {
    return await ipc.fs.writeFile(path, data);
  }

  static async createFile(path) {
    return await ipc.fs.createFile(path);
  }

  static async readDir(path) {
    return await ipc.fs.readDir(path);
  }

  static async isDir(path) {
    return await ipc.fs.isDir(path);
  }

  static async openDir(path) {
    return await ipc.fs.openDir(path);
  }
}

export default fsProxy;
