//-===================== 插件 =====================
const { ipcRenderer } = require("electron");

import XXMMCore from "../core/XXMMCore";
import { EventSystem, EventType } from "./EventSystem";
import { TranslatedText } from "./Language";
import { PathHelper } from "./PathHelper";
import { SnackType, t_snack } from "./SnackHelper";

const pathOsName = "path";
const path = require(pathOsName);
const fs = require("node:fs");

/** @enum
 * @desc 用于标记插件数据的类型
 */
enum IPluginDataTypes {
  markdown = "markdown",
  boolean = "boolean",
  path = "path",
  number = "number",
  button = "button",
  iconbutton = "iconbutton",
  select = "select",
}

interface IPluginOption {
  value: string;
  t_value: TranslatedText;
}

interface IPluginData {
  name: string;
  data: any;
  type: IPluginDataTypes;
  displayName: string;
  description?: string;
  onChange?: (value: any) => void;

  //-可选项：显示名称，带有翻译
  t_displayName?: TranslatedText;

  //-可选项：显示描述，带有翻译
  t_description?: TranslatedText;

  //-作为 button 类型的按钮
  buttonName?: string;
  t_buttonName?: TranslatedText;

  //-作为 iconbutton 类型的按钮
  icon?: string;

  //-作为 select 类型的选项
  options?: IPluginOption[];
}

interface IPlugin {
  name: string;
  t_displayName: TranslatedText;
  init: (enviroment) => void;
}

class IPluginLoader {
  public static plugins: { [key: string]: IPlugin } = {};
  public static disabledPluginNames: string[] = [];
  public static pluginConfig: { [key: string]: IPluginData[] } = {};
  public static enviroment: any;

  public static pluginLoadFolders: (() => string)[] = [
    () => path.resolve("./plugins"), // 内置插件
    () => {
      const userDataPath = ipcRenderer.sendSync("get-user-data-path-sync");
      return path.join(userDataPath, "plugins"); // 用户插件
    }, // 全局插件
  ];

  //-============= 自身初始化 =============-//
  public static clearAllPlugins() {
    IPluginLoader.plugins = {};
    IPluginLoader.disabledPluginNames = [];
    IPluginLoader.pluginConfig = {};
  }

  public static async Init(env: any) {
    IPluginLoader.clearAllPlugins(); // 清空所有插件
    IPluginLoader.enviroment = env;

    // 加载禁用的插件
    await IPluginLoader.LoadDisabledPlugins();
    // 加载所有插件
    await IPluginLoader.LoadPlugins(env);
    // debug
    console.log("IPluginLoader init finished");
  }

  static async LoadDisabledPlugins() {
    // IPluginLoader.disabledPluginNames = await ipcRenderer.invoke('get-disabled-plugins');
    IPluginLoader.disabledPluginNames = XXMMCore.getDisabledPlugins();
    // this.trigger('disabledPluginsLoaded', disabledPluginNames);
    // debug
    console.log("disabledPluginNames:", IPluginLoader.disabledPluginNames);
  }

  //-============= 方法 =============-//

  static disablePlugin(pluginName: string) {
    IPluginLoader.disabledPluginNames.push(pluginName);
    EventSystem.trigger(EventType.pluginDisabled, pluginName);
    IPluginLoader.saveDisabledPlugins();
  }

  static enablePlugin(pluginName: string) {
    const index = IPluginLoader.disabledPluginNames.indexOf(pluginName);
    if (index !== -1) {
      IPluginLoader.disabledPluginNames.splice(index, 1);
      EventSystem.trigger(EventType.pluginEnabled, pluginName);
      IPluginLoader.saveDisabledPlugins();
    }
  }

  static togglePlugin(pluginName: string) {
    if (IPluginLoader.disabledPluginNames.includes(pluginName)) {
      IPluginLoader.enablePlugin(pluginName);
    } else {
      IPluginLoader.disablePlugin(pluginName);
    }
  }

  static async saveDisabledPlugins() {
    // ipcRenderer.invoke('save-disabled-plugins', IPluginLoader.disabledPluginNames);
    XXMMCore.saveDisabledPlugins(IPluginLoader.disabledPluginNames);
  }

  //-============= 插件注册 =============-//

