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
const fs = require('fs');
const path = require('path');

const pluginName = 'recognizeModInfoPlugin';


const getModKeySwap = async (iManager, mod) => {
    const fs = require('fs');
    const path = require('path');
    // const modPath = path.join(iManager.config.modSourcePath, mod.name);
    const modPath = await mod.getModPath();

    //debug
    console.log('modPath:', modPath);

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
        // 增加双语支持
        const tt = new iManager.TranslatedText(
            en = 'No ini file found in mod【' + mod.name + '】',
            zh_cn = '在mod【' + mod.name + '】中没有找到ini文件'
        );
        iManager.t_snack(tt, 'error');
        console.log(tt.get(), tt);

        return;
    }

    const succsessTT = new iManager.TranslatedText(
        en = 'Found ini files in mod【' + mod.name + '】',
        zh_cn = '在mod【' + mod.name + '】中找到了ini文件'
    );
    iManager.t_snack(succsessTT, 'info');
    console.log(succsessTT.get());

    // 2. 读取所有 ini 文件
    let keyswap = [];
    iniFilePaths.forEach(iniFilePath => {
        keyswap = keyswap.concat(getSwapkeyFromIni(iniFilePath));
    });
    keyswap = [...new Set(keyswap)]; // 去重

    // 3. 添加到 mod 的 keyswap 中
    // keyswap 的格式 和 hotkeys 一样
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

    const t_description = {
        swap: '切换',
        Swap: '切换',
        glow: '发光',
        Help: '帮助',
    }

    //! 测试用
    // 将所有mod的hotkeys清空
    // mod.hotkeys = [];

    keyswap.forEach(key => {
        let flag = false;

        let removeHotkey = [];

        mod.hotkeys.forEach(hotkey => {
            if (hotkey.key === key.key) {
                flag = true;
            }
            if (hotkey.description == "未知" || hotkey.description == "Unknown") {
                flag = false;
                // 将未知项删除
                removeHotkey.push(hotkey);
            }
        });

        // 删除未知项
        removeHotkey.forEach(r => {
            mod.hotkeys = mod.hotkeys.filter(h => h !== r);
        });

        // 如果是中文的话，尝试将 description 转化为中文
        if (iManager.config.language === 'zh_cn') {
            key.description = t_description[key.description] || key.description;
        }
        if (!flag) {
            mod.hotkeys.push({
                key: key.key,
                description: key.description
            });
        }
    });

    //debug
    console.log('adjusted mod data:', mod);
    return mod;
};


