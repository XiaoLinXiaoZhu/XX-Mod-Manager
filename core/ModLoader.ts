// 用于加载 Mod，将其转换为 ModInfo 对象
import { ModData } from './ModHelper';
import { ModInfo } from './ModInfo';

const fs = require('fs');
const path = require('path');

class ModLoader {
    public static modSourceFolders: string[] = [];
    static addModSourceFolder(folder: string) {
        // check一下是否存在
        if (folder === undefined || folder === null || folder === '') {
            console.warn('ModLoader.addModSourceFolder: folder is empty');
            return;
        }
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
    static modsRaw: ModInfo[] = [];
    static mods: ModData[] = [];
    static async loadMods() {
        let startTime = Date.now();

        this.modsRaw = [];
        this.mods = [];

        if (this.modSourceFolders.length === 0) {
            // throw new Error('ModLoader.loadMods: no mod source folder');
            console.warn('ModLoader.loadMods: no mod source folder');
            return [];
        }

        // 读取所有的 mod 文件夹
        await Promise.all(this.modSourceFolders.map(async folder => {
            let mods = await fs.promises.readdir(folder, { withFileTypes: true });
            await Promise.all(mods.map(async mod => {
                if (mod.isDirectory()) {
                    let modPath = path.join(folder, mod.name);
                    let modInfo = new ModInfo(modPath);
                    this.modsRaw.push(modInfo);
                    this.mods.push(ModData.fromModInfo(modInfo).setModSourcePath(folder));
                }
            }
            ));
        })).then(() => {
            console.log(`ModLoader.loadMods: loaded ${this.modsRaw.length} mods in ${Date.now() - startTime}ms`);
        });

        return this.mods;
    }
    static async loadMod(modPath: string) {
        if (modPath === undefined || modPath === null || modPath === '') {
            throw new Error('ModLoader.loadMod: modPath is empty');
        }
        if (!fs.existsSync(modPath)) {
            throw new Error(`ModLoader.loadMod: modPath does not exist: ${modPath}`);
        }
        // check一下是否是文件夹
        if (!fs.statSync(modPath).isDirectory()) {
            throw new Error(`ModLoader.loadMod: modPath is not a directory: ${modPath}`);
        }
        let modInfo = new ModInfo(modPath);
        this.modsRaw.push(modInfo);
        const folder = path.dirname(modPath);
        let modData = ModData.fromModInfo(modInfo).setModSourcePath(folder);
        this.mods.push(modData);
        return {
            modInfo: modInfo,
            modData: modData
        };
    }

    public static getModByID(id: string): ModInfo | undefined {
        return this.modsRaw.find(mod => mod.id === id);
    }
}

// 测试一下
// ModLoader.addModSourceFolder("D:\\GameResource\\WWMI\\ModSource");
// ModLoader.loadMods();

export default ModLoader;