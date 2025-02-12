//-===================== 插件 =====================
import { ipcRenderer, IpcRenderer } from "electron";
import { EventType, EventSystem } from "./EventSystem";
import { TranslatedText } from "./Language";
import { SnackType, t_snack } from "./SnackHelper";
const pathOsName = 'path'
const path = require(pathOsName);
const fs = require('fs');

class IPlugin {
    public name: string;
    public constructor() {
        this.name = this.constructor.name;
    }
    public init = () => { };
}


class IPluginLoader {
    public static plugins: IPlugin[] = [];
    public static disabledPluginNames: string[] = [];
    public static pluginConfig: { [key: string]: any } = {};


    //-============= 自身初始化 =============-//
    public static clearAllPlugins() {
        IPluginLoader.plugins = [];
        IPluginLoader.disabledPluginNames = [];
        IPluginLoader.pluginConfig = {};
    }











    //-============= 方法 =============-//

    static disablePlugin(pluginName: string) {
        IPluginLoader.disabledPluginNames.push(pluginName);
        EventSystem.trigger(EventType.pluginDisabled, pluginName);
        IPluginLoader.saveDisabledPlugins();
    }

    static enablePlugin(pluginName: string) {
        let index = IPluginLoader.disabledPluginNames.indexOf(pluginName);
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
        ipcRenderer.invoke('save-disabled-plugins', IPluginLoader.disabledPluginNames);
    }

    static async loadDisabledPlugins() {
        IPluginLoader.disabledPluginNames = await ipcRenderer.invoke('load-disabled-plugins');
        // debug
        console.log('disabledPluginNames:', IPluginLoader.disabledPluginNames);
    }


    /** @function
     * @desc 注册一个插件
     * @param {IPlugin} plugin - 插件
     * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
     * 这里使用 enviroment 是为了 避免循环引用
     * @returns {boolean}
     */
    static registerPlugin(plugin: IPlugin, enviroment: any): boolean {
        IPluginLoader.plugins.push(plugin);

        if (IPluginLoader.disabledPluginNames.includes(plugin.constructor.name)) {
            // debug
            const tt = new TranslatedText(`⛔plugin ${plugin.name} disabled`, `⛔插件 ${plugin.name} 已禁用`);
            console.log(tt.get());
            t_snack(tt, SnackType.info);
            return false;
        }

        // 检测是否有本地配置
        if (IPluginLoader.pluginConfig[plugin.constructor.name]) {
            // debug
            const tt = new TranslatedText(`🔧plugin ${plugin.name} loaded with local data`, `🔧插件 ${plugin.name} 使用本地数据启动`);
            console.log(tt.get(), IPluginLoader.pluginConfig[plugin.constructor.name]);
        }

        if (plugin.init !== undefined) {
            if (!IPluginLoader.initializePlugin(plugin, enviroment)) {
                return false;
            }
            // debug
            const tt = new TranslatedText(`🚀plugin ${plugin.name} initialized`, `🚀插件 ${plugin.name} 初始化完成`);
            console.log(tt.get());
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
            plugin.init.call(enviroment);
        } catch (error) {
            const tt = new TranslatedText(`❌plugin ${plugin.name} initialization failed: ${error.message}`, `❌插件 ${plugin.name} 初始化失败: ${error.message}`);
            console.error(tt.get(), error);
            t_snack(tt, SnackType.error);
            return false;
        }
        return true;
    }

    /** @function
     * @desc 加载所有插件
     * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
     * 这里使用 enviroment 是为了 避免循环引用
     */
    static async loadPlugins(enviroment: any) {
        // 插件为 一个 js 文件，通过 require 引入
        // 然后调用 init 方法，将 iManager 传递给插件

        // 先加载内置的插件
        const builtInPluginPath = path.resolve('./plugins');
        // 错误处理
        if (!fs.existsSync(builtInPluginPath)) {
            // snack('插件文件夹不存在 ' + builtInPluginPath);
            const tt = new TranslatedText(`❌plugin folder not found: ${builtInPluginPath}`, `❌插件文件夹不存在: ${builtInPluginPath}`);
            console.error(tt.get());
            t_snack(tt, SnackType.error);
            return;
        }
        const builtInPlugins = fs.readdirSync(builtInPluginPath);
        builtInPlugins.forEach((pluginName) => {
            if (pluginName.endsWith('.js')) {
                try {
                    const plugin = require(path.join(builtInPluginPath, pluginName));
                    this.registerPlugin(plugin, enviroment);
                }
                catch (e) {
                    // 在 本应该 应该有 插件的位置 创建一个 lookAtMe 文件，以便我定位问题
                    fs.writeFileSync(`./plugins/lookAtMe`, 'lookAtMe');
                    const tt = new TranslatedText(`❌built-in plugin ${pluginName} load failed`, `❌内置插件 ${pluginName} 加载失败`);
                    console.error(tt.get());
                    t_snack(tt, SnackType.error);
                }
            }
        });

        // 从 plugins 文件夹中加载插件，其位于 ,userData/plugins 文件夹中
        // 这里应该被视为全局插件 作用于所有的 游戏配置
        const userDataPath = await ipcRenderer.invoke('get-user-data-path');
        const pluginPath = path.join(userDataPath, 'plugins');
        if (!fs.existsSync(pluginPath)) {
            fs.mkdirSync(pluginPath);
        }
        const files = fs.readdirSync(pluginPath);
        files.forEach((file) => {
            if (file.endsWith('.js')) {
                try {
                    const plugin = require(path.join(pluginPath, file));
                    this.registerPlugin(plugin, enviroment);
                }
                catch (e) {
                    const tt = new TranslatedText(`❌plugin ${file} load failed`, `❌插件 ${file} 加载失败`);
                    console.error(tt.get());
                    t_snack(tt, SnackType.error);
                    // 在 本应该 应该有 插件的位置 创建一个 lookAtMe 文件，以便我定位问题
                    fs.writeFileSync(`./plugins/lookAtMe`, 'lookAtMe');
                }
            }
        });

        //debug 打印所有插件
        console.log(this.plugins);
    }
}





export { IPlugin, IPluginLoader };