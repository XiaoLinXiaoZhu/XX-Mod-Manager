// 这是一个单例式 Manager 类，用于 保存 管理 所有的 数据
// 所有的数据都从 这里 获取，包括 各种页面的样式，事件的触发，数据的获取等等
// 这样的话，方便将所有非核心功能 转化为 插件，方便管理和拓展


// 这个类应该 被划分到 渲染进程底下，但是 主进程也应该能够访问到这个类
const { ipcRenderer, ipcMain } = require('electron');
const { app } = require('electron');
// import fsProxy from './fsProxy';
// const fs = new fsProxy();

const path = require('path');

// 导入fs
const fs = require('fs').promises;

// // thenBase 是一个语法糖，实现then方法的链式调用
// class thenBase {
//     constructor() {
//         this.thenList = [];
//     }

//     then(callback) {
//         this.thenList.push(callback);
//         return this;
//     }

//     run(data) {
//         this.thenList.forEach((callback) => {
//             data = callback(data);
//         });
//     }
// }


class IManager {
    //-==================== 单例 ====================
    static instance = null;
    constructor() {
        if (IManager.instance) {
            return IManager.instance;
        }
        IManager.instance = this;
        this.data = {};
        this.plugins = {};

        // 初始化
        this.init();
    }
    inited = false;

    async waitInit() {
        while (!this.inited) {
            //debug
            console.log('==================waitInit wait');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        //debug
        console.log('==================waitInit success');
        return this;
    }


    //-==================== 核心数据 ====================

    // 核心数据，可以后面慢慢扩充，现在只将必要的数据放在这里
    // currentConfig = {
    //     name: null, // 当前配置的名称
    //     path: null, // 当前配置的路径
    // };

    config = {
        modSourcePath: null, // mod的源路径
        modTargetPath: null, // mod的目标路径
        presetPath: null // 预设路径
    };

    dataPath = ''; // 数据路径
    data = {
        modList: [], // mod列表
        presetList: [], // 预设列表
        characterList: [], // 角色列表
    };



    //-==================== 内部方法 ====================
    //     // 定义 loadMods 方法
    // const loadMods = async () => {
    //     const currentConfig = await ipcRenderer.invoke('get-current-config');
    //     //debug
    //     console.log(currentConfig);
    //     const modSourcePath = currentConfig.modSourcePath;
    //     console.log(`modSourcePath: ${modSourcePath},type: ${typeof modSourcePath}`);
    //     const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);
    //     console.log(loadMods);
    //     mods.value = loadMods;

    //     // 加载 character
    //     loadMods.forEach((mod) => {
    //         if (!characters.value.includes(mod.character)) {
    //             characters.value.push(mod.character);
    //         }
    //     });
    //     //debug
    //     console.log(characters.value);
    // };
    async loadConfig() {
        const currentConfig = await ipcRenderer.invoke('get-current-config');
        this.config = currentConfig;
    }

    async loadMods() {
        const modSourcePath = this.config.modSourcePath;
        const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);
        
        // 加载 character
        this.data.characterList = new Set(loadMods.map((mod) => mod.character));
        this.data.modList = loadMods;
    }

    async loadPresets() {
        const data = await ipcRenderer.invoke('get-preset-list');
        this.data.presetList = data;
    }

    async loadPreset(presetName) {
        const data = await ipcRenderer.invoke('load-preset', presetName);
        return data;
    }

    async getModInfo(modName) {
        const data = await ipcRenderer.invoke('get-mod-info', modName);
        return data;
    }

    //-==================== 生命周期 ====================
    // 初始化
    async init() {
        // 将 imanage 的 实例 传递给 主进程
        
        
        //debug
        console.log('init IManager');
        // 加载配置
        await this.loadConfig();
        // 加载mod
        await this.loadMods();
        // 加载预设
        await this.loadPresets();

        
        //debug
        console.log('init IManager done');
        this.inited = true;

        //ipcRenderer.invoke('set-imanager', this);
        // 这样 传递的数据 会被序列化，导致 无法传递 函数
        // 并且 不能够 同步，因为实际上传递的是复制的数据，而不是引用
    }



    //-==================== 对外接口 ====================
    async openNewWindow(windowPath) {
        await ipcRenderer.send('open-new-window', windowPath);
    }

    async savePreset(presetName, data) {
        await ipcRenderer.invoke('save-preset', presetName, data);
    }

    async applyMods(modList) {
        const modTargetPath = this.config.modTargetPath;
        const modSourcePath = this.config.modSourcePath;
        await ipcRenderer.invoke('apply-mods', modList, modSourcePath, modTargetPath);
        ipcRenderer.send('snack', '应用成功');
    }

    async addPreset(presetName) {
        // const newPresetPath = this.config.presetPath + '/' + presetName;
        const newPresetPath = path.join(this.config.presetPath, presetName + '.json');
        await fs.writeFile(newPresetPath, JSON.stringify({}));
    }

    //-==================== 插件管理 ====================
    // 注册插件
    registerPlugin(plugin) {
        this.plugins[plugin.name] = plugin;
    }

    // 获取插件
    getPlugin(name) {
        return this.plugins[name];
    }

    // 获取数据
    getData(key) {
        return this.data[key];
    }

    // 设置数据
    setData(key, value) {
        this.data[key] = value;
    }

    // 触发事件
    triggerEvent(eventName, data) {
        for (let key in this.plugins) {
            this.plugins[key].trigger(eventName, data);
        }
    }
}

export default IManager;

