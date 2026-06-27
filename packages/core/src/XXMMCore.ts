// XXMMCore.ts — 核心配置管理（IPC 迁移版）

import { ipcRenderer } from "electron";
import { createClient, IPC } from "@xxmm/ipc";
import { asFilePath, asDirPath } from "@xxmm/types";
import { appI18n } from "@xxmm/helper/I18nConfig";
import { joinPath } from "@xxmm/helper/PathUtil";
import ErrorHandler from "./ErrorHandler";

const ipc = createClient(IPC);

let dataPath = "";

class XXMMCore {
  static modSourceFolder: string = "modSource";
  static modTargetFolder: string = "modTarget";
  static modArchiveFolder: string = "modArchive";

  static ifCustomConfig: boolean = false;
  static customConfigFolder: string = "config";

  public static setCustomConfigFolder = async (folderPath: string) => {
    if (!(await ipc.fs.exists(asFilePath(folderPath)))) {
      ipc.app.snack(appI18n("自定义配置文件夹不存在"), "error");
      console.error(`Custom config folder not exist: ${folderPath}`);
      return;
    }
    XXMMCore.customConfigFolder = folderPath;
    XXMMCore.ifCustomConfig = true;

    ipcRenderer.send("set-custom-config-folder", folderPath);
  };

  static setDataPath(p: string) {
    dataPath = p;
  }

  public static async getDataPath() {
    if (dataPath === "") {
      dataPath = await ipcRenderer.invoke("get-user-data-path");
    }
    return dataPath;
  }

  public static getDataPathSync() {
    if (dataPath === "") {
      console.log("data path is empty, get args");
      const args = ipcRenderer.sendSync("get-args-sync");
      console.log("args: ", args);
      if (args.ifCustomConfig) {
        XXMMCore.ifCustomConfig = true;
        if (!ipcRenderer.sendSync("fs-exists-sync", args.customConfigFolder)) {
          ipc.app.snack(appI18n("自定义配置文件夹不存在"), "error");
          console.error(
            `Custom config folder not exist: ${args.customConfigFolder}`,
          );
        } else {
          XXMMCore.customConfigFolder = args.customConfigFolder;
        }
      }
      dataPath = ipcRenderer.sendSync("get-user-data-path-sync");
    }
    return dataPath;
  }

  static checkDataPath() {
    if (dataPath === "") {
      dataPath = XXMMCore.getDataPathSync();
    }
    if (XXMMCore.ifCustomConfig) {
      console.log(
        `Using custom config folder: ${XXMMCore.customConfigFolder} instead of ${dataPath}`,
      );
    }
  }

  static readonly getPluginConfigPath = () => {
    this.checkDataPath();
    return XXMMCore.ifCustomConfig
      ? joinPath(XXMMCore.customConfigFolder, "pluginConfig.json")
      : joinPath(dataPath, "pluginConfig.json");
  };

  static readonly getDisabledPluginsPath = () => {
    this.checkDataPath();
    return XXMMCore.ifCustomConfig
      ? joinPath(XXMMCore.customConfigFolder, "disabledPlugins.json")
      : joinPath(dataPath, "disabledPlugins.json");
  };

  static readonly getConfigFilePath = () => {
    this.checkDataPath();
    return XXMMCore.ifCustomConfig
      ? joinPath(XXMMCore.customConfigFolder, "config.json")
      : joinPath(dataPath, "config.json");
  };

  public static async getCurrentConfig() {
    const configFilePath = XXMMCore.getConfigFilePath();

    if (!(await ipc.fs.exists(asFilePath(configFilePath)))) {
      await ipc.fs.writeFile(
        asFilePath(configFilePath),
        JSON.stringify({}, null, 4),
      );
      console.log(`Config file not exist, create a new one: ${configFilePath}`);
    }

    const raw = await ipc.fs.readFile(asFilePath(configFilePath));
    console.log(`getConfigFilePath: ${configFilePath}, content: ${raw}`);

    return ErrorHandler.create(() => {
      return JSON.parse(raw);
    })
      .onErr((e: unknown) => {
        console.error(`getCurrentConfig error: ${e}`);
        return {};
      })
      .exec();
  }

