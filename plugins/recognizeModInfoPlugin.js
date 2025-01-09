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

//- 这是一个用于在添加mod时获取并解析切换键的mod
//- 原则：只添加新的，不删除已有的
//功能：
// 1. 开关，是否在导入mod的时候添加keyswap信息
// 2. 是否启用 刷新所有mod的开关，用于二次确认
// 3. 按钮，刷新所有mod的keyswap

const pluginName = 'recognizeModInfoPlugin';


const getModKeySwap = async (iManager, mod) => {
    const fs = require('fs');
    const path = require('path');
    const modPath = path.join(iManager.config.modSourcePath, mod.name);
    // 1. 寻找文件夹下的所有 ini 文件，忽略 desktop.ini 和以 DISABLED 开头的 ini 文件
    let iniFilePaths = [];
    const findIniInFolder = (folderPath) => {
        const files = fs.readdirSync(folderPath);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                findIniInFolder(filePath);
            } else {
                if (file.endsWith('.ini') && file !== 'desktop.ini' && !file.startsWith('DISABLED')) {
                    iniFilePaths.push(filePath);
                }
            }
        }
    }
    findIniInFolder(modPath);
    if (iniFilePaths.length === 0) {
        //debug
        console.log('In mod 【' + mod.name + '】, no ini file found');
        iManager.snack('In mod 【' + mod.name + '】, no ini file found', 'error');
        return;
    }

    //debug
    console.log('In mod 【' + mod.name + '】, ini files found:', iniFilePaths);
    iManager.snack('In mod 【' + mod.name + '】, ini files found:' + iniFilePaths.join(', '), 'info');

    // 2. 读取所有 ini 文件
    let keyswap = [];
    iniFilePaths.forEach(iniFilePath => {
        keyswap = keyswap.concat(getSwapkeyFromIni(iniFilePath));
    });
    keyswap = [...new Set(keyswap)]; // 去重

    // 3. 添加到 mod 的 keyswap 中
    // keyswap 的格式 为 ['a','b','c']
    // mod 的 hotkeys 格式为
    // hotkeys:[
    //     {
    //         key: 'a',
    //         description: 'xxx'
    //     },
    //     {
    //         key: 'b',
    //         description: 'xxx'
    //     },
    // }
    // 1. 如果 mod 的 hotkeys 为空，直接添加
    // 2. 如果 mod 的 hotkeys 不为空，只添加新的，不删除已有的

    keyswap.forEach(key => {
        let flag = false;
        mod.hotkeys.forEach(hotkey => {
            if (hotkey.key === key) {
                flag = true;
            }
        });
        let keyDescription = 'unknown';
        if (iManager.config.language === 'zh_cn') {
            keyDescription = '未知';
        }

        if (!flag) {
            mod.hotkeys.push({
                key: key,
                description: keyDescription
            });
        }
    });

    iManager.saveModInfo(mod);
};


const getSwapkeyFromIni = (iniFilePath) => {
    const fs = require('fs');
    const lines = fs.readFileSync(iniFilePath, 'utf-8').split('\n');
    let keyswap = [];
    let flag = false;
    lines.forEach(line => {
        //debug
        console.log(line);
        if (line.startsWith('[KeySwap') || line.startsWith('[[KeyGlow')) {
            flag = true;
            //debug
            console.log(`find [KeySwap]`);
            return;
        }
        if (!flag) {
            return;
        }
        if (line.startsWith('[')) {
            flag = false;
            return;
        }
        let key = '';
        //匹配 key = xxx 或 key=xxx 或 back = xxx
        if (line.startsWith('key =') && line.length > 6) {
            key = line.slice(6).trim();
        }
        if (line.startsWith('key=') && line.length > 5) {
            key = line.slice(5).trim();
        }
        if (line.startsWith('back = ') && line.length > 7) {
            key = line.slice(7).trim();
        }

        if (key === '') {
            return;
        }

        let add = '';
        // 因为这里的key是代码，将其转化为单个字符可读性会更好
        switch (key) {
            case 'VK_UP': add = '↑'; break;
            case 'VK_DOWN': add = '↓'; break;
            case 'VK_LEFT': add = '←'; break;
            case 'VK_RIGHT': add = '→'; break;
            case 'VK_RETURN': add = '↵'; break;
            case 'VK_ESCAPE': add = 'ESC'; break;
            case 'no_modifiers [': add = '['; break;
            default: add = key; break;
        }

        if (!keyswap.includes(add)) {
            keyswap.push(add);
        }

        //debug
        console.log(`keyswap: ${keyswap}`);

    });

    //debug
    console.log(`for ini file ${iniFilePath}, keyswap: ${keyswap}`);
    return keyswap;
}

