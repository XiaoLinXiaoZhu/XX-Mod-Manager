// 这是一个单例式 Manager 类，用于 保存 管理 所有的 数据
// 所有的数据都从 这里 获取，包括 各种页面的样式，事件的触发，数据的获取等等
// 这样的话，方便将所有非核心功能 转化为 插件，方便管理和拓展

// 这个类应该 被划分到 渲染进程底下，但是 主进程也应该能够访问到这个类
const { ipcRenderer } = require('electron');

const fs = require('fs');
let pathOsName = () => { return 'path' };
const path = require(pathOsName());

// 导入 libarchivejs
let Archive = (window as any).Archive;

// 导入 hmc-win32
const HMC_Name = 'hmc-win32';
const HMC = require(HMC_Name);

// 导入 Language
import { Language, TranslatedText, setCurrentLanguage } from './Language';
// 导入 SnackHelper
import { t_snack, SnackType, snack } from './SnackHelper';
// 导入 EventSystem
import { EventType, EventSystem } from './EventSystem';
// 导入 PluginLoader
import { IPluginLoader } from './PluginLoader';
// 导入 PathHelper
import { PathHelper } from './PathHelper';
// 导入 ModHelper
import { ModData } from '../core/ModHelper';



/** @class
 * @classdesc XManager 用于管理所有的数据   
 * @desc 这是一个单例式 Manager 类，用于 保存 管理 所有的 数据
 * 所有的数据都从 这里 获取，包括 各种页面的样式，事件的触发，数据的获取等等
*/
class XManager {
    private static instance: XManager;
    public static async getInstance() {
        if (!this.instance) {
            this.instance = new XManager();

        }
        return this.instance;
    }

    constructor() {
        Archive = (window as any).Archive;
        if (!Archive) {
            console.error('Archive is not defined');
            t_snack(new TranslatedText('Archive is not defined', 'Archive 解压缩模块未找到'), SnackType.error);
        }

        XManager.instance = this;
        this.HMC = HMC;
        // 初始化
        this.init();
    }

