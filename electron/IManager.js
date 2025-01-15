// 这是一个单例式 Manager 类，用于 保存 管理 所有的 数据
// 所有的数据都从 这里 获取，包括 各种页面的样式，事件的触发，数据的获取等等
// 这样的话，方便将所有非核心功能 转化为 插件，方便管理和拓展

// 这个类应该 被划分到 渲染进程底下，但是 主进程也应该能够访问到这个类
const { ipcRenderer, ipcMain } = require('electron');

// import fsProxy from './fsProxy';
// const fs = new fsProxy();
const pathOsName = 'path'
const path = require(pathOsName);

// 导入fs
const fs = require('fs');

// // 导入 adm-zip
// const AdmZip = require('adm-zip');
// adm-zip 弃用，改为使用 Libarchivejs

import {Archive} from 'libarchive.js/main.js';

Archive.init({
    workerUrl: '/node_modules/libarchive.js/dist/worker-bundle.js'
});

function snack(message, type = 'info') {
    ipcRenderer.send('snack', message, type);
}

function t_snack(messages, type = 'info') {
    IManager.getInstance().then((iManager) => {
        iManager.t_snack(messages, type);
    });
}

// // 导入 hmc-win32
const HMC_Name = 'hmc-win32';
const HMC = require(HMC_Name);


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
        if (IManager.instance) {
            return IManager.instance;
        }
        IManager.instance = this;
        this.data = {};
        this.plugins = {};
        this.eventList = {};

        this.HMC = HMC

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
    os = process.platform;
    // 对外暴露的 hmc 对象，使得插件可以直接调用 hmc 的方法
    HMC = null;
    // 从本地加载的配置项
    config = {
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
    data = {
        modList: [], // mod列表
        presetList: [], // 预设列表
        characterList: [], // 角色列表
    };

    // 临时数据，用于存储一些临时的数据
    temp = {
        lastClickedMod: null, // 最后点击的mod，用于显示详情
        currentMod: null, // 当前mod
        currentCharacter: null, // 当前角色
        currentTab: 'mod', // 当前tab
        currentPreset: "default", // 当前预设
        wakeUped: false, // 是否 在唤醒状态
    };



    //-==================== 内部方法 ====================
    async snack(message, type = 'info') {
        snack(message, type);
    }
    async t_snack(messages, type = 'info') {
        if (messages[this.config.language] != null) {
            snack(messages[this.config.language], type);
        }
        else {
            const firstMessageKey = Object.keys(messages)[0];
            snack(messages[firstMessageKey], type);
        }
    }
    async loadConfig() {
        const currentConfig = await ipcRenderer.invoke('get-current-config');
        console.log(currentConfig);
        //如果为空，则使用默认配置
        if (currentConfig == {} || currentConfig == null) {
            snack('配置文件不存在');
            this.saveConfig();
            return;
        }

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
        //debug
        // if (this.config.presetPath === null) {
        //     console.log('presetPath is null');
        // }
        // else if (fs.existsSync(this.config.presetPath) === false) {
        //     // fs.mkdirSync(this.config.presetPath);
        //     // 直接创建文件夹有可能它的父文件夹不存在，所以检查一下
        //     if (!fs.existsSync(path.dirname(this.config.presetPath))) {
        //         console.log(`presetPath's parent not exists`);
        //         snack(`preset folder not exists`, 'error');
        //     }
        //     else {
        //         fs.mkdirSync(this.config.presetPath);
        //     }
        // }

        this.saveConfig();
    }

    async loadMods() {
        const modSourcePath = this.config.modSourcePath;
        //debug
        console.log(`loadMods from ${modSourcePath}`);
        const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);

        if (loadMods == []) {
            snack('mod路径不存在');
            return;
        }

        // 加载 character
        this.data.characterList = new Set(loadMods.map((mod) => mod.character));
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

    async dismissDialog(dialogID) {
        const dialog = document.getElementById(dialogID);
        if (!dialog) {
            console.log(`dialog ${dialogID} not found`);
            return;
        }
        dialog.dismiss();
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
        //------ 设置窗口大小 -----
        await this.setWindowBounds();
        console.log('✅>> setWindowBounds done');
        // 加载mod
        await this.loadMods();
        console.log('✅>> loadMods done');

        // 加载预设
        await this.loadPresets();
        console.log('✅>> loadPresets done');

        // 加载插件
        await this.loadDisabledPlugins();
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
            this.trigger('initDone', this);
        }, 200);
    }

    // start 在 init 之后调用，在各个其他页面 绑定好事件之后调用
    async start() {
        //-------- currentMod 默认是 第一个mod
        if (this.data.modList.length > 0) {
            //debug
            // this.temp.lastClickedMod = this.data.modList[0];
            // this.trigger('lastClickedMod_Changed', this.temp.lastClickedMod);

            this.setCurrentMod(this.data.modList[0]);
            console.log('✅>> currentMod init', this.temp.currentMod);
        }

        //------ 切换语言 -----
        this.trigger('languageChange', this.config.language);
        console.log('✅>> languageChange to', this.config.language);

        //------ 切换主题 -----
        this.trigger('themeChange', this.config.theme);
        console.log('✅>> themeChange to', this.config.theme);


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
        const mod = this.data.modList.find((mod) => mod.name === modName);
        if (mod) {
            this.temp.lastClickedMod = mod;
            this.trigger('lastClickedMod_Changed', mod);
        }
    }

    async setCurrentCharacter(character) {
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

        // 这个功能放到插件里面实现，不是核心功能
        // setTimeout(() => {
        //     this.setCurrentCharacter('selected');
        // }, 200);
    }

    async setCurrentMod(mod) {
        this.temp.currentMod = mod;
        this.trigger('currentModChanged', mod);
    }

    async setCurrentModByName(modName) {
        this.temp.currentMod = await this.getModInfo(modName);
        //debug
        console.log(`setCurrentModByName: ${modName}`, this.temp.currentMod);
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
        const shortcutName = 'XXMM_customConfig.lnk';
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
            // if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-compressed') {
            //     // debug
            //     console.log(`Zip file: ${file.name}`);
            //     // 交给 handleZipDrop 处理
            //     this.handleZipDrop(file);
            //     return;
            // }
            // 通过使用 libarchive 处理 压缩文件，它能够支持所有的压缩文件
            if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-compressed') {
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

    // 解压文件到指定目录的函数
    async extractArchive(archivePath, destinationPath) {
        // 使用 libarchive 处理 zip 文件
        // 读取文件
        const archiveReader = await Archive.open(archivePath);
        // extractFiles(extractCallback?: (entry: { file: File; path: string }) => void): Promise<FilesObject>;
        // extractFiles 只是将其解压到内存中，并不会写入到磁盘
        // 通过 extractCallback 可以获取到解压的文件，然后将其写入到磁盘

        let ifContainChinese = false;
        let ifSuccess = true;

        const extractCallback = (entry) => {
            const filePath = path.join(destinationPath, entry.path);

            // 当解压出来的文件包含中文时，会被替换为 * ，但是文件夹名不能包含 * ，所以需要将其替换为其他字符
            // 将 filePath 中的 * 替换为 _
            const newFilePath = filePath.replace(/\*/g, '_');
            if (filePath !== newFilePath) {
                ifContainChinese = true;
            }
            //debug
            console.log(`Converted: ${filePath}`, newFilePath);
            const dir = path.dirname(newFilePath);


            //检查文件夹是否存在，不存在则创建
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                //debug
                console.log(`Created folder: ${dir}`);
            }
            //debug
            console.log(`Extracted: ${filePath}`, entry.file);

            // 因为环境的问题，entry.file 是一个 Blob 对象，无法直接写入到磁盘，所以需要将其转换为 Buffer
            try {
                const reader = new FileReader();
                reader.onload = () => {
                    const buffer = Buffer.from(reader.result);
                    try {

                    fs.writeFileSync(newFilePath, buffer);
                    }
                    catch (error) {
                        console.error(`Error: ${error}`);
                        ifSuccess = false;
                        snack(`Error: ${error}`, 'error');
                        throw new Error(`Error: ${error}`);
                    }
                };
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
            throw new Error(`Error: ${error}`);
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
                this.loadMods();
            }, 1000);
            return;
        }
        else {
            // 提示用户
            // snack(`解压成功`);
            const t_message = {
                zh_cn: `模组 ${path.basename(archivePath)} 解压成功`,
                en: `Mod ${path.basename(archivePath)} extracted successfully`,
            }
            t_snack(t_message);

            return;
            // 刷新mod列表
            await this.loadMods();
            const mod = await this.getModInfo(modName);

            // 如果 currentCharacter 不为空，且 mod 的 character 为 unknown，则将 mod 的 character 设置为 currentCharacter
            //debug
            console.log(`currentCharacter: ${this.temp.currentCharacter}`, mod.character);

            if (this.temp.currentCharacter !== null && mod.character === 'Unknown') {
                mod.character = this.temp.currentCharacter;
                await this.saveModInfo(mod);
            }
            this.trigger('addMod', mod);

            setTimeout(() => {
                // this.setLastClickedMod(mod);
                this.setCurrentMod(mod);
                this.setCurrentCharacter(mod.character);
                this.showDialog('edit-mod-dialog');
            }, 200);
        }
    }
    async handleArchiveDrop(file) {
        //debug
        console.log(`handle zip drop: ${file.name}`);

        // 解压到指定位置
        const modName = file.name.replace('.zip', '');
        const modPath = path.join(this.config.modSourcePath, modName);
        // 创建mod文件夹
        if (!fs.existsSync(modPath)) {
            fs.mkdirSync(modPath, { recursive: true });
        }
        else {
            // snack(`Mod ${modName} already exists`,"error");
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
        try{
            //debug
            console.log(`extracting ${file.name} to ${modPath}`);
            await this.extractArchive(file, modPath);
            this.dismissDialog('loading-dialog');
        }
        catch (error) {
            this.dismissDialog('loading-dialog');
            console.error(`Error: ${error}`);
            snack(`Error: ${error}`, 'error');
            return;
        }
    }



    async handleZipDrop(file) {
        //debug
        console.log(`handle zip drop: ${file.name}`);
        //使用 libarchive 处理 zip 文件
        this.handleArchiveDrop(file);

        return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const buffer = Buffer.from(event.target.result);

            console.debug(typeof buffer)

            let archive = new Archive(buffer)
            archive.extractFiles().then(data => {
                console.log('data:{}', data);
            })


            return;
            // const buffer = Buffer.from(event.target.result);
            // const zip = new AdmZip(buffer);
            // adm-zip 弃用，改为使用 Libarchivejs
            const zip = new Archive(buffer);

            const modName = file.name.replace('.zip', '');
            const modPath = path.join(this.config.modSourcePath, modName);

            // 创建mod文件夹
            if (!fs.existsSync(modPath)) {
                fs.mkdirSync(modPath, { recursive: true });
            }
            else {
                snack(`Mod ${modName} already exists`);
                return;
            }

            // 将zip文件解压到mod文件夹
            this.showDialog('loading-dialog');
            try {
                // zip.extractAllTo(modPath, true);
                // adm-zip 弃用，改为使用 Libarchivejs
                // await zip.extractFiles(modPath)
            }
            catch (error) {
                this.dismissDialog('loading-dialog');
                console.error(`Error: ${error}`);
                snack(`Error: ${error}`, 'error');
                return;
            }

            // 关闭加载对话框
            this.dismissDialog('loading-dialog');
            // 提示用户
            snack(`Mod ${modName} added successfully`);

            // 刷新mod列表
            await this.loadMods();
            const mod = await this.getModInfo(modName);

            // 如果 currentCharacter 不为空，且 mod 的 character 为 unknown，则将 mod 的 character 设置为 currentCharacter
            //debug
            console.log(`currentCharacter: ${this.temp.currentCharacter}`, mod.character);

            if (this.temp.currentCharacter !== null && mod.character === 'Unknown') {
                mod.character = this.temp.currentCharacter;
                await this.saveModInfo(mod);
            }
            this.trigger('addMod', mod);

            setTimeout(() => {
                // this.setLastClickedMod(mod);
                this.setCurrentMod(mod);
                this.setCurrentCharacter(mod.character);
                this.showDialog('edit-mod-dialog');
            }, 200);
        };
        reader.readAsArrayBuffer(file);
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
        // 复制完成后，刷新 modList
        await this.loadMods();
        console.log(`❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️`);


        // 刷新完成后，弹出提示
        snack(`Added mod ${modName}`);
        console.log(`ModList:`, this.data.modList);


        const mod = await this.getModInfo(modName)
        console.log(`getModInfo:`, mod);
        snack(`After Added mod ${modName}`);

        // 如果 currentCharacter 不为空，且 mod 的 character 为 unknown，则将 mod 的 character 设置为 currentCharacter
        //debug
        console.log(`currentCharacter: ${this.temp.currentCharacter}`, mod.character);
        if (this.temp.currentCharacter !== null && this.temp.currentCharacter !== 'All' && this.temp.currentCharacter !== 'Selected' && mod.character === 'Unknown') {
            mod.character = this.temp.currentCharacter;
            await this.saveModInfo(mod);
        }

        this.trigger('addMod', mod);

        setTimeout(() => {
            // this.setLastClickedMod(mod);
            this.setCurrentMod(mod);
            this.setCurrentCharacter(mod.character);

            this.showDialog('edit-mod-dialog');
        }, 200);
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
        const imageExt = previewBase64.split(';')[0].split('/')[1];
        const modImageName = `preview.${imageExt}`;
        const modImageDest = path.join(this.config.modSourcePath, modName, modImageName)
        fs.writeFileSync(modImageDest, previewBase64.split(',')[1], 'base64');

        //debug
        modInfo.preview = modImageDest;
        // ipcRenderer.invoke('set-mod-info', mod, modInfo);
        this.saveModInfo(modInfo);

        // 刷新侧边栏的mod信息
        // this.trigger('lastClickedMod_Changed', modInfo);
        this.trigger("currentModChanged", modInfo);

        // snack提示
        snack(`Updated cover for ${modInfo}`);

        // 返回 图片的路径
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
        this.saveModInfo(mod);
    }

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
    // 所有的事件：
    //----------生命周期----------
    // wakeUp,initDone
    //----------状态变更----------
    // themeChange,languageChange,
    // lastClickedModChanged,
    // modInfoChanged,
    // currentCharacterChanged,
    // currentPresetChanged,
    //----------事件节点----------
    // modsApplied,addMod,addPreset,
    // toggledMod: 这个事件是在 mod 的开关被切换时触发的，之前和 lastClickedModChanged 一起触发，现在单独触发

    // lastClickedModChanged: 拆分为两个事件，一个是：currentModChanged，一个是：toggledMod

    // 注册事件
    async on(eventName, callback) {
        if (!this.eventList[eventName]) {
            this.eventList[eventName] = [];
        }
        this.eventList[eventName].push(callback);
        //debug
        // console.log(`event ${eventName} registered, all events:`);
        // let result = '';
        // for (const key in this.eventList) {
        //     result += key + ':' + this.eventList[key].length + '\n';
        // }
        // console.log(result);
    }

    // 触发事件
    async trigger(eventName, data) {
        if (this.eventList[eventName]) {
            this.eventList[eventName].forEach((callback) => {
                callback(data);
            });
        }
    }

    //-===================== 插件 =====================
    plugins = {};
    disabledPluginNames = [];
    pluginConfig = {};

    disablePlugin(pluginName) {
        this.disabledPluginNames.push(pluginName);
        this.trigger('pluginDisabled', pluginName);
        this.saveDisabledPlugins();
    }

    enablePlugin(pluginName) {
        this.disabledPluginNames = this.disabledPluginNames.filter((name) => name !== pluginName);
        this.trigger('pluginEnabled', pluginName);
        this.saveDisabledPlugins();
    }

    togglePlugin(pluginName) {
        if (this.disabledPluginNames.includes(pluginName)) {
            this.enablePlugin(pluginName);
        }
        else {
            this.disablePlugin(pluginName);
        }
    }

    //是否启用的这个状态应该保存在本地
    //这样每次打开软件的时候，都会根据这个状态来加载插件
    async saveDisabledPlugins() {
        ipcRenderer.invoke('save-disabled-plugins', this.disabledPluginNames);
    }

    async loadDisabledPlugins() {
        this.disabledPluginNames = await ipcRenderer.invoke('get-disabled-plugins');
        // this.trigger('disabledPluginsLoaded', disabledPluginNames);
        //debug
        console.log('disabledPluginNames:', this.disabledPluginNames);
    }

    registerPlugin(plugin) {
        //debug
        this.plugins[plugin.name] = plugin;

        if (this.disabledPluginNames.includes(plugin.name)) {
            //debug
            console.log(`⛔plugin ${plugin.name} disabled`);
            snack(`插件 ${plugin.name} 已禁用`);
            return;
        }

        if (typeof plugin.init === 'function') {
            plugin.init(this);
        }

        // 尝试加载 插件的本地配置
        ipcRenderer.invoke('get-plugin-config', plugin.name).then((localPluginData) => {
            //debug
            console.log(`ℹ️loadPluginConfig ${plugin.name}`, localPluginData);
            if (localPluginData) {
                //debug
                console.log(`❇️plugin ${plugin.name} loaded with local data`, localPluginData);
                // 这里的 localPluginData 只包含 pluginData的 data，而不包含其他的属性，所以只需要将data赋值为localPluginData
                this.pluginConfig[plugin.name].forEach((data) => {
                    data.data = localPluginData[data.name];
                });
            }
        }
        );

        //debug
        console.log(`▶️plugin ${plugin.name} loaded`, plugin);
    }

    registerPluginConfig(pluginName, pluginConfig) {
        // 如果 pluginConfig 不存在，则创建一个新的数组，否则将 pluginConfig 添加到 pluginConfig 中
        if (this.pluginConfig[pluginName] === undefined) {
            this.pluginConfig[pluginName] = pluginConfig;
        }
        else {
            this.pluginConfig[pluginName] = this.pluginConfig[pluginName].concat(pluginConfig);
        }

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
        //     t_displayName:{
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
        const builtInPluginPath = path.resolve('./plugins');
        // 错误处理
        if (!fs.existsSync(builtInPluginPath)) {
            snack('插件文件夹不存在 ' + builtInPluginPath);
            return;
        }
        const builtInPlugins = fs.readdirSync(builtInPluginPath);
        builtInPlugins.forEach((pluginName) => {
            if (pluginName.endsWith('.js')) {
                try {
                    const plugin = require(path.join(builtInPluginPath, pluginName));
                    this.registerPlugin(plugin);
                }
                catch (e) {
                    console.log(`❌plugin ${pluginName} load failed`, e);
                    // 在 本应该 应该有 插件的位置 创建一个 lookAtMe 文件，以便我定位问题
                    fs.writeFileSync(`./plugins/lookAtMe`, 'lookAtMe');
                    snack(`内置插件 ${pluginName} 加载失败`, 'error');
                }
            }
        });

        // 从 plugins 文件夹中加载插件，其位于 ,userData/plugins 文件夹中
        // 这里应该被视为全局插件 作用于所有的 游戏配置
        const userDataPath = await ipcRenderer.invoke('get-user-data-path');
        const pluginPath = path.join(userDataPath, 'plugins');
        if (!fs.existsSync(pluginPath)) {
            fs.mkdirSync(pluginPath);
        }
        const files = fs.readdirSync(pluginPath);
        files.forEach((file) => {
            if (file.endsWith('.js')) {
                try {
                    const plugin = require(path.join(pluginPath, file));
                    this.registerPlugin(plugin);
                }
                catch (e) {
                    console.log(`❌plugin ${file} load failed`, e);
                    snack(`插件 ${file} 加载失败`, 'error');

                    // 在 本应该 应该有 插件的位置 创建一个 lookAtMe 文件，以便我定位问题
                    fs.writeFileSync(`./plugins/lookAtMe`, 'lookAtMe');
                }
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

    // 同步的保存插件配置
    savePluginConfigSync() {
        for (const pluginName in this.pluginConfig) {
            const pluginData = this.pluginConfig[pluginName];
            const localPluginData = {};
            pluginData.forEach((data) => {
                localPluginData[data.name] = data.data;
            });

            console.log('savePluginConfig:', pluginName, localPluginData);

            ipcRenderer.invoke('save-plugin-config', pluginName, localPluginData);
        }
    }

    //----------插件接口----------
    getPluginData(pluginName, dataName) {
        const pluginData = this.pluginConfig[pluginName];
        const data = pluginData.find((data) => data.name === dataName);
        return data.data;
    }

    setPluginData(pluginName, dataName, value) {
        const pluginData = this.pluginConfig[pluginName];
        const data = pluginData.find((data) => data.name === dataName);
        data.onChange(value);
    }

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
    console.log('🌞wakeUp');
    snack('🌞wakeUp');
    waitInitIManager().then((iManager) => {
        iManager.trigger('wakeUp');
    });
});

let sleepTimer = '';
let isSleeping = false;
// 失去焦点10s后进入睡眠模式
const sleepTimeOutTime = 10000;

ipcRenderer.on('windowBlur', () => {
    console.log('☁️windowBlur');
    // snack('☁️windowBlur');
    const iManager = new IManager();
    iManager.trigger('windowBlur');

    sleepTimer = setTimeout(() => {
        iManager.trigger("windowSleep");
        isSleeping = true;
        snack('💤windowSleep');
    }, sleepTimeOutTime);
});

ipcRenderer.on('windowFocus', () => {
    console.log('windowFocus');
    if (isSleeping) {
        snack('👀windowFocus');
        isSleeping = false;
    }
    const iManager = new IManager();
    iManager.trigger('windowFocus');

    if (sleepTimer != '') {
        clearTimeout(sleepTimer);
    }
});

export default IManager;
export { snack, t_snack, waitInitIManager };

