// 管理tape 和 config 的 类

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

import { snack, t_snack, SnackType} from '../../../helper/SnackHelper';
import { TranslatedText } from '../../../helper/Language';
import fsProxy from '../../../electron/fsProxy';
class TapeConfig{
    






    // 加载所有的配置
    static async loadAllConfig(){
        const userDatePath = await ipcRenderer.invoke('get-user-data-path');
        const configRootDir = path.join(userDatePath, 'config');
        // 如果不存在config文件夹，创建一个
        if(!fs.existsSync(configRootDir)){
            t_snack(new TranslatedText('Config folder not found, creating a new one', '未找到配置文件夹，正在创建一个'), SnackType.info);
            fs.mkdirSync(configRootDir);
            // 打开文件夹
            fsProxy.openDir(configRootDir);
        }

    }
}