  public static async saveCurrentConfig(config: unknown) {
    try {
      console.log(`saveCurrentConfig: ${JSON.stringify(config, null, 4)}`);
      await ipc.fs.writeFile(
        asFilePath(XXMMCore.getConfigFilePath()),
        JSON.stringify(config, null, 4),
      );
    } catch (e) {
      console.error(`saveCurrentConfig error: ${e}`);
    }
  }

  public static saveCurrentConfigSync(config: unknown) {
    try {
      console.log(`saveCurrentConfigSync: ${JSON.stringify(config, null, 4)}`);
      ipc.fs.writeFile(
        asFilePath(XXMMCore.getConfigFilePath()),
        JSON.stringify(config, null, 4),
      );
    } catch (e) {
      console.error(`saveCurrentConfigSync error: ${e}`);
    }
  }

  public static async getAllPluginConfig() {
    const raw = await ipc.fs.readFile(
      asFilePath(XXMMCore.getPluginConfigPath()),
    );
    return JSON.parse(raw);
  }

  public static async getPluginConfig(pluginName: string) {
    const pluginConfigPath = XXMMCore.getPluginConfigPath();
    if (!(await ipc.fs.exists(asFilePath(pluginConfigPath)))) {
      await ipc.fs.writeFile(
        asFilePath(pluginConfigPath),
        JSON.stringify({}, null, 4),
      );
      console.log(
        `Plugin config file not exist, create: ${pluginConfigPath}`,
      );
    }
    const raw = await ipc.fs.readFile(asFilePath(pluginConfigPath));
    const pluginConfig = JSON.parse(raw);
    return pluginConfig[pluginName] ?? {};
  }

  public static async savePluginConfig(
    pluginName: string,
    pluginDataToSave: unknown,
  ) {
    const pluginConfigPath = XXMMCore.getPluginConfigPath();
    if (!(await ipc.fs.exists(asFilePath(pluginConfigPath)))) {
      await ipc.fs.writeFile(
        asFilePath(pluginConfigPath),
        JSON.stringify({}, null, 4),
      );
      console.log(
        `Plugin config file not exist, create: ${pluginConfigPath}`,
      );
    }
    const raw = await ipc.fs.readFile(asFilePath(pluginConfigPath));
    const pluginConfig = JSON.parse(raw);
    pluginConfig[pluginName] = pluginDataToSave;
    await ipc.fs.writeFile(
      asFilePath(pluginConfigPath),
      JSON.stringify(pluginConfig, null, 4),
    );
    console.log(`Plugin config file saved: ${pluginConfigPath}`);
  }

  public static async getDisabledPlugins() {
    const disabledPluginsPath = XXMMCore.getDisabledPluginsPath();
    if (!(await ipc.fs.exists(asFilePath(disabledPluginsPath)))) {
      await ipc.fs.writeFile(
        asFilePath(disabledPluginsPath),
        JSON.stringify([], null, 4),
      );
      console.log(
        `Disabled plugins file not exist, create: ${disabledPluginsPath}`,
      );
      return [];
    }
    const raw = await ipc.fs.readFile(asFilePath(disabledPluginsPath));
    return JSON.parse(raw);
  }

  public static async saveDisabledPlugins(disabledPlugins: string[]) {
    await ipc.fs.writeFile(
      asFilePath(XXMMCore.getDisabledPluginsPath()),
      JSON.stringify(disabledPlugins, null, 4),
    );
  }

  static async init() {
    dataPath = await ipcRenderer.invoke("get-user-data-path");

    const args = await ipcRenderer.invoke("get-args");
    if (args.ifCustomConfig) {
      XXMMCore.ifCustomConfig = true;
      XXMMCore.customConfigFolder = args.customConfigFolder;
    }

    const configFilePath = XXMMCore.getConfigFilePath();
    if (await ipc.fs.exists(asFilePath(configFilePath))) {
      const raw = await ipc.fs.readFile(asFilePath(configFilePath));
      const config = JSON.parse(raw);
      XXMMCore.modSourceFolder = config.modSourceFolder;
      XXMMCore.modTargetFolder = config.modTargetFolder;
      XXMMCore.modArchiveFolder = config.modArchiveFolder;
    }
  }
}

XXMMCore.init();
export default XXMMCore;
