// 用于加载 Mod，将其转换为 ModInfo 对象
//@ts-ignore
import ModLoaderWorker from './ModLoader.Worker?worker';
import { ModData } from './ModHelper';

const fs = require('fs');
const path = require('path');

class ModLoader {
    public static modSourceFolders: string[] = [];
    static addModSourceFolder(folder: string) {
        // check一下是否存在
        if (!fs.existsSync(folder)) {
            throw new Error(`ModLoader.addModSourceFolder: folder does not exist: ${folder}`);
        }
        // check一下是否是文件夹
        if (!fs.statSync(folder).isDirectory()) {
            throw new Error(`ModLoader.addModSourceFolder: folder is not a directory: ${folder}`);
        }
        if (!this.modSourceFolders.includes(folder))
            this.modSourceFolders.push(folder);
    }
    static removeModSourceFolder(folder: string) {
        this.modSourceFolders = this.modSourceFolders.filter(f => f !== folder);
    }
    

    // 加载 Mod
    static modsRaw = {};
    static mods: ModData[] = [];
    static loadMods() {
        let startTime = Date.now();


        if (this.modSourceFolders.length === 0) {
            // throw new Error('ModLoader.loadMods: no mod source folder');
            console.warn('ModLoader.loadMods: no mod source folder');
            return [];
        }
        // 读取所有的 mod 文件夹
        // 使用 worker 加载
        const worker = new ModLoaderWorker();
        worker.onmessage = (e) => {
            const {data, type} = e.data;
            if (e.data.type === 'finished') {
                worker.terminate();
                this.modsRaw = data;
                // 这里的 data 是一个 []，里面是所有的 mod 的 json
                // 将其转换为 ModData 对象
                this.mods = data.map((json) => ModData.fromJson(json));
                console.log('ModLoader.loadMods: loaded', this.mods.length, 'mods');
                let endTime = Date.now();
                console.log('ModLoader.loadMods: time', endTime - startTime, 'ms');
            }
            else if (e.data.type === 'error') {
                console.error('ModLoader.loadMods: error', e.data.error);
            }
            else if (e.data.type === 'ready') {
                worker.postMessage({type: 'load', data: this.modSourceFolders});
            }
            else {
                console.warn('ModLoader.loadMods: unknown message', e.data);
            }
        };
    }
}

// 测试一下
ModLoader.addModSourceFolder("D:\\GameResource\\WWMI\\ModSource");
ModLoader.loadMods();

export default ModLoader;