// 因为 渲染进程 无法使用 fs 模块，所以这里需要通过 主进程 来获取数据
// 但是那样很麻烦，这里 写一个 代理 的 fs 模块，通过 ipcRenderer 来获取数据
const { ipcRenderer } = require('electron');

class fsProxy {
    static instance = null;
    constructor() {
        if (fsProxy.instance) {
            return fsProxy.instance;
        }
        fsProxy.instance = this;
    }

    async readFile(path) {
        return await ipcRenderer.invoke('fs-read-file', path);
    }

    async writeFile(path, data) {
        return await ipcRenderer.invoke('fs-write-file', path, data);
    }

    async createFile(path) {
        return await ipcRenderer.invoke('fs-create-file', path);
    }

    async readDir(path) {
        return await ipcRenderer.invoke('fs-read-dir', path);
    }

    async isDir(path) {
        return await ipcRenderer.invoke('fs-is-dir', path);
    }

    async openDir(path) {
        return await ipcRenderer.invoke('fs-open-dir', path);
    }
}


export default fsProxy;