  /** @function
   * @desc 注册一个插件
   * @param {IPlugin} plugin - 插件
   * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
   * 这里使用 enviroment 是为了 避免循环引用
   * @returns {boolean}
   */
  static async RegisterPlugin(
    plugin: IPlugin,
    enviroment: any,
  ): Promise<boolean> {
    IPluginLoader.plugins[plugin.name] = plugin;

    if (IPluginLoader.disabledPluginNames.includes(plugin.name)) {
      // debug
      const tt = new TranslatedText(
        `⛔plugin ${plugin.name} disabled`,
        `⛔插件 ${plugin.name} 已禁用`,
      );
      console.log(tt.get());
      // t_snack(tt, SnackType.info);
      return false;
    }

    if (plugin.init !== undefined) {
      if (!IPluginLoader.initializePlugin(plugin, enviroment)) {
        return false;
      }
      // debug
      const tt = new TranslatedText(
        `🚀plugin ${plugin.name} initialized`,
        `🚀插件 ${plugin.name} 初始化完成`,
      );
      console.log(tt.get());
    }

    // 检测是否有本地配置
    const localPluginData = XXMMCore.getPluginConfig(plugin.name);
    if (localPluginData) {
      IPluginLoader.pluginConfig[plugin.name].forEach((data) => {
        if (localPluginData[data.name] !== undefined) {
          data.data = localPluginData[data.name];
        }
      });
      // debug
      const tt = new TranslatedText(
        `🔧plugin ${plugin.name} loaded with local data`,
        `🔧插件 ${plugin.name} 使用本地数据启动`,
      );
      console.log(tt.get(), IPluginLoader.pluginConfig[plugin.name]);
    }
    return true;
  }

  /** @function
   * @desc 初始化一个插件
   * @param {IPlugin} plugin - 插件
   * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
   * 这里使用 enviroment 是为了 避免循环引用
   * @returns {boolen}
   */
  static initializePlugin(plugin: IPlugin, enviroment: any): boolean {
    try {
      plugin.init(enviroment);
    } catch (error) {
      const tt = new TranslatedText(
        `❌plugin ${plugin.name} initialization failed: ${error.message}`,
        `❌插件 ${plugin.name} 初始化失败: ${error.message}`,
      );
      console.error(tt.get(), error);
      t_snack(tt, SnackType.error);
      return false;
    }
    return true;
  }

  static RegisterPluginConfig(pluginName: string, pluginConfig: IPluginData[]) {
    // 如果 pluginConfig 不存在，则创建一个新的数组，否则将 pluginConfig 添加到 pluginConfig 中
    if (IPluginLoader.pluginConfig[pluginName] === undefined) {
      IPluginLoader.pluginConfig[pluginName] = pluginConfig;
    } else {
      IPluginLoader.pluginConfig[pluginName] =
        IPluginLoader.pluginConfig[pluginName].concat(pluginConfig);
    }

    // debug
    const tt = new TranslatedText(
      `👻plugin ${pluginName} config registered`,
      `👻插件 ${pluginName} 配置已注册`,
    );
    console.log(tt.get(), IPluginLoader.pluginConfig[pluginName]);
  }

  /** @function
   * @desc 从指定的文件夹加载插件
   * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
   * @param {string} folder - 插件文件夹
   * @returns {Promise<void>}
   */
  static async LoadPluginsFromFolder(enviroment: any, folder: string) {
    if (
      !PathHelper.CheckDir(
        folder,
        false,
        true,
        new TranslatedText("plugin folder", "插件文件夹"),
      )
    ) {
      // 不存在就创建
      fs.mkdirSync(folder, { recursive: true });
      t_snack(
        new TranslatedText("create plugin folder", "创建插件文件夹"),
        SnackType.info,
      );
      return;
    }
    const files = fs.readdirSync(folder);
    files.forEach(async (file) => {
      if (file.endsWith(".js")) {
        try {
          const plugin: IPlugin = require(
            path.join(folder, file),
          ) as unknown as IPlugin;
          await IPluginLoader.RegisterPlugin(plugin, enviroment);
        } catch (_e) {
          // 在 本应该 应该有 插件的位置 创建一个 lookAtMe 文件，以便我定位问题
          fs.writeFileSync(`./plugins/lookAtMe`, "lookAtMe");
          const tt = new TranslatedText(
            `❌plugin ${file} load failed`,
            `❌插件 ${file} 加载失败`,
          );
          console.error(tt.get());
          t_snack(tt, SnackType.error);
        }
      }
    });
  }

