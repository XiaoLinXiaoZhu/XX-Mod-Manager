import ErrorHandler from "./ErrorHandler";
import { ModInfo, ModMetaData, ModMetaDataItem, ModMetaDataType } from "./ModInfo";
const fs = require('fs');
const path = require('path');

let dataPath = "";
const { ipcRenderer } = require('electron');

class XXMMCore{
    // 核心的四个文件夹
    static modSourceFolder: string = "modSource";
    static modTargetFolder: string = "modTarget";
    static modArchiveFolder: string = "modArchive";

    // 是否使用默认配置文件
    static ifCustomConfig: boolean = false;
    static customConfigFolder: string = "config";

    static setDataPath = (path: string) => {
        dataPath = path;
    }
    // 获取配置文件路径
    static readonly getConfigFilePath: () => string = () => {
        return (XXMMCore.ifCustomConfig) ? path.join(XXMMCore.customConfigFolder, 'config.json') : path.join(dataPath, 'config.json');
    }
    static readonly getPluginConfigPath = () => {
        return (XXMMCore.ifCustomConfig) ? path.join(XXMMCore.customConfigFolder, 'pluginConfig.json') : path.join(dataPath, 'pluginConfig.json');
    }
    static readonly getDisabledPluginsPath = () => {
        return (XXMMCore.ifCustomConfig) ? path.join(XXMMCore.customConfigFolder, 'disabledPlugins.json') : path.join(dataPath, 'disabledPlugins.json');
    }
    static readonly getCurrentConfig = () => {
        //debug
        console.log(`getConfigFilePath: ${XXMMCore.getConfigFilePath()}，content: ${fs.readFileSync(XXMMCore.getConfigFilePath(), 'utf8')}`);
        // return JSON.parse(fs.readFileSync(XXMMCore.getConfigFilePath(), 'utf8'));
        return ErrorHandler.create(() => {
            if (!fs.existsSync(XXMMCore.getConfigFilePath())) {
                // 如果配置文件不存在，则创建一个
                fs.writeFileSync(XXMMCore.getConfigFilePath(), JSON.stringify({}, null, 4), 'utf8');
            }
            return JSON.parse(fs.readFileSync(XXMMCore.getConfigFilePath(), 'utf8'));
        }).onErr((e) => {
            console.error(`getCurrentConfig error: ${e}`);
            return {};
        }).exec();
    }
    static readonly getPluginConfig = () => {
        return JSON.parse(fs.readFileSync(XXMMCore.getPluginConfigPath(), 'utf8'));
    }

    // 初始化
    static async init(){
        // 获取数据路径
        dataPath = await ipcRenderer.invoke('get-user-data-path');

        const args = await ipcRenderer.invoke('get-args');
        if (args.ifCustomConfig){
            XXMMCore.ifCustomConfig = true;
            XXMMCore.customConfigFolder = args.customConfigFolder;
        }

        // 读取配置文件
        if (fs.existsSync(XXMMCore.getConfigFilePath())) {
            const config = JSON.parse(fs.readFileSync(XXMMCore.getConfigFilePath(), 'utf8'));
            XXMMCore.modSourceFolder = config.modSourceFolder;
            XXMMCore.modTargetFolder = config.modTargetFolder;
            XXMMCore.modArchiveFolder = config.modArchiveFolder;
        }
    }

}

XXMMCore.init();
export default XXMMCore;