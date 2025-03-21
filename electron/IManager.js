// 这是一个单例式 Manager 类，用于 保存 管理 所有的 数据
// 所有的数据都从 这里 获取，包括 各种页面的样式，事件的触发，数据的获取等等
// 这样的话，方便将所有非核心功能 转化为 插件，方便管理和拓展

// 这个类应该 被划分到 渲染进程底下，但是 主进程也应该能够访问到这个类
const { ipcRenderer } = require('electron');

const pathOsName = 'path'
const path = require(pathOsName);

// 导入fs
const fs = require('fs');

// 导入 libarchivejs
let Archive = window.Archive;
// import Archive from 'libarchive.js';
//! 下面两个变量是为了解决 vite 打包时，无法正确导入 wasm 文件的问题
import ArchiveWASM from './lib/libarchive.wasm?url';
import workerBound from './lib/worker-bundle.js?url';


// 导入 Language
import { Language, TranslatedText, setCurrentLanguage } from '../helper/Language';
// 导入 SnackHelper
import { t_snack, SnackType, snack } from '../helper/SnackHelper';
// 导入 EventSystem
import { EventType, EventSystem } from '../helper/EventSystem';
// 导入 PluginLoader
import { IPluginLoader } from '../helper/PluginLoader';
// 导入 PathHelper
import { PathHelper } from '../helper/PathHelper';
// 导入 ModHelper
import { ModData } from '../helper/ModHelper';
// 导入 DialogHelper
import { DialogID, DialogHelper } from '../helper/DialogHelper';

// // 导入 hmc-win32
const HMC_Name = 'hmc-win32';
const HMC = require(HMC_Name);

//-=================== 全局变量 ===================-//
let g_temp = {
    lastClickedMod: null,
    currentMod: null,
    currentCharacter: null,
    currentTab: 'mod',
    currentPreset: "default",
    wakeUped: false,
    ifDontSaveOnClose: false,
};
let g_config = {
    firstLoad: true,
    language: 'zh_cn',
    theme: 'dark',
    modSourcePath: null,
    modTargetPath: null,
    presetPath: null,
    ifStartWithLastPreset: true,
    lastUsedPreset: null,
    bounds: {
        width: 800,
        height: 600,
        x: -1,
        y: -1,
    }
};
let g_data = {
    modList: [],
    presetList: [],
    characterList: [],
};

//-==================== vue 版本的全局变量 ====================//
import { ref } from 'vue';
const g_temp_vue = {
    lastClickedMod: ref(null),
    currentMod: ref(null),
    currentCharacter: ref(null),
    currentTab: ref('mod'),
    currentPreset: ref('default'),
    wakeUped: ref(false),
    ifDontSaveOnClose: ref(false),
};

const g_config_vue = {
    firstLoad: ref(true),
    language: ref('zh_cn'),
    theme: ref('dark'),
    modSourcePath: ref(null),
    modTargetPath: ref(null),
    presetPath: ref(null),
    ifStartWithLastPreset: ref(true),
    lastUsedPreset: ref(null),
    bounds: ref({
        width: 800,
        height: 600,
        x: -1,
        y: -1,
    }),
};

const g_data_vue = {
    modList: ref([]),
    presetList: ref([]),
    characterList: ref([]),
};


class IManager {
    //-==================== 单例 ====================
    static instance = null;
    static async getInstance() {
        if (IManager.instance) {
            return IManager.instance;
        }
        const iManager = new IManager();
        await iManager.waitInit();
        return iManager;
    }