    //-===================== 核心数据 ======================-//
    // 核心数据，可以后面慢慢扩充，现在只将必要的数据放在这里
    // currentConfig = {
    //     name: null, // 当前配置的名称
    //     path: null, // 当前配置的路径
    // };
    public os = process.platform;
    // 对外暴露的 hmc 对象，使得插件可以直接调用 hmc 的方法
    public HMC = null;
    // 从本地加载的配置项
    public config = {
        firstLoad: true, // 是否第一次加载
        language: 'zh_cn' as Language, // 语言
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
    public data = {
        modList: [] as ModData[], // mod列表
        presetList: [], // 预设列表
        characterList: [], // 角色列表
    };

    // 临时数据，用于存储一些临时的数据
    public temp = {
        lastClickedMod: null, // 最后点击的mod，用于显示详情
        currentMod: null as unknown as ModData, // 当前mod
        currentCharacter: null, // 当前角色
        currentTab: 'mod', // 当前tab
        currentPreset: "default", // 当前预设
        wakeUped: false, // 是否 在唤醒状态
    };


    //-===================== 初始化 ======================-//
    private inited = false;
    private anouncedFinishInit = false;

    public async waitInit() {
        while (!this.inited) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        if (!this.anouncedFinishInit) {
            this.anouncedFinishInit = true;
            console.log('✅====== XManager init done ======✅');
        }
    }

    private clearInit() {
        this.inited = false;
        this.anouncedFinishInit = false;

        this.data = {
            modList: [],
            presetList: [],
            characterList: []
        };

        EventSystem.clearAllEvents();
        IPluginLoader.clearAllPlugins();
    }

    async init() {
        this.clearInit();

        console.log('✅>> init XManager');
        // 加载配置
        await this.loadConfig();
        console.log('✅>> loadConfig done');

        //-=============== 优先进行页面初始化 ===============-//
        //------ 设置窗口大小 -----
        await this.setWindowBounds();
        console.log('✅>> setWindowBounds done');
        //------ 切换语言 -----
        EventSystem.trigger(EventType.languageChange, this.config.language);
        setCurrentLanguage(this.config.language);
        console.log('✅>> languageChange to', this.config.language);
        //------ 切换主题 -----
        EventSystem.trigger(EventType.themeChange, this.config.theme);
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

        //ipcRenderer.invoke('set-imanager', this);
        // 这样 传递的数据 会被序列化，导致 无法传递 函数
        // 并且 不能够 同步，因为实际上传递的是复制的数据，而不是引用

        //调用 start 方法
        setTimeout(() => {
            EventSystem.trigger(EventType.initDone, this);
            this.start();
        }, 200);
    }

    // start 在 init 之后调用，在各个其他页面 绑定好事件之后调用
    async start() {
        //-------- 再次切换一次 语言和主题，因为有些页面可能在 init 之后才加载，所以需要再次切换一次
        EventSystem.trigger(EventType.languageChange, this.config.language);
        setCurrentLanguage(this.config.language);
        EventSystem.trigger(EventType.themeChange, this.config.theme);

        //-------- currentMod 默认是 第一个mod
        if (this.data.modList.length > 0) {
            //debug
            // this.temp.lastClickedMod = this.data.modList[0];
            // EventSystem.trigger(EventType.lastClickedMod_Changed, this.temp.lastClickedMod);

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

    //-===================== 对外接口 状态变更 ======================-//
        async setLastClickedMod(mod) {
            // 此方法已弃用，当调用的时候，抛出异常
            console.warn('setLastClickedMod is deprecated');
            throw new Error('setLastClickedMod is deprecated');
            this.temp.lastClickedMod = mod;
            EventSystem.trigger(EventType.lastClickedModChanged, mod);
        }
    
        async setLastClickedModByName(modName) {
            // 此方法已弃用，当调用的时候，抛出异常
            console.warn('setLastClickedModByName is deprecated');
            throw new Error('setLastClickedModByName is deprecated');
        }
    
        async setCurrentCharacter(character) {
            this.temp.currentCharacter = character;
            EventSystem.trigger(EventType.currentCharacterChanged, character);
            //debug
            console.log(`currentCharacterChanged: ${character}`);
        }
    
        async setCurrentTab(tab) {
            this.temp.currentTab = tab;
            EventSystem.trigger(EventType.currentTabChanged, tab);
    
            //debug
            console.log(`currentTabChanged: ${tab}`);
        }
    
        async setCurrentPreset(presetName) {
            this.temp.currentPreset = presetName;
            EventSystem.trigger(EventType.currentPresetChanged, presetName);
    
            // 这个功能放到插件里面实现，不是核心功能
            // setTimeout(() => {
            //     this.setCurrentCharacter('selected');
            // }, 200);
        }
    
        async setCurrentMod(mod) {
            this.temp.currentMod = mod;
            EventSystem.trigger(EventType.currentModChanged, mod);
        }
    
        async setCurrentModByName(modName) {
            const modInfo = await this.getModInfo(modName);
            if (!modInfo) {
                throw new Error(`Mod with name ${modName} not found`);
            }
            this.temp.currentMod = modInfo;
            //debug
            console.log(`setCurrentModByName: ${modName}`, this.temp.currentMod);
            EventSystem.trigger(EventType.currentModChanged, this.temp.currentMod);
        }
    
        async toggledModByName(modName) {
            const mod = await this.getModInfo(modName);
            EventSystem.trigger(EventType.toggledMod, mod);
        }

    //-===================== 加载配置 ======================-//
    async loadConfig() {
        const currentConfig = await ipcRenderer.invoke('get-current-config');
        console.log(currentConfig);
        //如果为空，则使用默认配置
        if (currentConfig == null || Object.keys(currentConfig).length === 0) {
            // snack('配置文件不存在');
            t_snack(new TranslatedText('Config file not found', '配置文件不存在'), SnackType.error);
            // 保存默认配置
            this.saveConfig();
            return;
        }

        Object.assign(this.config, currentConfig);
        this.saveConfig();

        // 顺便更新一下 Language
        setCurrentLanguage(this.config.language as Language);
    }


    async loadMods() {
        const modSourcePath = this.config.modSourcePath || '';
        //debug
        console.log(new TranslatedText(`loadMods from ${modSourcePath}`, `从 ${modSourcePath} 加载mod`));

        // 增加 鲁棒性
        if (!PathHelper.CheckDir(modSourcePath, false, true, new TranslatedText('Mod Source Path', 'Mod 源路径'))) {
            return;
        }

        const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);

        if (loadMods.length === 0) {
            // snack('modlist is empty');
            t_snack(new TranslatedText('Mod list is empty', 'mod列表为空'), SnackType.error);
            return;
        }

        // 加载 character
        this.data.characterList = Array.from(new Set(loadMods.map((mod) => mod.character)));
        // 当 currentCharacter 不变时，不会触发 currentCharacterChanged 事件
        // 但是 characterList 的顺序 是按照从mod中获取的顺序，所以这里需要将其排序一下，默认按照字母排序
        this.data.characterList = Array.from(this.data.characterList).sort();
        this.data.modList = loadMods;

        //debug
        console.log(loadMods);
        console.log(this.data.characterList);
        return loadMods;
    }

    async loadPresets() {
        const data = await ipcRenderer.invoke('get-preset-list');
        this.data.presetList = data;
    }

    async loadPreset(presetName) {
        if (presetName === 'default') {
            return [];
        }
        return [];
        const presetPath = this.config.presetPath;
        const presetFilePath = path.join(presetPath, `${presetName}.json`);
        if (fs.existsSync(presetFilePath)) {
            return JSON.parse(fs.readFileSync(presetFilePath, 'utf-8'));
        }
        // snack(`Preset ${presetName} not found`);
        t_snack(new TranslatedText(`Preset ${presetName} not found`, `预设 ${presetName} 未找到`), SnackType.error);
        return null;
    }

    async getModInfo(modName) {
        // const data = await ipcRenderer.invoke('get-mod-info', this.config.modSourcePath, modName);
        //! 改为直接从 data 中获取
        const data = this.data.modList.find((mod: { name: string }) => mod.name === modName);
        return data;
    }

    //-===================== 保存配置 ======================-// 
    async saveConfig() {
        //debug
        console.log('saveConfig:', this.config);
        await ipcRenderer.invoke('set-current-config', this.config);
    }

    // 同步的保存配置
    saveConfigSync() {
        //debug
        console.log('saveConfig:', this.config);
        ipcRenderer.invoke('set-current-config', this.config);
    }


    //-===================== 方法 ======================-//
    async setWindowBounds() {
        const bounds = this.config.bounds;
        //debug
        console.log('setWindowBounds:', bounds);
        ipcRenderer.invoke('set-bounds', JSON.stringify(bounds));
    }

    //-====================== 对话框 ======================-//
    async showDialog(dialogID) {
        const dialog = document.getElementById(dialogID);
        if (!dialog) {
            console.log(`dialog ${dialogID} not found`);
            return;
        }
        (dialog as any).show();
    }

    async dismissDialog(dialogID) {
        const dialog = document.getElementById(dialogID);
        if (!dialog) {
            console.log(`dialog ${dialogID} not found`);
            return;
        }
        (dialog as any).show();
    }
}




export { XManager };
