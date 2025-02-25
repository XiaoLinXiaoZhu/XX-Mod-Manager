// 管理tape 和 config 的 类

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

import { snack, t_snack, SnackType} from '../../../helper/SnackHelper';
import { TranslatedText } from '../../../helper/Language';
import fsProxy from '../../../electron/fsProxy';

class TapeConfig{
    private _dir: string;
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
        this.tape_front = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `front.${ext}`)).find(fs.existsSync) || '';
        this.tape_side = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `side.${ext}`)).find(fs.existsSync) || '';
        this.tape_back = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `back.${ext}`)).find(fs.existsSync) || '';
        this.tape_spine = ['jpg', 'jpeg', 'png', 'gif'].map(ext => path.join(this._dir, `spine.${ext}`)).find(fs.existsSync) || '';
        const descriptionPath = path.join(this._dir, 'description.txt');
        this.desc = fs.existsSync(descriptionPath) ? fs.readFileSync(descriptionPath, 'utf-8') : new TranslatedText('No Description','没有描述');

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

        return configList;
    }
}


// 自己触发一下获取路径
TapeConfig.getConfigRootPath();

export default TapeConfig;