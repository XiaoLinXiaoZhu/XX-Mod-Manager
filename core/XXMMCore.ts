import ErrorHandler from "./ErrorHandler";
import { SnackType, t_snack } from "../helper/SnackHelper";
import { ModInfo, ModMetaData, ModMetaDataItem, ModMetaDataType } from "./ModInfo";
import { TranslatedText } from "../helper/Language";
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
    // dataPath 就是默认的 configFolder
    public static setCustomConfigFolder = (path: string) => {
        // 检查路径是否存在
        if (!fs.existsSync(path)){
            t_snack(new TranslatedText("Custom config folder not exist", "自定义配置文件夹不存在"), SnackType.error);
            console.error(`Custom config folder not exist: ${path}`);
            return;
        }
        // 设置自定义配置文件夹
        XXMMCore.customConfigFolder = path;
        XXMMCore.ifCustomConfig = true;

        // when reload，these two lines will be clear
        // so we need send it back to main process
        ipcRenderer.send('set-custom-config-folder', path);
    }

    static setDataPath(path: string){
        dataPath = path;
    }
    //- dataPath
    public static async getDataPath(){
        if (dataPath === ""){
            dataPath = await ipcRenderer.invoke('get-user-data-path');
        }
        return dataPath;
    }
    public static getDataPathSync(){
        if (dataPath === ""){
            // 获取一下参数，检查是否有传入自定义路径
            // debug
            console.log(`data path is empty, get args`);
            const args = ipcRenderer.sendSync('get-args-sync');
            //debug
            console.log(`args: `, args);
            if (args.ifCustomConfig){
                XXMMCore.ifCustomConfig = true;
                // XXMMCore.customConfigFolder = args.customConfigFolder;
                // 检查路径是否存在
                if (fs.existsSync(args.customConfigFolder)){
                    XXMMCore.customConfigFolder = args.customConfigFolder;
                }else{
                    t_snack(new TranslatedText("Custom config folder not exist", "自定义配置文件夹不存在"), SnackType.error);
                    console.error(`Custom config folder not exist: ${args.customConfigFolder}`);
                }
            }
            dataPath = ipcRenderer.sendSync('get-user-data-path-sync');
        }
        return dataPath;
    }

    static checkDataPath(){
        if (dataPath === ""){
            dataPath = XXMMCore.getDataPathSync();
        }
        if (this.ifCustomConfig){
            //debug
            console.log(`Using custom config folder: ${this.customConfigFolder} instead of ${dataPath}`);
        }
    }

    //- 获取配置文件路径
    static readonly getConfigFilePath: () => string = () => {
        this.checkDataPath();
        return (XXMMCore.ifCustomConfig) ? path.join(XXMMCore.customConfigFolder, 'config.json') : path.join(dataPath, 'config.json');
    }
    static readonly getPluginConfigPath = () => {
        this.checkDataPath();

        return (XXMMCore.ifCustomConfig) ? path.join(XXMMCore.customConfigFolder, 'pluginConfig.json') : path.join(dataPath, 'pluginConfig.json');
    }
    static readonly getDisabledPluginsPath = () => {
        this.checkDataPath();
        return (XXMMCore.ifCustomConfig) ? path.join(XXMMCore.customConfigFolder, 'disabledPlugins.json') : path.join(dataPath, 'disabledPlugins.json');
    }

    public static getCurrentConfig(){
        //debug
        const configFilePath = XXMMCore.getConfigFilePath();
        if (!fs.existsSync(configFilePath)){
            fs.writeFileSync(configFilePath, JSON.stringify({}, null, 4), 'utf8');
            console.log(`Config file not exist, create a new one: ${configFilePath}`);
        }
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

    public static saveCurrentConfig(config: any) {
        try {
            // debug
            console.log(`saveCurrentConfig: ${JSON.stringify(config, null, 4)}`);
            fs.writeFileSync(XXMMCore.getConfigFilePath(), JSON.stringify(config, null, 4), 'utf8');
        } catch (e) {
            console.error(`saveCurrentConfig error: ${e}`);
        }
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