    constructor() {
        Archive = window.Archive;
        if (IManager.instance) {
            return IManager.instance;
        }
        IManager.instance = this;
        this.plugins = {};

        this.HMC = HMC

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

    //-==================== 暴露依赖 ====================
    os = process.platform;
    HMC = null;
    ModData = ModData;
    TranslatedText = TranslatedText;


    //-==================== 核心数据 ====================

    // 核心数据，可以后面慢慢扩充，现在只将必要的数据放在这里
    // currentConfig = {
    //     name: null, // 当前配置的名称
    //     path: null, // 当前配置的路径
    // };
    // 对外暴露的 hmc 对象，使得插件可以直接调用 hmc 的方法
    // 从本地加载的配置项
    _config = {
        firstLoad: true, // 是否第一次加载
        language: 'zh_cn', // 语言
        theme: 'dark', // 主题
        modSourcePath: null, // mod的源路径
        modTargetPath: null, // mod的目标路径
        presetPath: null, // 预设路径
        ifStartWithLastPreset: true, // 是否启动时使用上次使用的预设
        lastUsedPreset: null, // 上次使用的预设,如果 ifStartWithLastPreset 为 true，则启动时使用这个预设
        bounds: {
            width: 800,
            height: 600,
            x: -1,
            y: -1,
        }
    };

    // 程序运行时的数据
    // dataPath = ''; // 数据路径
    _data = {
        modList: [], // mod列表
        presetList: [], // 预设列表
        characterList: [], // 角色列表
    };

    // 临时数据，用于存储一些临时的数据
    _temp = {
        lastClickedMod: null, // 最后点击的mod，用于显示详情
        currentMod: null, // 当前mod
        currentCharacter: 'all', // 当前角色
        currentTab: 'mod', // 当前tab
        currentPreset: "default", // 当前预设
        wakeUped: false, // 是否 在唤醒状态
        ifDontSaveOnClose: false, // 是否在关闭时不保存配置
    };

    //-==================== 设置数据 ====================
    config = new Proxy(this._config, {
        set: (target, key, value) => {
            if (target.hasOwnProperty(key)) {
                target[key] = value;
                g_config[key] = value;
                g_config_vue[key].value = value;
                return true;
            } else {
                console.error(`Invalid key: ${key}`);
                return false;
            }
        },
        get: (target, key) => {
            if (target.hasOwnProperty(key)) {
                return target[key];
            } else {
                console.error(`Invalid key: ${key}`);
                return null;
            }
        }
    });

    data = new Proxy(this._data, {
        set: (target, key, value) => {
            if (target.hasOwnProperty(key)) {
                target[key] = value;
                // console.log(`data set: ${key}`, value);
                // 不保存 modList，因为 modList 是一个对象数组，如果 传来传去，会导致内存占用过大
                if (key === 'modList') {
                    // 如果 modList 变化，则 触发 modListChanged 事件
                    EventSystem.trigger(EventType.modListChanged, value);
                    return true;
                }
                g_data[key] = value;
                g_data_vue[key].value = value;
                return true;
            } else {
                console.error(`Invalid key: ${key}`);
                return false;
            }
        },
        get: (target, key) => {
            if (target.hasOwnProperty(key)) {
                return target[key];
            } else {
                console.error(`Invalid key: ${key}`);
                return null;
            }
        }
    });

    temp = new Proxy(this._temp, {
        set: (target, key, value) => {
            if (target.hasOwnProperty(key)) {
                if (!value) {
                    //debug
                    console.error('WTF,where give me null?');
                }
                target[key] = value;
                g_temp[key] = value;
                g_temp_vue[key].value = value;
                return true;
            } else {
                console.error(`Invalid key: ${key}`);
                return false;
            }
        },
        get: (target, key) => {
            if (target.hasOwnProperty(key)) {
                return target[key];
            } else {
                console.error(`Invalid key: ${key}`);
                return null;
            }
        }
    });


    //-==================== 内部方法 ====================
    snack = snack;
    t_snack = t_snack;

    async loadConfig() {
        const currentConfig = await ipcRenderer.invoke('get-current-config');
        console.log(currentConfig);
        //如果为空，则使用默认配置
        if (currentConfig == {} || currentConfig == null) {
            snack('配置文件不存在');
            this.saveConfig();
            return;
        }

        console.log('loadConfig:', currentConfig);
        // this.config = currentConfig;
        // 这样会导致 较新的配置项 丢失，所以需要逐个赋值
        for (const key in currentConfig) {
            try {
                this.config[key] = currentConfig[key];
            }
            catch (error) {
                console.log(`Loading config error: ${error}`);
                snack(`Loading config error: ${error}`);
            }
        }

        this.saveConfig();
    }

    newMods = [];
    async loadMods() {
        const modSourcePath = this.config.modSourcePath;
        //debug
        console.log(`loadMods from ${modSourcePath}`);
        const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);

        if (loadMods == []) {
            snack('mod路径不存在');
            return;
        }

        //如果 loadMods 中的mod 的 newMod 为 true，则将其设置为 false，并触发addMod事件
        this.newMods = loadMods.filter((mod) => mod.newMod);
        //debug
        console.log(`newMods:`, this.newMods);

        // this.data.modList = loadMods;
        // 将 mod 转换为 ModData, 并且保存到 data 中
        this.data.modList = await Promise.all(loadMods.map(async (mod) => ModData.fromJson(mod).setModSourcePath(modSourcePath)));

        // 刷新 characterList
        await this.refreshCharacterList();

        //debug
        // console.log(loadMods);
        // console.log(this.data.modList);
        // console.log(this.data.characterList);

        // debug,成功加载 n 个 mod，总共 m 个 角色
        console.log(`成功加载 ${loadMods.length} 个 mod，总共 ${this.data.characterList.length} 个 角色`);
        return loadMods;
    }

    async refreshCharacterList() {
        // 加载 character
        this.data.characterList = new Set(this.data.modList.map((mod) => mod.character));
        // 当 currentCharacter 不变时，不会触发 currentCharacterChanged 事件
        // 但是 characterList 的顺序 是按照从mod中获取的顺序，所以这里需要将其排序一下，默认按照字母排序
        this.data.characterList = Array.from(this.data.characterList).sort();

        // 如果 currentCharacter 不为空，且 characterList 中不包含 currentCharacter，则将 currentCharacter 设置为 all
        if (this.temp.currentCharacter !== null && !this.data.characterList.includes(this.temp.currentCharacter)) {
            this.setCurrentCharacter('all');
        }
    }

    async loadPresets() {
        const data = await ipcRenderer.invoke('get-preset-list');
        this.data.presetList = data;
    }

    async loadPreset(presetName) {
        if (presetName === 'default') {
            return [];
        }
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

        if (data == null) {
            // 如果 data 为空，则从文件中加载,并且将其添加到 modList 中
            return await this.loadModInfo(modName);
        }

        return data;
    }

