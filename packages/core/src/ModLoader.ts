// 用于加载 Mod，将其转换为 ModInfo 对象
import { ModData } from "./ModHelper";
import { ModInfo } from "./ModInfo";

const fs = require("node:fs");
const path = require("node:path");

class ModLoader {
  public static modSourceFolders: string[] = [];
  static addModSourceFolder(folder: string) {
    // check一下是否存在
    if (folder === undefined || folder === null || folder === "") {
      console.warn("ModLoader.addModSourceFolder: folder is empty");
      return;
    }
    if (!fs.existsSync(folder)) {
      throw new Error(
        `ModLoader.addModSourceFolder: folder does not exist: ${folder}`,
      );
    }
    // check一下是否是文件夹
    if (!fs.statSync(folder).isDirectory()) {
      throw new Error(
        `ModLoader.addModSourceFolder: folder is not a directory: ${folder}`,
      );
    }
    if (!ModLoader.modSourceFolders.includes(folder))
      ModLoader.modSourceFolders.push(folder);
  }
  static removeModSourceFolder(folder: string) {
    ModLoader.modSourceFolders = ModLoader.modSourceFolders.filter(
      (f) => f !== folder,
    );
  }

  // 加载 Mod
  static modsRaw: ModInfo[] = [];
  static mods: ModData[] = [];
  private static afterLoadCallbacks: ((mods: ModData[]) => void)[] = [];

  static onAfterLoad(callback: (mods: ModData[]) => void) {
    if (typeof callback !== "function") {
      throw new Error("ModLoader.onAfterLoad: callback must be a function");
    }
    ModLoader.afterLoadCallbacks.push(callback);
  }

  private static triggerAfterLoadCallbacks() {
    ModLoader.afterLoadCallbacks.forEach((callback) => {
      try {
        callback(ModLoader.mods);
      } catch (error) {
        console.error(
          "ModLoader.triggerAfterLoadCallbacks: error in callback",
          error,
        );
      }
    });
  }

  static async loadMods() {
    // 检查一下调用堆栈
    console.trace("ModLoader.loadMods: called from", new Error());
    const startTime = Date.now();

    ModLoader.modsRaw = [];
    ModLoader.mods = [];

    if (ModLoader.modSourceFolders.length === 0) {
      // throw new Error('ModLoader.loadMods: no mod source folder');
      console.warn("ModLoader.loadMods: no mod source folder");
      return [];
    }

    // 读取所有的 mod 文件夹
    await Promise.all(
      ModLoader.modSourceFolders.map(async (folder) => {
        const mods = await fs.promises.readdir(folder, { withFileTypes: true });
        await Promise.all(
          mods.map(async (mod) => {
            if (mod.isDirectory()) {
              const modPath = path.join(folder, mod.name);
              const modInfo = new ModInfo(modPath);
              ModLoader.modsRaw.push(modInfo);
              ModLoader.mods.push(
                ModData.fromModInfo(modInfo).setModSourcePath(folder),
              );
            }
          }),
        );
      }),
    ).then(() => {
      console.log(
        `ModLoader.loadMods: loaded ${ModLoader.modsRaw.length} mods in ${Date.now() - startTime}ms`,
      );
    });

    // 触发回调函数
    ModLoader.triggerAfterLoadCallbacks();
    // 返回 mod 列表

    return ModLoader.mods;
  }

  static async loadMod(modPath: string) {
    if (modPath === undefined || modPath === null || modPath === "") {
      throw new Error("ModLoader.loadMod: modPath is empty");
    }
    if (!fs.existsSync(modPath)) {
      throw new Error(`ModLoader.loadMod: modPath does not exist: ${modPath}`);
    }
    // check一下是否是文件夹
    if (!fs.statSync(modPath).isDirectory()) {
      throw new Error(
        `ModLoader.loadMod: modPath is not a directory: ${modPath}`,
      );
    }
    const modInfo = new ModInfo(modPath);
    ModLoader.modsRaw.push(modInfo);
    const folder = path.dirname(modPath);
    const modData = ModData.fromModInfo(modInfo).setModSourcePath(folder);
    ModLoader.mods.push(modData);
    return {
      modInfo: modInfo,
      modData: modData,
    };
  }

  public static getModByID(id: string): ModInfo | undefined {
    return ModLoader.modsRaw.find((mod) => mod.id === id);
  }
}

// 测试一下
// ModLoader.addModSourceFolder("D:\\GameResource\\WWMI\\ModSource");
// ModLoader.loadMods();

export default ModLoader;
