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
const fs = require('fs');

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

function snack(message, type = 'info') {
    ipcRenderer.send('snack', message, type);
}



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
        this.eventList = {};

        // 支持 插件 功能
        this.plugins = {};
        this.pluginConfig = {};

        // 初始化
        this.init();
    }
    inited = false;

    anouncedFinishInit = false;
    async waitInit() {
        while (!this.inited) {
            //debug
            //console.log('===== waitInit wait =====');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        //debug
        if (!this.anouncedFinishInit) {
            console.log('✅====== waitInit done ======');
            this.anouncedFinishInit = true;
        }
        return this;
    }


    //-==================== 核心数据 ====================

    // 核心数据，可以后面慢慢扩充，现在只将必要的数据放在这里
    // currentConfig = {
    //     name: null, // 当前配置的名称
    //     path: null, // 当前配置的路径
    // };

    config = {
        firstLoad: true, // 是否第一次加载
        language: 'zh_cn', // 语言
        theme: 'dark', // 主题
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
    temp = {
        lastClickedMod: null, // 最后点击的mod，用于显示详情
    };



    //-==================== 内部方法 ====================
    async snack(message, type = 'info') {
        ipcRenderer.send('snack', message, type);
    }
    async loadConfig() {
        const currentConfig = await ipcRenderer.invoke('get-current-config');

        console.log(currentConfig);
        if (currentConfig == {} || currentConfig == null) {
            snack('配置文件不存在');
            this.saveConfig();
            return;
        }
        //如果为空，则使用默认配置

        this.config = currentConfig;
        //debug
        if (fs.existsSync(this.config.presetPath) === false) {
            //fs.mkdirSync(this.config.presetPath);
        }

        this.saveConfig();
    }

    async loadMods() {
        const modSourcePath = this.config.modSourcePath;
        const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);

        if (loadMods == []) {
            snack('mod路径不存在');
            return;
        }
        // 加载 character
        this.data.characterList = new Set(loadMods.map((mod) => mod.character));
        this.data.modList = loadMods;

        //debug
        console.log(loadMods);
        console.log(this.data.characterList);
    }

    async loadPresets() {
        const data = await ipcRenderer.invoke('get-preset-list');
        this.data.presetList = data;
    }

    async loadPreset(presetName) {
        const presetPath = this.config.presetPath;
        const presetFilePath = path.join(presetPath, `${presetName}.json`);
        if (fs.existsSync(presetFilePath)) {
            return JSON.parse(fs.readFileSync(presetFilePath, 'utf-8'));
        }
        snack(`Preset ${presetName} not found`);
        return null;
    }

    async getModInfo(modName) {
        // const data = await ipcRenderer.invoke('get-mod-info', this.config.modSourcePath, modName);
        // 改为直接从 data 中获取
        const data = this.data.modList.find((mod) => mod.name === modName);
        return data;
    }
    //- mod的格式
    // const mod = {
    //     name: path.basename(modPath),
    //     character: 'Unknown',
    //     preview: '',
    //     description: '',
    //     url: '',
    //     hotkeys: [],
    // }

    async getImageBase64(imagePath) {
        //debug
        // console.log(`get-image: ${imagePath}`);
        const data = await ipcRenderer.invoke('get-image', imagePath);
        return data;
    }

    async showDialog(dialogID) {
        const dialog = document.getElementById(dialogID);
        if (!dialog) {
            console.log(`dialog ${dialogID} not found`);
            return;
        }
        dialog.show();
    }

    async setLastClickedModByName(modName) {

        this.temp.lastClickedMod = await this.getModInfo(modName);
        //debug
        console.log(`setLastClickedModByName: ${modName}`, this.temp.lastClickedMod);
        this.trigger('lastClickedModChanged', this.temp.lastClickedMod);
    }

    //-==================== 生命周期 ====================
    // 初始化
    async init() {
        // 将 imanage 的 实例 传递给 主进程


        //debug
        console.log('✅>> init IManager');
        // 加载配置
        await this.loadConfig();
        console.log('✅>> loadConfig done');
        // 加载mod
        await this.loadMods();
        console.log('✅>> loadMods done');

        // 加载预设
        await this.loadPresets();
        console.log('✅>> loadPresets done');

        // 加载插件
        await this.loadPlugins();
        console.log('✅>> loadPlugins done');


        //debug
        console.log('✅>> init IManager done');
        this.inited = true;

        //ipcRenderer.invoke('set-imanager', this);
        // 这样 传递的数据 会被序列化，导致 无法传递 函数
        // 并且 不能够 同步，因为实际上传递的是复制的数据，而不是引用


        //调用 start 方法
        setTimeout(() => {
            this.start();
        }, 100);
    }

    // start 在 init 之后调用，在各个其他页面 绑定好事件之后调用
    async start() {
        // lastClickedMod 默认是 第一个mod
        if (this.data.modList.length > 0) {
            //debug
            this.temp.lastClickedMod = this.data.modList[0];
            console.log('✅>> lastClickedMod init', this.temp.lastClickedMod);

            this.trigger('lastClickedModChanged', this.temp.lastClickedMod);
        }
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

    async changePreview(modName, previewPath) {
        // 将 previewPath 的 文件 复制到 modSourcePath 的 preview 文件夹下，并且将 mod 的 preview 属性设置为 previewPath，然后保存

        // 从 data 中获取 mod
        const mod = this.data.modList.find((mod) => mod.name === modName);
        if (!mod) {
            snack(`Mod ${modName} not found`);
            return;
        }

        const previewFileName = path.basename(previewPath);
        const newPreviewPath = path.join(this.config.modSourcePath, modName, previewFileName);
        //debug
        console.log(`copy ${previewPath} to ${newPreviewPath}`);
        fs.copyFileSync(previewPath, newPreviewPath);
        mod.preview = newPreviewPath;

        // 保存
        this.saveModInfo(mod);
    }

    async saveConfig() {
        await ipcRenderer.invoke('set-current-config', this.config);
    }

    async getFilePath(fileName, fileType) {
        const filePath = await ipcRenderer.invoke('get-file-path', fileName, fileType);
        //debug
        console.log('=================================');
        console.log(filePath);
        if (filePath) {
            return filePath;
        }
        else {
            snack('文件不存在');
            return '';
        }
    }

    async setConfig(key, value) {
        this.config[key] = value;
    }

    async setConfigFromDialog(key, fileType) {
        const filePath = await this.getFilePath(key, fileType);
        if (this.config[key] === undefined) {
            //debug
            console.log('未知属性，请检查', key, this.config);
            snack('未知属性，请检查');
            return '';
        }
        if (filePath && filePath.length > 0) {
            this.config[key] = filePath;
            this.saveConfig();
            return filePath;
        }
        else {
            snack('未选择文件');
            return '';
        }
    }

    async setLanguage(language) {
        //debug
        console.log(`iManager current language: ${this.config.language}, set language: ${language}`);
        if (language !== 'zh_cn' && language !== 'en') {
            snack('不支持的语言');
            return;
        }
        if (this.config.language === language) {
            return;
        }

        this.config.language = language;
        this.trigger('languageChange', language);
        //debug eventList
        console.log(this.eventList);
        this.saveConfig();
    }

    async saveModInfo(modInfo) {
        //这里的 modInfo 是一个对象，不能直接传递给主进程
        //所以需要将 modInfo 转化为 json
        this.printModInfo(modInfo);
        console.log(modInfo);

        // iManager 保存    
        // 根据 modInfo 的 name 找到对应的 mod，然后替换
        const index = this.data.modList.findIndex((mod) => mod.name === modInfo.name);
        if (index === -1) {
            snack(`Mod ${modInfo.name} not found`);
            return;
        }
        this.data.modList[index] = modInfo;

        // 本地保存
        const jsonModInfo = JSON.stringify(modInfo);
        await ipcRenderer.invoke('save-mod-info', this.config.modSourcePath, jsonModInfo);
        this.trigger('modInfoChanged', modInfo);
    }

    printModInfo(modInfo) {
        console.log('save-mod-info:');
        for (const key in modInfo) {
            console.log(`${key}:${modInfo[key]}`);
        }
        // hotkeys 为 [{},{}],将其 每个键值对打印出来
        console.log('hotkeys:');
        modInfo.hotkeys.forEach((hotkey, index) => {
            console.log(`hotkey${index}:`);
            for (const key in hotkey) {
                console.log(`${key}:${hotkey[key]}`);
            }
        });
    }

    async moveAllFiles(sourcePath, targetPath) {
        await ipcRenderer.invoke('move-all-files', sourcePath, targetPath);
    }

    //-==================== 事件管理 ====================
    // 注册事件
    on(eventName, callback) {
        if (!this.eventList[eventName]) {
            this.eventList[eventName] = [];
        }
        this.eventList[eventName].push(callback);
    }

    // 触发事件
    trigger(eventName, data) {
        if (this.eventList[eventName]) {
            this.eventList[eventName].forEach((callback) => {
                callback(data);
            });
        }
    }

    //-===================== 插件 =====================
    plugins = {};
    pluginConfig = {};

    registerPlugin(plugin) {
        this.plugins[plugin.name] = plugin;
        if (typeof plugin.init === 'function') {
            plugin.init(this);
        }

        // 尝试加载 插件的本地配置
        ipcRenderer.invoke('get-plugin-config', plugin.name).then((localPluginData) => {
            //debug
            console.log(`ℹ️loadPluginConfig ${plugin.name}`, localPluginData);
            if (localPluginData) {
                //debug
                console.log(`🟦loadPluginConfig ${plugin.name}`, localPluginData);
                // this.pluginConfig[plugin.name] = localPluginData;
            }
        }
        );

        //debug
        console.log(`▶️plugin ${plugin.name} loaded`, plugin);
    }

    registerPluginConfig(pluginName, pluginConfig) {
        this.pluginConfig[pluginName] = pluginConfig;
        //debug
        console.log(`registerPluginConfig ${pluginName}`, pluginConfig);
        // pluginConfig 是 data 的 数组

        // data 为一个对象，包含了插件的可配置数据，比如说是否启用，是否显示等等
        // 它会被 解析 之后 在 设置页面 中显示，并且为 插件提供数据
        // 当它发生变化时，会触发 插件的 onChange 方法

        // data 的格式为
        // {
        //     name: 'ifAblePlugin',
        //     data: true,
        //     type: 'boolean',
        //     displayName: 'If Able Plugin',
        //     description: 'If true, the plugin will be enabled',
        //     t_name:{
        //         zh_cn:'是否启用插件',
        //         en:'Enable Plugin'
        //     },
        //     t_description:{
        //         zh_cn:'如果为真，插件将被启用',
        //         en:'If true, the plugin will be enabled'
        //     },
        //     onChange: (value) => {
        //         console.log('ifAblePlugin changed:', value);
        //     }
        // }
    }

    async loadPlugins() {
        // 插件为 一个 js 文件，通过 require 引入
        // 然后调用 init 方法，将 iManager 传递给插件

        // 先加载内置的插件
        const builtInPlugins = ['autoStartPlugin'];
        builtInPlugins.forEach((pluginName) => {
            const plugin = require(`./plugins/${pluginName}.js`);
            this.registerPlugin(plugin);
        });

        // 从 plugins 文件夹中加载插件，其位于 
        const userDataPath = await ipcRenderer.invoke('get-user-data-path');
        const pluginPath = path.join(userDataPath, 'plugins');
        const files = fs.readdirSync(pluginPath);
        files.forEach((file) => {
            if (file.endsWith('.js')) {
                const plugin = require(path.join(pluginPath, file));
                this.registerPlugin(plugin);
            }
        });

        //debug 打印所有插件
        console.log(this.plugins);
    }

    // 将 插件的 配置 本地化 存储
    async savePluginConfig() {
        // pluginConfig 里面存储了 所有插件的配置 pluginData
        // 每个 pluginData 是一个 数组 ，包含了 插件的配置
        // 但是我们不需要保存 pluginData里面的所有数据，比如说显示名称，描述，onChange等，只需要保存 data
        // data 是一个对象，包含了 插件的配置数据

        for (const pluginName in this.pluginConfig) {
            const pluginData = this.pluginConfig[pluginName];
            const localPluginData = {};
            pluginData.forEach((data) => {
                localPluginData[data.name] = data.data;
            });

            console.log('savePluginConfig:', pluginName, localPluginData);

            await ipcRenderer.invoke('save-plugin-config', pluginName, localPluginData);    
        }
    }
}

export default IManager;