  /** @function
   * @desc 加载所有插件
   * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
   * 这里使用 enviroment 是为了 避免循环引用
   */
  static async LoadPlugins(enviroment: any) {
    // 插件为 一个 js 文件，通过 require 引入
    // 然后调用 init 方法，将 iManager 传递给插件
    const startTime = Date.now();
    await Promise.all(
      IPluginLoader.pluginLoadFolders.map(async (folder) => {
        // debug
        console.log(`Load plugins from ${folder()}`);
        await IPluginLoader.LoadPluginsFromFolder(enviroment, folder());
      }),
    );

    const endTime = Date.now();
    const tt = new TranslatedText(
      `🚀plugin loaded in ${endTime - startTime}ms`,
      `🚀插件加载完成，耗时 ${endTime - startTime}ms`,
    );
    console.log(
      tt.get(),
      `${IPluginLoader.plugins.length} plugins loaded, ${IPluginLoader.disabledPluginNames.length} disabled`,
    );
    t_snack(tt, SnackType.info);
  }

  //-===================== 插件配置 =====================
  static transformPluginConfigToSave(pluginConfig: IPluginData[]) {
    // 只保留 data
    const pluginDataToSave = {};
    pluginConfig.forEach((data) => {
      pluginDataToSave[data.name] = data.data;
    });
    return pluginDataToSave;
  }

  /** @function
   * @desc 保存单个插件的配置
   * 保存的配置是 pluginData 里面的 data
   * data 是一个对象，包含了 插件的配置数据,以{{配置名：配置值}}的形式保存
   * @param {string} pluginName - 插件名称
   * @param {IPluginData[]} pluginData - 插件配置
   * @returns {Promise<void>}
   * 该方法是异步的，不会阻塞主线程
   */
  static async SavePluginConfig(pluginName: string, pluginData: IPluginData[]) {
    // pluginConfig 里面存储了 所有插件的配置 pluginData
    // 每个 pluginData 是一个 数组 ，包含了 插件的配置
    // 但是我们不需要保存 pluginData里面的所有数据，比如说显示名称，描述，onChange等，只需要保存 data
    // data 是一个对象，包含了 插件的配置数据

    const pluginDataToSave =
      IPluginLoader.transformPluginConfigToSave(pluginData);

    // debug
    const tt = new TranslatedText(
      `🔧plugin ${pluginName} config saved`,
      `🔧插件 ${pluginName} 配置已保存`,
    );
    console.log(tt.get(), pluginName, pluginDataToSave);
    // ipcRenderer.invoke('save-plugin-config', pluginName, pluginDataToSave);
    // 保存插件配置到文件
    XXMMCore.savePluginConfig(pluginName, pluginDataToSave);
  }

  /** @function
   * @desc 保存所有插件的配置
   * 保存的配置是 pluginData 里面的 data
   * data 是一个对象，包含了 插件的配置数据,以{{配置名：配置值}}的形式保存
   */
  static async SaveAllPluginConfig() {
    for (const pluginName in IPluginLoader.pluginConfig) {
      IPluginLoader.SavePluginConfig(
        pluginName,
        IPluginLoader.pluginConfig[pluginName],
      );
    }
  }

  /** @function
   * @desc 保存所有插件的配置，同步版本
   * 保存的配置是 pluginData 里面的 data
   * data 是一个对象，包含了 插件的配置数据,以{{配置名：配置值}}的形式保存
   * 该方法是同步的，会阻塞主线程
   * 一般用于程序退出时保存配置
   */
  static SaveAllPluginConfigSync() {
    //弹出窗口，询问是否保存配置
    // alert('SaveAllPluginConfigSync');
    for (const pluginName in IPluginLoader.pluginConfig) {
      const pluginData = IPluginLoader.pluginConfig[pluginName];
      const pluginDataToSave = {};
      pluginData.forEach((data) => {
        pluginDataToSave[data.name] = data.data;
      });
      console.log(
        "savePluginConfig:",
        pluginName,
        pluginDataToSave,
        typeof pluginDataToSave,
      );
      ipcRenderer.invoke("save-plugin-config", pluginName, pluginDataToSave);
    }
  }

  //-===================== 插件接口 =====================
  static GetPluginData(pluginName: string, dataName: string) {
    // 检查是否有本地配置
    if (IPluginLoader.pluginConfig[pluginName] === undefined) {
      return undefined;
    }
    const pluginData = IPluginLoader.pluginConfig[pluginName];
    const data = pluginData.find((data) => data.name === dataName);
    return data ? data.data : undefined;
  }

  static SetPluginData(pluginName: string, dataName: string, value: any) {
    const pluginData = IPluginLoader.pluginConfig[pluginName];
    const data = pluginData.find((data) => data.name === dataName);
    if (data?.onChange) {
      data.onChange(value);
    }
  }
}

export {
  type IPlugin,
  type IPluginData,
  IPluginDataTypes,
  IPluginLoader,
  type IPluginOption,
};