    async loadModInfo(modName) {
        const data = await ipcRenderer.invoke('get-mod-info', this.config.modSourcePath, modName);

        if (data == null) {
            const tt = new TranslatedText({
                zh_cn: `加载mod信息失败`,
                en: `Failed to load mod info`,
            });
            t_snack(tt, SnackType.error);
            console.error(tt.get(), modName);
            return null;
        }

        // 将其转换为 ModData
        const mod = ModData.fromJson(data).setModSourcePath(this.config.modSourcePath);

        // 如果 是新的 mod，则触发 addMod 事件
        if (data.newMod) {
            data.newMod = false;
            await EventSystem.trigger('addMod', mod);
        }

        // 延时一下，等待 addMod 事件完成
        // await new Promise((resolve) => setTimeout(resolve, 100));

        // 将其添加到 modList 中
        this.data.modList.push(mod);

        // 刷新一下characterList
        this.data.characterList = new Set(this.data.modList.map((mod) => mod.character));
        this.data.characterList = Array.from(this.data.characterList).sort();

        return mod;
    }

    async getImageBase64(imagePath) {
        //debug
        // console.log(`get-image: ${imagePath}`);
        const data = await ipcRenderer.invoke('get-image', imagePath);
        return data;
    }

    showDialog = DialogHelper.showDialog;
    dismissDialog = DialogHelper.dismissDialog;
    //-==================== 生命周期 ====================
    // 初始化
    async init() {
        // 加载配置
        await this.loadConfig();
        console.log('✅>> loadConfig done');

        //-=============== 优先进行页面初始化 ===============-//
        //------ 设置窗口大小 -----
        this.setWindowBounds();
        console.log('✅>> setWindowBounds done');
        //------ 切换语言 -----
        this.trigger('languageChange', this.config.language);
        setCurrentLanguage(this.config.language);
        console.log('✅>> languageChange to', this.config.language);
        //------ 切换主题 -----
        this.trigger('themeChange', this.config.theme);
        console.log('✅>> themeChange to', this.config.theme);

        // 加载mod
        await this.loadMods();
        console.log('✅>> loadMods done');

        // 加载预设
        await this.loadPresets();
        console.log('✅>> loadPresets done');

        // 加载插件
        await IPluginLoader.Init(this);
        console.log('✅>> loadPlugins done');

        //debug
        console.log('✅>> init IManager done');
        this.inited = true;

        //----------------- 事件监听 -----------------
        EventSystem.on(EventType.modInfoChanged, async (mod) => {
            // characterList 变化
            this.data.characterList = new Set(this.data.modList.map((mod) => mod.character));
            this.data.characterList = Array.from(this.data.characterList).sort();
        });
        EventSystem.on(EventType.currentModChanged, (mod) => {
            this.temp.currentMod = mod;
        });


        //调用 start 方法
        setTimeout(() => {
            this.trigger('initDone', this);
            this.start();
        }, 10);
    }

    // start 在 init 之后调用，在各个其他页面 绑定好事件之后调用
    async start() {
        //-------- 再次切换一次 语言和主题，因为有些页面可能在 init 之后才加载，所以需要再次切换一次
        this.trigger('languageChange', this.config.language);
        setCurrentLanguage(this.config.language);
        this.trigger('themeChange', this.config.theme);

        //-------- 如果有新添加的mod，则运行 addMod 事件
        if (this.newMods.length > 0) {
            this.newMods.forEach((mod) => {
                this.trigger('addMod', mod);
            });
        }
        //-------- currentMod 默认是 第一个mod
        if (this.data.modList.length > 0) {
            this.setCurrentMod(this.data.modList[0]);
            console.log('✅>> currentMod init', this.temp.currentMod);
        }

        //------ 如果开启了 ifStartWithLastPreset，则启动时使用上次使用的预设 -----
        if (this.config.ifStartWithLastPreset) {
            if (this.config.lastUsedPreset !== null) {
                //debug
                console.log('✅>> start with last preset:', this.config.lastUsedPreset);
                this.setCurrentPreset(this.config.lastUsedPreset);
            }
            else {
                //debug
                console.log('✅>> start with default preset');
                this.setCurrentPreset('default');
            }
        }
        else {
            //debug
            console.log('✅>> start with default preset');
            this.setCurrentPreset('default');
        }

    }
    //-==================== 对外接口 - 状态变更 ====================
    async setLastClickedMod(mod) {
        // 此方法已弃用，当调用的时候，抛出异常
        console.warn('setLastClickedMod is deprecated');
        throw new Error('setLastClickedMod is deprecated');
        this.temp.lastClickedMod = mod;
        this.trigger('lastClickedMod_Changed', mod);
    }

    async setLastClickedModByName(modName) {
        // 此方法已弃用，当调用的时候，抛出异常
        console.warn('setLastClickedModByName is deprecated');
        throw new Error('setLastClickedModByName is deprecated');
    }

