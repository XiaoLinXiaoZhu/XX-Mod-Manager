// 管理tape 和 config 的 类

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

import { snack, t_snack, SnackType} from '../../../helper/SnackHelper';
import { TranslatedText } from '../../../helper/Language';
import fsProxy from '../../../electron/fsProxy';
import { ref } from 'vue';

let g_allConfig: TapeConfig[] = [];
const g_allConfig_vue = ref(g_allConfig);


class TapeConfig{
    public _dir: string;
    private static _userConfigPath: string = '';
    private static _configRootPath: string = '';
    public static async getConfigRootPath(){
        // 默认为用户数据路径
        this._userConfigPath = await ipcRenderer.invoke('get-user-data-path');
        this._configRootPath = path.join(this._userConfigPath, 'config');
        return this._configRootPath;
    }

    public name: string;
    public desc: string;
    public tape_front: string;
    public tape_side: string;
    public tape_back: string;
    public tape_spine: string;
    

    constructor(dir: string) {
        this._dir = dir;
        // name为文件夹名
        this.name = path.basename(dir);
        this.tape_front = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `front.${ext}`)).find(fs.existsSync) || '';
        this.tape_side = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `side.${ext}`)).find(fs.existsSync) || '';
        this.tape_back = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `back.${ext}`)).find(fs.existsSync) || '';
        this.tape_spine = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `spine.${ext}`)).find(fs.existsSync) || '';
        const descriptionPath = path.join(this._dir, 'description.txt');
        this.desc = fs.existsSync(descriptionPath) ? fs.readFileSync(descriptionPath, 'utf-8') : new TranslatedText('No Description','没有描述').get();

        // debug
        console.log(this);
    }



    // 加载所有的配置
    static async loadAllConfig(){
        const configRootDir = await TapeConfig.getConfigRootPath()
        // 如果不存在config文件夹，创建一个
        if(!fs.existsSync(configRootDir)){
            t_snack(new TranslatedText('Config folder not found, creating a new one', '未找到配置文件夹，正在创建一个'), SnackType.info);
            fs.mkdirSync(configRootDir);
            // 打开文件夹
            fsProxy.openDir(configRootDir);
        }
        // 遍历 config
        const configDirs: string[] = fs.readdirSync(configRootDir).filter((file: string): boolean => fs.statSync(path.join(configRootDir, file)).isDirectory());
        // 如果没有配置文件夹，创建一个
        if(configDirs.length === 0){
            t_snack(new TranslatedText('No config found', '未找到配置文件'), SnackType.error);
            return [];
        }
        const configList: TapeConfig[] = configDirs.map((dir: string): TapeConfig => {
            return new TapeConfig(path.join(configRootDir, dir));
        });
        //debug
        console.log("0000000000000000000000", configList);
        this.allConfig = configList;
        return configList;
    }
    static _allConfig: TapeConfig[] = [];
    static get allConfig(){
        return this._allConfig;
    }
    static set allConfig(value: TapeConfig[]){
        this._allConfig = value;
        // 全局变量 和 这里同步
        g_allConfig_vue.value = value;
        g_allConfig = value;
    }


    static async getAllConfig(){
        if(this._allConfig.length === 0){
            this._allConfig = await this.loadAllConfig();
        }
        return this._allConfig;
    }
    static async reloadAllConfig(){
        this._allConfig = await this.loadAllConfig();
    }
    static clearConfig(){
        this._allConfig = [];
        console.log('All configurations cleared.');
    }

    static async createConfig(name: string){
        if (name === ''){
            t_snack(new TranslatedText('Name cannot be empty', '名称不能为空'), SnackType.error);
            return;
        }
        const configRootDir = await this.getConfigRootPath();
        const newConfigDir = path.join(configRootDir, name);
        console.log(newConfigDir);
        if(fs.existsSync(newConfigDir)){
            t_snack(new TranslatedText('Config already exists', '配置已存在'), SnackType.error);
            return;
        }
        fs.mkdirSync(newConfigDir);
        t_snack(new TranslatedText('Config created', '配置已创建'), SnackType.info);
        this.reloadAllConfig();
    }
}


// 自己触发一下获取路径
TapeConfig.getConfigRootPath();

export default TapeConfig;
export { g_allConfig_vue };