module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '识别mod信息',
        en: 'Recognize Mod Info'
    },
    init(iManager) {

        iManager.on('addMod', async (mod) => {
            //debug
            console.log('addMod:', mod);
            if (iManager.getPluginData(pluginName, "ifAddKeySwap")) {
                getModKeySwap(iManager, mod);
            }
        });

        iManager.on('initDone', async () => {
            if (iManager.getPluginData(pluginName, "ifAddKeySwap")) {
                iManager.snack("添加mod时将会尝试获取切换键", "info");
            }
        });



        let pluginData = [];

        //- markdown 简介
        let pluginDescription = {
            name: 'pluginDescription',
            data: '',
            type: 'markdown',
            displayName: 'Plugin Description',
            description: 'Plugin Description',
            t_displayName: {
                zh_cn: '插件简介',
                en: 'Plugin Description'
            },
            t_description: {
                zh_cn: `这是一个用于在添加mod时获取并解析切换键的mod,`,
                en: 'This is a plugin used to get and parse the keyswap mod when adding mod, it is only used to recognize the key, and cannot know the specific function of the key'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        }
        // pluginData.push(pluginDescription);

        //- 开关，是否在导入mod的时候添加keyswap信息
        let ifAddKeySwap = {
            name: 'ifAddKeySwap',
            data: true,
            type: 'boolean',
            displayName: 'If Add Key Swap',
            description: 'If true, add key swap information when importing mod',
            t_displayName: {
                zh_cn: '是否添加切换键',
                en: 'If Add Key Swap'
            },
            t_description: {
                zh_cn: '开启后，导入mod时添加切换键信息,它只用来识别按键，并不能知道按键的具体功能',
                en: 'If true, add key swap information when importing mod, it is only used to recognize the key, and cannot know the specific function of the key'
            },
            onChange: (value) => {
                console.log('ifAddKeySwap changed:', value);
                ifAddKeySwap.data = value;
            }
        }
        pluginData.push(ifAddKeySwap);

        let divider = {
            name: 'divider',
            data: '',
            type: 'markdown',
            displayName: 'Divider',
            description: '---',
            t_displayName: {
                zh_cn: '分割线',
                en: 'Divider'
            }
        }
        pluginData.push(divider);

        //- 是否启用 刷新所有mod的开关，用于二次确认
        let ifRefreshAllMod = {
            name: 'ifRefreshAllMod',
            data: false,
            type: 'boolean',
            displayName: 'If Refresh All Mod',
            description: 'If true, refresh all mod',
            t_displayName: {
                zh_cn: '刷新所有mod - 二次确认',
                en: 'Refresh All Mod - Confirm'
            },
            t_description: {
                zh_cn: '你需要先将此开关打开才能刷新所有mod',
                en: 'You need to set this option to true first to refresh all mod'
            },
            onChange: (value) => {
                console.log('ifRefreshAllMod changed:', value);
                ifRefreshAllMod.data = value;

                const snackMessage = {
                    zh_cn: '刷新全部的mod的切换键可能会需要一些时间，这取决于你的mod数量，请坐和放宽，不要关闭程序',
                    en: 'Refreshing all mod keyswap may take some time, depending on the number of mods you have, please be patient and do not close the program'
                }
                iManager.t_snack(snackMessage);
            }
        }
        pluginData.push(ifRefreshAllMod);

        //- 按钮，刷新所有mod的keyswap
        let refreshAllMod = {
            name: 'refreshAllMod',
            data: '',
            type: 'iconbutton',
            displayName: 'Refresh All Mod',
            description: 'Refresh all mod',
            t_displayName: {
                zh_cn: '刷新所有mod',
                en: 'Refresh All Mod'
            },
            t_description: {
                zh_cn: '刷新所有mod',
                en: 'Refresh all mod'
            },
            buttonName: 'refresh',
            t_buttonName: {
                zh_cn: '刷新',
                en: 'Refresh'
            },
            onChange: () => {
                console.log('refreshAllMod clicked');
                if (iManager.getPluginData(pluginName, "ifRefreshAllMod")) {
                    const snackMessage = {
                        en: "refresh all mod",
                        zh_cn: "刷新所有mod"
                    }
                    iManager.t_snack(snackMessage);
                    iManager.showDialog('loading-dialog');
                    iManager.data.modList.forEach(mod => {
                        getModKeySwap(iManager, mod);
                    });
                    iManager.dismissDialog('loading-dialog');
                }
                else {
                    const snackMessage = {
                        en: "You need to set 'If Refresh All Mod' to true first",
                        zh_cn: "你需要先将 '刷新所有mod - 二次确认' 保持为开启状态"
                    }
                    iManager.t_snack(snackMessage, 'error');
                }
            }
        }
        pluginData.push(refreshAllMod);


        iManager.registerPluginConfig(pluginName, pluginData);
    }
}