    async setCurrentCharacter(character) {
        if (character === null) {
            //debug
            console.error('character is null');
            character = 'all';
        }
        this.temp.currentCharacter = character;
        this.trigger('currentCharacterChanged', character);
        //debug
        console.log(`currentCharacterChanged: ${character}`);
    }

    async setCurrentTab(tab) {
        this.temp.currentTab = tab;
        this.trigger('currentTabChanged', tab);

        //debug
        console.log(`currentTabChanged: ${tab}`);
    }

    async setCurrentPreset(presetName) {
        this.temp.currentPreset = presetName;
        this.trigger('currentPresetChanged', presetName);
    }

    async setCurrentMod(mod) {
        this.temp.currentMod = mod;
        this.trigger('currentModChanged', mod);
    }

    async setCurrentModByName(modName) {
        this.temp.currentMod = await this.getModInfo(modName);

        //debug
        console.log(`setCurrentModByName: ${modName}`, this.temp.currentMod, this.hashCode(this.temp.currentMod));
        this.trigger('currentModChanged', this.temp.currentMod);
    }

    async toggledModByName(modName) {
        const mod = await this.getModInfo(modName);
        this.trigger('toggledMod', mod);
    }

    async setWindowBounds() {
        const bounds = this.config.bounds;
        //debug
        console.log('setWindowBounds:', bounds);
        ipcRenderer.invoke('set-bounds', JSON.stringify(bounds));
    }

    //-==================== 对外接口 - 数据处理 ====================


    //-==================== 对外接口 - 能力接口 ====================

    async startExe(exePath) {
        // 纠错
        if (!fs.existsSync(exePath)) {
            snack('文件不存在');
            return;
        }
        this.HMC.openApp(exePath);
    }

