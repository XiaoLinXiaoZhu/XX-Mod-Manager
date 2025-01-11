// pluginConfig 是 data 的 数组

// data 为一个对象，包含了插件的可配置数据，比如说是否启用，是否显示等等
// 它会被 解析 之后 在 设置页面 中显示，并且为 插件提供数据
// 当它发生变化时，会触发 插件的 onChange 方法

// data 的格式为
// {
//     name: 'ifAblePlugin',
//     data: true,
//     type: 'boolean',
//     displayName: 'If Able Plugin',
//     description: 'If true, the plugin will be enabled',
//     t_displayName:{
//         zh_cn:'是否启用插件',
//         en:'Enable Plugin'
//     },
//     t_description:{
//         zh_cn:'如果为真，插件将被启用',
//         en:'If true, the plugin will be enabled'
//     },
//     onChange: (value) => {
//         console.log('ifAblePlugin changed:', value);
//     }
// }



//- 这是一个 用于 在 应用mod之后自动在游戏中应用mod 的插件

// //-------------------刷新游戏-------------------
const pluginName = 'refreshAfterApply';
// 上面是 原来集成到主程序的代码，现在我们将其转移到插件中
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const refreshInGame = async (iManager) => {
    // Refresh in ZZZ success flag
    // 0: Failed
    // 1: Success
    // 2: Cannot find the process
    // 3: Cannot find the zenless zone zero window
    // 4: Cannot find the mod manager window
    // Only availabe in windows
    const HMC = iManager.HMC;
    const isWindows = process.platform === 'win32';
    if (!isWindows) return 0;
    const processName = iManager.getPluginData(pluginName, 'processName');
    const VisualKey = iManager.getPluginData(pluginName, 'VisualKey');
    if (!processName || !VisualKey) return 0;
    if (isWindows) {
        // Process name. Should be set as a config value for 
        // this to work while managing other games.
        const process = HMC.getProcessNameList(processName);
        if (process.length <= 0) return 2;
        // Get the Zenless Zone Zero Hwnd handle
        const window = HMC.getProcessWindow(process[0].pid);
        if (!window) return 3;
        // Get the Mod manager Hwnd handle
        const manager = HMC.getForegroundWindow();
        if (!manager) return 4;
        // ZZZ wont accept any keys if the manager is not run as admin.
        // ZZZ wont accept virtual keys, only accepts direct input keys.
        // Here is the trick to get ZZZ to register the VK input without admin:
        // 1. Press the F10 Key down on the manager
        HMC.sendKeyboard(VisualKey, true);
        // 2. Set focus on ZZZ window
        window.setFocus(true);
        // 3. Wait a reasonable amount of time for the key to register
        await sleep(75);
        // 4. Set focus on the Manager window
        manager.setFocus(true);
        // 5. Wait again for the window
        await sleep(50);
        // 6. Release the F10 Key
        HMC.sendKeyboard(VisualKey, false);
        // 7. Set focus on ZZZ window again
        window.setFocus(true);
        return 1;
    }
    return 0;
}


module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '游戏内刷新',
        en: 'Refresh After Apply'
    },
    init(iManager) {
        iManager.on('modsApplied', async () => {
            //debug
            console.log('modsApplied');
            if (iManager.getPluginData(pluginName, 'ifRefreshAfterApply')) {
                const result = await refreshInGame(iManager);
                // Refresh in ZZZ success flag
                // 0: Failed
                // 1: Success
                // 2: Cannot find the process
                // 3: Cannot find the zenless zone zero window
                // 4: Cannot find the mod manager window
                // Only availabe in windows
                const snackMessage = iManager.config.language === 'zh_cn' ?
                    ['刷新失败', '刷新成功', '找不到进程', '找不到窗口', '找不到mod管理器'][result] :
                    ['Refresh Failed', 'Refresh Success', 'Cannot find the process', 'Cannot find the window', 'Cannot find the mod manager'][result];
                iManager.snack(ifRefreshAfterApply.t_displayName[iManager.config.language] + " : " +
                    snackMessage, result === 1 ? "success" : "error");
            }
        });


        let pluginData = [];
        //-是否启用
        let ifRefreshAfterApply = {
            name: 'ifRefreshAfterApply',
            data: false,
            type: 'boolean',
            displayName: 'Refresh After Apply',
            description: 'If true, the game will be refreshed after applying the mod',
            t_displayName: {
                zh_cn: '应用后刷新',
                en: 'Refresh After Apply'
            },
            t_description: {
                zh_cn: '如果为真，应用mod后游戏将被刷新',
                en: 'If true, the game will be refreshed after applying the mod'
            },
            onChange: (value) => {
                console.log('ifRefreshAfterApply changed:', value);
                ifRefreshAfterApply.data = value;
            }
        };
        pluginData.push(ifRefreshAfterApply);

        //- 游戏进程名
        let processName = {
            name: 'processName',
            data: 'ZenlessZoneZero.exe',
            type: 'string',
            displayName: 'Process Name',
            description: 'The process name of the game',
            t_displayName: {
                zh_cn: '进程名',
                en: 'Process Name'
            },
            t_description: {
                zh_cn: '游戏的进程名',
                en: 'The process name of the game'
            },
            onChange: (value) => {
                console.log('processName changed:', value);
                processName.data = value;
            }
        };
        pluginData.push(processName);

        //- F10键值
        let VisualKey = {
            name: 'VisualKey',
            data: 0x79,
            type: 'number',
            displayName: 'VisualKey',
            description: 'The virtual key code for F10',
            t_displayName: {
                zh_cn: '虚拟键值',
                en: 'VisualKey'
            },
            t_description: {
                zh_cn: '刷新的虚拟键值(3dmiggoto中默认为F10,也就是121)',
                en: 'The virtual key code for refresh(3dmiggoto default is F10, which is 121)'
            },
            onChange: (value) => {
                console.log('VisualKey changed:', value);
                VisualKey.data = value;
            }
        };
        pluginData.push(VisualKey);

        iManager.registerPluginConfig(pluginName, pluginData);
    }

}