const getSwapkeyFromIni = (iniFilePath) => {
    const fs = require('fs');
    const lines = fs.readFileSync(iniFilePath, 'utf-8').split('\n');
    let keyswap = [];
    let flag = false;
    let keyType = "";
    lines.forEach(line => {
        //debug
        // console.log(line);

        // 忽略以 ; 开头的行
        if (line.startsWith(';')) {
            return;
        }

        if (line.startsWith('[Key') || line.startsWith('[key')) {
            flag = true;
            keyType = line.slice(4, -2);

            //如果keyType开头为Swap，则忽略后面的数字
            if (keyType.startsWith('Swap')) {
                keyType = 'Swap';
            }

            //debug
            console.log(`find [Key] section, keyType: ${keyType}`);
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
        // 忽略大小写，去掉空格
        line = line.toLowerCase().trim();

        // 匹配 key = xxx 或 key=xxx 或 back = xxx
        // 这里的 line 根据 \n 分割后已经去掉了 \n
        if (line.startsWith('key  =') && line.length > 6) {
            key = line.slice(6).trim();
        }
        if (line.startsWith('key =') && line.length > 5) {
            key = line.slice(5).trim();
        }
        if (line.startsWith('key=') && line.length > 4) {
            key = line.slice(4).trim();
        }
        if (line.startsWith('back =') && line.length > 6) {
            key = line.slice(6).trim();
        }

        if (key === '') {
            return;
        }

        // 替换字典，将代码转化为可读性更好的字符，使用正则表达式
        const keyDict = {
            'vk_up': '↑',
            'vk_down': '↓',
            'vk_left': '←',
            'vk_right': '→',
            'vk_return': '↵',
            'vk_escape': 'esc',
            'vk_backspace': '⌫',
            'vk_tab': '⇥',
            'vk_space': '⎵',
            'vk_f([0-9]+)': 'f$1',
            'vk_([a-z])': '$1',
            'vk_numpad([0-9])': 'num$1',
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→',
            'return': '↵',
            'escape': 'esc',
            'backspace': '⌫',
            'tab': '⇥',
            'space': '⎵',
            'f([0-9]+)': 'f$1',
            '([a-z])': '$1',
            'numpad([0-9])': 'num$1',
            'no_modifiers': '',
            'no_decimal': '⌨',
            'no_alt': '',
            'no_shift': '',
            'no_ctrl': '',
        }

        let add = key;
        for (let key in keyDict) {
            add = add.replace(new RegExp(key, 'g'), keyDict[key]);
        }


        if (!keyswap.includes(add)) {
            keyswap.push({
                key: add,
                description: keyType
            });
        }

        //debug
        console.log(`add key: ${add}, description: ${keyType}`);

    });

    //debug
    console.log(`for ini file ${iniFilePath}, keyswap:`,keyswap);
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
            if (mod == undefined) {
                return;
            }
            console.log('addMod:', mod);
            if (iManager.getPluginData(pluginName, "ifAddKeySwap")) {
                const newMod = await getModKeySwap(iManager, mod);
                if (newMod === undefined) {
                    return;
                }
                if (newMod.hotkeys.length === 0) {
                    return;
                }
                // iManager.saveModInfo(newMod);
                mod.saveModInfo();

                if(iManager.temp.currentMod.name === mod.name){
                    // 如果当前mod是新添加的mod，则切换到新添加的mod
                    // debug
                    console.log('currentMod:', iManager.temp.currentMod, 'newMod:', newMod);
                    iManager.setCurrentMod(newMod);
                }
            }
        });

        iManager.on('pluginLoaded', async () => {
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
                    // 将 二次确认 开关关闭
                    iManager.setPluginData(pluginName, "ifRefreshAllMod", false);

                    iManager.showDialog('loading-dialog');
                    const snackMessage = {
                        en: "refresh all mod",
                        zh_cn: "刷新所有mod"
                    }
                    iManager.t_snack(snackMessage);
                    iManager.data.modList.forEach(async (mod) => {
                        const newMod = await getModKeySwap(iManager, mod);
                        // 不使用saveModInfo，因为saveModInfo会将所有的mod信息都保存一遍，这样会导致卡顿以及其他事件被触发
                        // 直接写入之后，让用户手动刷新即可
                        const modFilePath = path.join(iManager.config.modSourcePath, mod.name, 'mod.json');
                        fs.writeFileSync(modFilePath, JSON.stringify(mod, null, 4));

                    });
                    iManager.dismissDialog('loading-dialog');

                    iManager.showDialog('dialog-need-refresh');
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
        pluginData.push(divider);

        // - 开关，清空所有mod的hotkeys 的二次确认开关，用于二次确认
        let ifClearAllModHotkeys = {
            name: 'ifClearAllModHotkeys',
            data: false,
            type: 'boolean',
            displayName: 'If Clear All Mod Hotkeys',
            description: 'If true, clear all mod hotkeys',
            t_displayName: {
                zh_cn: '清空所有mod的热键 - 二次确认',
                en: 'Clear All Mod Hotkeys - Confirm'
            },
            t_description: {
                zh_cn: '你需要先将此开关打开才能清空所有mod的热键',
                en: 'You need to set this option to true first to clear all mod hotkeys'
            },
            onChange: (value) => {
                console.log('ifClearAllModHotkeys changed:', value);
                ifClearAllModHotkeys.data = value;

                const snackMessage = {
                    zh_cn: '清空全部的mod的热键可能会需要一些时间，这取决于你的mod数量，请坐和放宽，不要关闭程序',
                    en: 'Clearing all mod hotkeys may take some time, depending on the number of mods you have, please be patient and do not close the program'
                }
                iManager.t_snack(snackMessage);

                //需要刷新，将value返回
                return value;
            }
        }
        pluginData.push(ifClearAllModHotkeys);

        //- 按钮，清空所有mod的hotkeys
        let clearAllModHotkeys = {
            name: 'clearAllModHotkeys',
            data: '',
            type: 'iconbutton',
            displayName: 'Clear All Mod Hotkeys',
            description: 'Clear all mod hotkeys',
            t_displayName: {
                zh_cn: '清空所有mod的热键',
                en: 'Clear All Mod Hotkeys'
            },
            t_description: {
                zh_cn: '清空所有mod的热键',
                en: 'Clear all mod hotkeys'
            },
            buttonName: 'clear',
            t_buttonName: {
                zh_cn: '清空',
                en: 'Clear'
            },
            onChange: () => {
                console.log('clearAllModHotkeys clicked');

                if (iManager.getPluginData(pluginName, "ifClearAllModHotkeys")) {
                    // 将 二次确认 开关关闭
                    iManager.setPluginData(pluginName, "ifClearAllModHotkeys", false);

                    iManager.showDialog('loading-dialog');
                    const snackMessage = {
                        en: "clear all mod hotkeys",
                        zh_cn: "清空所有mod的热键"
                    }
                    iManager.t_snack(snackMessage);
                    iManager.data.modList.forEach(async (mod) => {
                        mod.hotkeys = [];
                        const modFilePath = path.join(iManager.config.modSourcePath, mod.name, 'mod.json');
                        fs.writeFileSync(modFilePath, JSON.stringify(mod, null, 4));
                    });
                    iManager.dismissDialog('loading-dialog');

                    iManager.showDialog('dialog-need-refresh');
                }
                else {
                    const snackMessage = {
                        en: "You need to set 'If Clear All Mod Hotkeys' to true first",
                        zh_cn: "你需要先将 '清空所有mod的热键 - 二次确认' 保持为开启状态"
                    }
                    iManager.t_snack(snackMessage, 'error');
                }
            }
        }
        pluginData.push(clearAllModHotkeys);




        iManager.registerPluginConfig(pluginName, pluginData);
    }
}