    async runCommand(command) {
        const exec = require('child_process').exec;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        }
        );
    }

    async initAllData() {
        await ipcRenderer.invoke('init-all-data');
        // 刷新页面
        location.reload();
    }

    async openUrl(url) {
        if (url === '') {
            snack('链接为空');
            return;
        }
        ipcRenderer.invoke('open-url', url);
    }

    async changeUrl(url) {
        //debug
        console.log('change url from:', window.location.href, 'to:', url);
        // const toUrl = window.location.href.replace(/\/[^/]*$/, '') + url + '/index.html';
        // url 截取掉最后的 /index.html
        let toUrl = window.location.href.replace(/\/index.html$/, '');
        // 再截取掉最后的 /switchConfig
        toUrl = toUrl.replace(/\/switchConfig$/, '');
        // 防止最后为 / ，导致出现 // 的情况，所以再截取一次
        toUrl = toUrl.replace(/\/$/, ''); // 去掉最后的 /
        
        toUrl = toUrl + url + '/index.html';

        console.log('change url to:', toUrl);
        window.location.href = toUrl;
    }

    // 在桌面创建快捷方式 例如：
    // start "" "当前exe所在位置" --customConfig "当前配置文件夹"
    // 起始位置：当前 exe 所在文件夹
    // 目标位置：桌面
    async createAppShortCut(configPath) {
        const { app, shell } = require('electron');
        const path = require('path');

        const exePath = process.execPath;
        const exeDir = path.dirname(exePath);
        const desktopPath = await ipcRenderer.invoke('get-desktop-path');
        const command = `start "" "${exeDir}" --customConfig "${configPath}"`;
        console.log(`createAppShortCut from ${exeDir} to ${desktopPath} with command: ${command}`);

        // 创建快捷方式


        // 快捷方式名称和路径
        const configName = path.basename(configPath);
        const shortcutName = 'XXMM_' + configName + '.lnk';
        const shortcutPath = path.join(desktopPath, shortcutName);

        // 启动参数
        const args = `--customConfig "${configPath}"`;

        // 应用程序的根目录
        try {
            // 创建快捷方式
            await shell.writeShortcutLink(shortcutPath, 'create', {
                target: exePath,
                args: args,
                cwd: exeDir, // 设置工作目录为应用程序的根目录
                icon: exePath, // 可选：设置图标为应用程序图标
                iconIndex: 0 // 可选：图标索引，通常为0
            });

            console.log(`Shortcut created successfully at ${shortcutPath}`);
        } catch (error) {
            console.error('Failed to create shortcut:', error);
        }
    }

    //------ 文件拖拽 ------
    async handleDrop(event) {
        console.log('handleDrop', event);
        const items = event.dataTransfer.items;

        // 两个方法都试试看，我也不知道哪个会成功
        try {
            items[0].webkitGetAsEntry();
            await this.handleDropEntry(event);
        }
        catch (error) {
            this.handleDropFile(event);
        }
    }

    async handleDropEntry(event) {
        // webkitGetAsEntry 方法存在，说明是从本地文件夹拖入的文件
        // 从本地文件夹拖入的文件是 Entry 对象。
        const items = event.dataTransfer.items;
        const item = items[0].webkitGetAsEntry();

        console.log('get entry from drag event', item);
        if (item == null) {
            //debug
            console.log('What is this?');
            throw new Error('Invalid drag event');
            return;
        }
        if (item.isDirectory) {
            // 如果拖入的是文件夹，则视为用户想要添加mod
            console.log('Directory:', item.fullPath);
            this.handleFolderDrop(item);
            return;
        }
        if (item.isFile) {
            // 如果拖入的是文件，则视为用户想要更换mod的封面或者添加mod 压缩包
            const file = items[0].getAsFile();
            if (file.type.startsWith('image/')) {
                // debug
                console.log(`Image file: ${file.name}`);
                // 交给 handleImageDrop 处理
                this.handleImageDrop(file);
                return;
            }
            // 通过使用 libarchive 处理 压缩文件，它能够支持所有的压缩文件
            if (file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z') || file.type === 'application/zip' || file.type === 'application/x-compressed' || file.type === 'application/x-tar' || file.type === 'application/x-gzip') {
                // debug
                console.log(`Zip file: ${file.name}`);
                // 交给 handleArchiveDrop 处理
                this.handleArchiveDrop(file);
                return;
            }

            console.log('File type:', file.type);
            snack('Invalid file type：' + file.type);
        }
    }

    async handleDropFile(event) {
        // webkitGetAsEntry 方法不存在，说明是从网页拖入的文件
        // 从网页拖入的文件是 File 对象。
        try {
            const files = event.dataTransfer.files;
            //debug
            console.log(`get file from drag event ${files[0].name}`);
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    // 交给 handleImageDrop 处理
                    this.handleImageDrop(file);
                    return;
                }
                console.log('File type:', file.type);
                snack('Invalid file type：' + file.type);
            }
        }
        catch (error) {
            console.log('Invalid drag event');
            snack('Invalid drag event');
        }
    }


    async handleImageDrop(file) {
        // 再次确认是否是图片文件
        if (!file.type.startsWith('image/')) {
            snack('Invalid image file');
            return;
        }
        // 因为electron的file对象不是标准的file对象，所以需要使用reader来读取文件
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            //debug
            // console.log(`handle image drop: ${file.name}`,imageUrl);
            //! updateModCardCover(imageUrl, modItem, mod);
            // 这里的 imageUrl 是一个 base64 字符串，可以直接用于显示图片
            // this.setModPreviewBase64ByName(imageUrl, this.temp.lastClickedMod.name);
            this.setModPreviewBase64ByName(imageUrl, this.temp.currentMod.name);
        };
        reader.readAsDataURL(file);
    }

    archivePassword = null;
    async waitForPassword() {
        this.archivePassword = null;
        this.showDialog('dialog-enter-password');
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.archivePassword !== null) {
                    clearInterval(interval);
                    resolve(this.archivePassword);
                }
            }, 100);
        });
    }

    // 解压文件到指定目录的函数
    async extractArchive(archivePath, destinationPath) {
        // 使用 libarchive 处理 zip 文件
        // 读取文件
        const archiveReader = await Archive.open(archivePath);
        // extractFiles(extractCallback?: (entry: { file: File; path: string }) => void): Promise<FilesObject>;
        // extractFiles 只是将其解压到内存中，并不会写入到磁盘
        // 通过 extractCallback 可以获取到解压的文件，然后将其写入到磁盘

        console.debug(archiveReader, archiveReader.workerUrl);

        const ifEncrypted = await archiveReader.hasEncryptedData();

        if (ifEncrypted) {
            // snack(`文件加密，无法解压`);
            // const t_message = {
            //     zh_cn: `文件加密，无法解压`,
            //     en: `File is encrypted and cannot be extracted`,
            // }
            // t_snack(t_message, 'error');
            // return false;

            // 如果文件加密，则需要等待用户输入密码
            const password = await this.waitForPassword();
            //debug
            console.log(`get password: ${password}`);
            snack(`get password ${password}`);
            if (password === null) {
                // snack(`密码不能为空`);
                const t_message = {
                    zh_cn: `密码不能为空`,
                    en: `Password cannot be empty`,
                }
                t_snack(t_message, 'error');
                return false;
            }
            try {
                await archiveReader.usePassword(password);
            }
            catch (error) {
                // snack(`密码错误`);
                const t_message = {
                    zh_cn: `密码错误`,
                    en: `Incorrect password`,
                }
                t_snack(t_message, 'error');
                return false;
            }
        }

        let ifContainChinese = false;
        let ifSuccess = true;

        if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath);
        }

        let callbackCount = 0;
        let startCallback = false;
        const extractCallback = (entry) => {

            const filePath = path.join(destinationPath, entry.path);

            // 当解压出来的文件包含中文时，会被替换为 * ，但是文件夹名不能包含 * ，所以需要将其替换为其他字符
            // 将 filePath 中的 * 替换为 _
            const newFilePath = filePath.replace(/\*/g, '_');
            if (filePath !== newFilePath) {
                ifContainChinese = true;
            }
            //debug
            // console.log(`Converted: ${filePath}`, newFilePath);
            const dir = path.dirname(newFilePath);


            //检查文件夹是否存在，不存在则创建
            if (!fs.existsSync(dir) && dir !== '') {
                fs.mkdirSync(dir, { recursive: true });
                //debug
                // console.log(`Created folder: ${dir}`);
            }
            //debug
            // console.log(`Extracted: ${filePath}`, entry.file);

            // 因为环境的问题，entry.file 是一个 Blob 对象，无法直接写入到磁盘，所以需要将其转换为 Buffer
            try {
                const reader = new FileReader();
                reader.onload = () => {
                    const buffer = Buffer.from(reader.result);
                    try {
                        fs.writeFileSync(newFilePath, buffer)
                    }
                    catch (error) {
                        console.error(`Error: ${error}`);
                        ifSuccess = false;
                        snack(`Error: ${error}`, 'error');
                        throw new Error(`Error: ${error}`);
                    }
                };
                reader.onloadend = () => {
                    //debug
                    callbackCount--;
                    // console.log(`onloadend: ${newFilePath}`, callbackCount);
                }
                reader.onloadstart = () => {
                    //debug
                    callbackCount++;
                    startCallback = true;
                    // console.log(`onloadstart: ${newFilePath}`, callbackCount);
                }
                reader.readAsArrayBuffer(entry.file);
            }
            catch (error) {
                console.error(`Error: ${error}`);
                snack(`Error: ${error}`, 'error');
                throw new Error(`Error: ${error}`);
            }
        }

        try {
            const obj = await archiveReader.extractFiles(extractCallback);
            console.debug(obj);
        }
        catch (error) {
            console.error(`Error: ${error}`);
            snack(`Error: ${error}`, 'error');
            // 如果有密码可能是密码错误
            if (ifEncrypted) {
                // snack(`密码错误`);
                const t_message = {
                    zh_cn: `密码错误`,
                    en: `Incorrect password`,
                }
                t_snack(t_message, 'error');
                return false;
            }
            else {
                // 没有密码可能是压缩包损坏，提示用户尝试手动解压
                // snack(`压缩包可能损坏，尝试手动解压`);
                const t_message = {
                    zh_cn: `压缩包可能损坏，尝试手动解压`,
                    en: `The archive may be damaged, try to extract it manually`,
                }
                t_snack(t_message, 'error');
                return false;
            }
        }

        // 等待所有文件解压完成
        while (callbackCount > 0 || !startCallback) {
            //debug
            console.log(`callbackCount: ${callbackCount}`);
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // 如果解压出来的文件包含中文，则提示用户
        if (ifContainChinese) {
            // snack(`文件夹名不能包含中文`);
            const t_message = {
                zh_cn: `解压后包含特殊字符，如中文，已替换为 _`,
                en: `Folder name cannot contain special characters, and has been replaced with _`,
            }
            t_snack(t_message, 'error');
        }

        // 如果解压失败，则提示用户
        if (!ifSuccess) {
            // snack(`解压失败`);
            const t_message = {
                zh_cn: `解压失败,请手动解压`,
                en: `Extraction failed, please extract manually`,
            }
            t_snack(t_message, 'error');

            // 删除解压的文件
            setTimeout(() => {
                fs.rmdirSync(destinationPath, { recursive: true });
                console.log(`Deleted folder: ${destinationPath}`);
                // this.loadMods();
            }, 1000);
            return false;
        }
        else {
            // 提示用户
            // snack(`解压成功`);
            const t_message = {
                zh_cn: `模组 ${path.basename(destinationPath)} 解压成功`,
                en: `Mod ${path.basename(destinationPath)} extracted successfully`,
            }
            t_snack(t_message);

            return true;
        }
    }

    async handleArchiveDrop(file) {
        //debug
        console.log(`handle zip drop: ${file.name}`);

        // 解压到指定位置
        // modName 是文件名，不包含后缀
        const modName = file.name.slice(0, file.name.lastIndexOf('.'));
        const modPath = path.join(this.config.modSourcePath, modName);
        // 创建mod文件夹
        if (fs.existsSync(modPath)) {
            const t_message = {
                zh_cn: `模组 ${modName} 已经存在`,
                en: `Mod ${modName} already exists`,
            }
            t_snack(t_message, 'error');
            return;
        }

        this.showDialog('loading-dialog');

        // 解压文件
        // 使用 libarchive 处理 zip 文件
        //debug
        console.log(`extracting ${file.name} to ${modPath}`);

        // 记录一下时间
        const startTime = new Date().getTime();
        const ifSuccess = await this.extractArchive(file, modPath);
        const endTime = new Date().getTime();

        this.dismissDialog('loading-dialog');

        if (ifSuccess) {
            //- 不再需要完全刷新，只需要将新的mod添加到列表中
            // 读取 mod.json    
            const mod = await this.getModInfo(modName);
            console.log(`getModInfo:`, mod);

            // 如果 currentCharacter 不为空，且 mod 的 character 为 unknown，则将 mod 的 character 设置为 currentCharacter
            //debug
            console.log(`currentCharacter: ${this.temp.currentCharacter}`, mod.character);
            if (this.temp.currentCharacter !== null && this.temp.currentCharacter !== 'all' && this.temp.currentCharacter !== 'selected' && mod.character === 'Unknown') {
                mod.character = this.temp.currentCharacter;
                await mod.saveModInfo();
            }

            this.setCurrentCharacter(mod.character);


            this.setCurrentMod(mod);
            this.showDialog('edit-mod-dialog');
        }
        else {
            // 解压失败，删除文件夹
            if (fs.existsSync(modPath)) {
                fs.rmdirSync(modPath, { recursive: true });
                console.log(`Deleted folder: ${modPath}`);
            }
        }

    }



    async handleZipDrop(file) {
        //debug
        console.log(`handle zip drop: ${file.name}`);
        //使用 libarchive 处理 zip 文件
        this.handleArchiveDrop(file);
        return;
    }

    async handleFolderDrop(item) {
        // 如果拖入的是文件夹，则视为用户想要添加一个mod
        // 检查是否已经存在同名的mod
        // debug
        console.log(`handle folder drop: ${item.fullPath}`);
        // 这里的 item.fullPath 是一个虚拟路径，以 / 开头，需要去掉
        const modName = item.fullPath.slice(1);
        // 如果 modList 中已经存在同名的mod，则提示用户
        if (this.data.modList.find((mod) => mod.name === modName)) {
            snack(`Mod ${modName} already exists`);
            return;
        }
        // 将文件夹拷贝到 modSourceDir 中
        // 但是这里的 item 的 fullPath 是一个虚拟路径，无法直接使用 fs 进行操作
        // 但是我们可以递归读取每一个文件，然后将其拷贝到 modSourceDir 的对应位置
        this.showDialog('loading-dialog');
        await this.copyFolder(item, this.config.modSourcePath);
        // 关闭加载对话框
        this.dismissDialog('loading-dialog');


        //debug
        console.log(`Copied folder: ${item.fullPath}`);

        //- 不再需要完全刷新，只需要将新的mod添加到列表中

        const mod = await this.getModInfo(modName);
        console.log(`getModInfo:`, mod);

        // 如果 currentCharacter 不为空，且 mod 的 character 为 unknown，则将 mod 的 character 设置为 currentCharacter
        //debug
        console.log(`currentCharacter: ${this.temp.currentCharacter}`, mod.character);
        if (this.temp.currentCharacter !== null && this.temp.currentCharacter !== 'all' && this.temp.currentCharacter !== 'selected' && mod.character === 'Unknown') {
            mod.character = this.temp.currentCharacter;
            await mod.saveModInfo();
        }

        this.setCurrentMod(mod);
        this.setCurrentCharacter(mod.character);

        this.showDialog('edit-mod-dialog');

        // getModInfo 遇到新的 mod 会触发 addMod 事件，所以这里不需要再次触发
        // this.trigger('addMod', mod);
    }

    async setFilter(character) {
        //debug
        console.log(`set filter: ${character}`);
        this.temp.currentCharacter = character;
        this.trigger('currentCharacterChanged', character);
    }

    // 递归复制文件夹
    async copyFolder(item, targetDir) {
        // debug
        console.log(`copy folder ${item.fullPath} to ${targetDir}`);
        const relativePath = item.fullPath.slice(1); // 去掉开头的 '/'
        const targetPath = path.join(targetDir, relativePath);

        if (item.isDirectory) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            const reader = item.createReader();
            const entries = await new Promise((resolve) => reader.readEntries(resolve));
            for (const entry of entries) {
                await this.copyFolder(entry, targetDir);
            }
        } else if (item.isFile) {
            const file = await new Promise((resolve) => item.file(resolve));
            const reader = new FileReader();
            const buffer = await new Promise((resolve) => {
                reader.onload = () => resolve(Buffer.from(reader.result));
                reader.readAsArrayBuffer(file);
            });
            // 如果 targetPath 不存在，则创建文件
            console.log(`Copied file from ${item.fullPath} to ${targetPath}`);
            fs.writeFileSync(targetPath, buffer);
        }
    }

    //-------- 保存mod的预览图 --------
    async setModPreviewBase64ByName(previewBase64, modName) {
        // 将图片保存到modSource文件夹中，文件名为preview+后缀名，并且将其保存到mod.json中
        // 检查 modName 是否存在
        const modInfo = this.data.modList.find((mod) => mod.name === modName);
        if (!modInfo) {
            snack(`Mod ${modName} not found`);
            return;
        }
        //debug
        console.log(`update mod card cover of`, modInfo);
        const modImageDest = modInfo.setPreviewByBase64(previewBase64);

        // 保存到本地
        modInfo.saveModInfo();

        // 触发事件
        modInfo.triggerChanged();
        modInfo.triggerCurrentModChanged();

        return modImageDest;
    }

    //-==================== 对外接口 ====================
    async openNewWindow(windowPath) {
        await ipcRenderer.send('open-new-window', windowPath);
    }

    async savePreset(presetName, data) {
        ipcRenderer.invoke('save-preset', presetName, data);
    }

    async applyMods(modList) {
        const modTargetPath = this.config.modTargetPath;
        const modSourcePath = this.config.modSourcePath;
        await ipcRenderer.invoke('apply-mods', modList, modSourcePath, modTargetPath);
        this.trigger('modsApplied', modList);
        ipcRenderer.send('snack', '应用成功');
    }

    async addPreset(presetName) {
        // const newPresetPath = this.config.presetPath + '/' + presetName;
        const newPresetPath = path.join(this.config.presetPath, presetName + '.json');
        fs.writeFileSync(newPresetPath, JSON.stringify(this.data.modList));

        // 刷新预设列表
        await this.loadPresets();

        this.trigger('addPreset', presetName);

        setTimeout(() => {
            this.setCurrentPreset(presetName);
        }, 200);
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
        mod.saveModInfo();
    }

    async saveConfig() {
        //debug
        console.log('saveConfig:', this._config);

        await ipcRenderer.invoke('set-current-config', this._config);
    }

    // 同步的保存配置
    saveConfigSync() {
        //debug
        console.log('saveConfig:', this._config);
        ipcRenderer.invoke('set-current-config', this._config);
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
        if (this.config[key] === undefined) {
            //debug
            console.log('未知属性，请检查', key, this.config);
            snack('未知属性，请检查');
            return;
        }
        this.config[key] = value;
        // 考虑 这里 要不要 增加一个 事件钩子，当 config 改变时，触发一个事件
        // 暂时没有这个需求
        this.saveConfig();
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
        setCurrentLanguage(language);
        //debug eventList
        console.log(this.eventList);
        this.saveConfig();
    }

    async setTheme(theme) {
        if (theme !== 'auto' && theme !== 'dark' && theme !== 'light') {
            snack('不支持的主题');
            return;
        }
        if (this.config.theme === theme) {
            return;
        }

        this.config.theme = theme;
        this.trigger('themeChange', theme);
        this.saveConfig();
    }

    async saveModInfo(modInfo) {
        // 该方法已弃用，当调用的时候，抛出异常
        console.warn('saveModInfo is deprecated，data.modList 是同步的，保存到本地请使用 ModInfo.saveModInfo()');
        return;
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

        // 刷新 角色列表
        this.data.characterList = new Set(this.data.modList.map((mod) => mod.character));
        this.data.characterList = Array.from(this.data.characterList).sort();

        // 本地保存
        const jsonModInfo = JSON.stringify(modInfo);
        await ipcRenderer.invoke('save-mod-info', this.config.modSourcePath, jsonModInfo);
        this.trigger('modInfoChanged', modInfo);
    }

    printModInfo(modInfo) {
        console.log(ModData.fromJson(modInfo).print());
        return;
    }

    async moveAllFiles(sourcePath, targetPath) {
        await ipcRenderer.invoke('move-all-files', sourcePath, targetPath);
    }

    //-==================== 事件管理 ====================
    on = EventSystem.on;
    trigger = EventSystem.trigger;


    //-===================== 插件 =====================
    //----------插件接口----------
    // 改为使用 IPluginLoader 的接口
    getPluginData = IPluginLoader.GetPluginData;
    setPluginData = IPluginLoader.SetPluginData;
    registerPluginConfig = IPluginLoader.RegisterPluginConfig;
    savePluginConfigSync = IPluginLoader.SaveAllPluginConfigSync;
    savePluginConfig = IPluginLoader.SaveAllPluginConfig;

    // 支持 css 在当前页面的插入/删除
    addCssWithHash(css) {
        const hash = this.hashCode(css);
        const existingStyle = document.getElementById(hash);
        if (existingStyle) {
            return;
        }
        const style = document.createElement('style');
        style.id = hash;
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    removeCssWithHash(css) {
        const hash = this.hashCode(css);
        const style = document.getElementById(hash);
        if (style) {
            document.head.removeChild(style);
        }
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }
}

function waitInitIManager() {
    return new Promise((resolve, reject) => {
        IManager.getInstance().then((iManager) => {
            iManager.waitInit().then(() => {
                resolve(iManager);
            });
        });
    });
}

ipcRenderer.on('wakeUp', () => {  
    waitInitIManager().then((iManager) => {
        console.log('🌞wakeUp');
        t_snack({
            zh_cn: '🌞程序正常启动~',
            en: '🌞Program is waking up~',
        })
        EventSystem.trigger('wakeUp');
    });
});

let sleepTimer = '';
let isSleeping = false;
// 失去焦点10s后进入睡眠模式
const sleepTimeOutTime = 10000;

ipcRenderer.on('windowBlur', () => {
    const tt = new TranslatedText("☁️windowBlur", "☁️窗口失去焦点");
    console.log(tt.get());
    t_snack(tt);
    EventSystem.trigger('windowBlur');

    sleepTimer = setTimeout(() => {
        // EventSystem.trigger("windowSleep");
        EventSystem.trigger('windowSleep');
        isSleeping = true;
        const tt2 = new TranslatedText("💤windowSleep", "💤窗口休眠");
        console.log(tt2.get());
        t_snack(tt2);
    }, sleepTimeOutTime);
});

ipcRenderer.on('windowFocus', () => {
    const tt = new TranslatedText("👀windowFocus", "👀窗口获得焦点");
    console.log(tt.get());
    if (isSleeping) {
        t_snack(tt);
        isSleeping = false;
        EventSystem.trigger('windowWake');
    }
    EventSystem.trigger('windowFocus');

    if (sleepTimer != '') {
        clearTimeout(sleepTimer);
    }
});

export default IManager;
export { waitInitIManager, g_temp, g_temp_vue, g_config, g_config_vue, g_data, g_data_vue };
