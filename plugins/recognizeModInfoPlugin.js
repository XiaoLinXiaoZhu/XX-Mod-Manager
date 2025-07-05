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

// Update key mapping dictionary to match Python implementation
const key_mapping = {
    // Arrow keys (no duplicates)
    "VK_UP": "↑",
    "VK_DOWN": "↓",
    "VK_LEFT": "←",
    "VK_RIGHT": "→",
    "UP": "↑",
    "DOWN": "↓",
    "LEFT": "←",
    "RIGHT": "→",
    
    // Numpad keys
    "VK_NUMPAD0": "NUM 0",
    "VK_NUMPAD1": "NUM 1",
    "VK_NUMPAD2": "NUM 2",
    "VK_NUMPAD3": "NUM 3",
    "VK_NUMPAD4": "NUM 4",
    "VK_NUMPAD5": "NUM 5",
    "VK_NUMPAD6": "NUM 6",
    "VK_NUMPAD7": "NUM 7",
    "VK_NUMPAD8": "NUM 8",
    "VK_NUMPAD9": "NUM 9",
    "NUMPAD0": "NUM 0",
    "NUMPAD1": "NUM 1",
    "NUMPAD2": "NUM 2",
    "NUMPAD3": "NUM 3",
    "NUMPAD4": "NUM 4",
    "NUMPAD5": "NUM 5",
    "NUMPAD6": "NUM 6",
    "NUMPAD7": "NUM 7",
    "NUMPAD8": "NUM 8",
    "NUMPAD9": "NUM 9",
    "VK_MULTIPLY": "NUM *",
    "VK_ADD": "NUM +",
    "VK_SUBTRACT": "NUM -",
    "VK_DECIMAL": "NUM .",
    "VK_DIVIDE": "NUM /",
    
    // Mouse buttons
    "VK_LBUTTON": "LMB",
    "VK_RBUTTON": "RMB",
    "VK_MBUTTON": "MMB",
    "VK_XBUTTON1": "X1",
    "VK_XBUTTON2": "X2",
    
    // Modifier keys
    "VK_ALT": "ALT",
    "VK_CTRL": "CTRL",
    "CONTROL": "CTRL",
    "VK_CONTROL": "CTRL",
    "VK_LCONTROL": "L-CTRL",
    "VK_RCONTROL": "R-CTRL",
    "LCTRL": "L-CTRL",
    "RCTRL": "R-CTRL",
    "VK_SHIFT": "SHIFT",
    "VK_LSHIFT": "L-SHIFT",
    "VK_RSHIFT": "R-SHIFT",
    "LSHIFT": "L-SHIFT",
    "RSHIFT": "R-SHIFT",
    "VK_MENU": "ALT",
    "VK_LMENU": "L-ALT",
    "VK_RMENU": "R-ALT",
    "LALT": "L-ALT",
    "RALT": "R-ALT",
    
    // Special keys
    "VK_OEM_MINUS": "-",
    "VK_OEM_PLUS": "+",
    "VK_BACKSPACE": "BACKSPACE",
    "DELETE": "DEL",
    "VK_DELETE": "DEL",
    "VK_ESCAPE": "ESC",
    "VK_RETURN": "ENTER",
    "VK_TAB": "TAB",
    "VK_SPACE": "SPACE",
    
    // Special characters
    "VK_OEM_1": ";",
    "VK_OEM_2": "/",
    "VK_OEM_3": "`",
    "VK_OEM_4": "[",
    "VK_OEM_5": "\\",
    "VK_OEM_6": "]",
    "VK_OEM_7": "'",
    "VK_OEM_8": "§",
    "VK_OEM_COMMA": ",",
    "VK_OEM_PERIOD": ".",
    
    // Xbox controller buttons
    "XB_A": "XB A",
    "XB_B": "XB B",
    "XB_X": "XB X",
    "XB_Y": "XB Y",
    "XB_LEFT_SHOULDER": "XB LB",
    "XB_RIGHT_SHOULDER": "XB RB",
    "XB_LEFT_TRIGGER": "XB LT",
    "XB_RIGHT_TRIGGER": "XB RT",
    "XB_LEFT_THUMB": "XB LS",
    "XB_RIGHT_THUMB": "XB RS",
    "XB_START": "XB Start",
    "XB_BACK": "XB Back",
    "XB_DPAD_UP": "XB ↑",
    "XB_DPAD_DOWN": "XB ↓",
    "XB_DPAD_LEFT": "XB ←",
    "XB_DPAD_RIGHT": "XB →",
    
    // PlayStation controller buttons
    "PS_SQUARE": "□",
    "PS_CROSS": "×",
    "PS_CIRCLE": "○",
    "PS_TRIANGLE": "△",
    "PS_L1": "L1",
    "PS_R1": "R1",
    "PS_L2": "L2",
    "PS_R2": "R2",
    "PS_L3": "L3",
    "PS_R3": "R3",
    "PS_SHARE": "Share",
    "PS_OPTIONS": "Options",
    "PS_TOUCHPAD": "Touchpad",
    "PS_DPAD_UP": "PS ↑",
    "PS_DPAD_DOWN": "PS ↓",
    "PS_DPAD_LEFT": "PS ←",
    "PS_DPAD_RIGHT": "PS →",
    
    // Function keys
    "VK_F1": "F1",
    "VK_F2": "F2",
    "VK_F3": "F3",
    "VK_F4": "F4",
    "VK_F5": "F5",
    "VK_F6": "F6",
    "VK_F7": "F7",
    "VK_F8": "F8",
    "VK_F9": "F9",
    "VK_F10": "F10",
    "VK_F11": "F11",
    "VK_F12": "F12",
    
    // Navigation keys
    "VK_HOME": "HOME",
    "VK_END": "END",
    "VK_PRIOR": "PAGE UP",
    "VK_NEXT": "PAGE DOWN",
    "VK_INSERT": "INS",
    
    // Lock keys
    "VK_CAPITAL": "CAPS",
    "VK_NUMLOCK": "NUM LOCK",
    "VK_SCROLL": "SCROLL LOCK",
    
    // Windows keys
    "VK_LWIN": "WIN",
    "VK_RWIN": "WIN",
    "VK_APPS": "MENU"
};

const getModKeySwap = async (iManager, mod) => {
    const modPath = await mod.getModPath();

    //debug
    console.log('modPath:', modPath);

    // 1. 寻找文件夹下的所有 ini 文件，忽略 desktop.ini 和以 DISABLED 开头的 ini 文件
    let iniFilePaths = [];
    const findIniInFolder = (folderPath) => {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                findIniInFolder(filePath);
            } else if (file.endsWith('.ini') && 
                      file !== 'desktop.ini' && 
                      !file.toLowerCase().startsWith('disabled')) {
                iniFilePaths.push(filePath);
            }
        }
    };
    
    findIniInFolder(modPath);
    
    if (iniFilePaths.length === 0) {
        // 增加双语支持
        const tt = new iManager.TranslatedText(
            'No ini file found in mod【' + mod.name + '】',
            '在mod【' + mod.name + '】中没有找到ini文件'
        );
        iManager.t_snack(tt, 'error');
        console.log(tt.get(), tt);
        return;
    }

    const successTT = new iManager.TranslatedText(
        'Found ini files in mod【' + mod.name + '】',
        '在mod【' + mod.name + '】中找到了ini文件'
    );
    iManager.t_snack(successTT, 'info');
    console.log(successTT.get());

    // Clear existing hotkeys before adding new ones
    mod.hotkeys = [];

    // 2. 读取所有 ini 文件
    let allHotkeys = new Set();
    for (const iniFilePath of iniFilePaths) {
        const hotkeys = getSwapkeyFromIni(iniFilePath, iManager);
        for (const hotkey of hotkeys) {
            const hotkeyStr = JSON.stringify(hotkey);
            if (!allHotkeys.has(hotkeyStr)) {
                allHotkeys.add(hotkeyStr);
                mod.hotkeys.push(hotkey);
            }
        }
    }

    //debug
    console.log('adjusted mod data:', mod);
    return mod;
};

const getSwapkeyFromIni = (iniFilePath, iManager) => {
    const fs = require('fs');
    const lines = fs.readFileSync(iniFilePath, 'utf-8').split('\n');
    let keyswap = [];
    let flag = false;
    let keyType = "";
    let currentSection = "";

    // 英文到中文的翻译字典
    const t_description = {
        'swap': '切换',
        'Swap': '切换',
        'toggle': '切换',
        'Toggle': '切换',
        'glow': '发光',
        'Glow': '发光',
        'help': '帮助',
        'Help': '帮助',
        'show': '显示',
        'Show': '显示',
        'hide': '隐藏',
        'Hide': '隐藏',
        'on': '开启',
        'On': '开启',
        'off': '关闭',
        'Off': '关闭',
        'enable': '启用',
        'Enable': '启用',
        'disable': '禁用',
        'Disable': '禁用'
    };

    const SECTION_PATTERN = /\[(.*?)\]/;
    const KEY_PATTERN = /^key\s*=\s*(.+)/i;
    const BACK_PATTERN = /^back\s*=\s*(.+)/i;

    lines.forEach(line => {
        // 忽略以 ; 开头的行
        if (line.trim().startsWith(';') || line.trim() === '') {
            return;
        }

        // 检查是否是新的section
        if (line.trim().startsWith('[')) {
            const sectionMatch = line.trim().match(SECTION_PATTERN);
            if (sectionMatch) {
                currentSection = sectionMatch[1];
                if (currentSection.toLowerCase().startsWith('key')) {
                    flag = true;
                    keyType = currentSection.slice(3);
                    
                    // Clean up description by removing prefixes
                    // Remove "Key" prefix if present
                    if (keyType.toLowerCase().startsWith('key')) {
                        keyType = keyType.slice(3);
                    }
                    
                    // Remove "Swap" prefix if present
                    if (keyType.toLowerCase().startsWith('swap')) {
                        keyType = keyType.slice(4);
                    }
                    
                    // Remove "swapvar" prefix if present
                    if (keyType.toLowerCase().startsWith('swapvar')) {
                        keyType = keyType.slice(7);
                    }
                    
                    // If description is empty or contains only spaces after removing prefixes, set it to "Toggle"
                    if (!keyType || keyType.trim() === '') {
                        keyType = 'Toggle';
                    }
                } else {
                    flag = false;
                }
            }
            return;
        }

        if (!flag) return;

        // Process key assignments
        let keyMatch = line.trim().match(KEY_PATTERN);
        let isBack = false;
        if (!keyMatch) {
            keyMatch = line.trim().match(BACK_PATTERN);
            isBack = true;
        }

        if (keyMatch) {
            const keyValue = keyMatch[1].trim();
            const parts = keyValue.split(/\s+/);
            
            // Process modifiers and main key
            const modifiers = [];
            let mainKey = '';
            let mainKeyIndex = -1; // Add this line

            // Find the actual main key (last non-'no_...' part)
            for (let i = parts.length - 1; i >= 0; i--) {
                if (!parts[i].toLowerCase().startsWith('no_')) {
                    mainKey = parts[i].toUpperCase();
                    mainKeyIndex = i; // Add this line
                    break;
                }
            }
            
            // Process modifiers
// Remove duplicate modifiers declaration since it's already declared above
            const excludedModifiers = new Set();
            
            // First pass - identify excluded modifiers
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i].toLowerCase();
                if (part.startsWith('no_')) {
                    // Extract the modifier name without the 'no_' prefix
                    const excludedMod = part.substring(3).toUpperCase();
                    excludedModifiers.add(excludedMod);
                    // Also add the mapped version if it exists
                    if (key_mapping[excludedMod]) {
                        excludedModifiers.add(key_mapping[excludedMod]);
                    }
                }
            }
            
            // Second pass - add non-excluded modifiers
            // Change this line:
            for (let i = 0; i < mainKeyIndex; i++) {
                const part = parts[i].toUpperCase();
                if (part.toLowerCase().startsWith('no_')) continue;

                const mappedModifier = key_mapping[part] || part;
                // Only add if not in excluded list
                if (!modifiers.includes(mappedModifier) && !excludedModifiers.has(mappedModifier)) {
                    modifiers.push(mappedModifier);
                }
            }
            
            // Get mapped main key
            const mappedMainKey = key_mapping[mainKey] || mainKey;
            
            // Combine modifiers and main key
            const keyDisplay = modifiers.length > 0 
                ? `${modifiers.join('+')}+${mappedMainKey}`
                : mappedMainKey;

            // Add back suffix if needed
            const backSuffix = isBack ? " (Back)" : "";
            
            // 如果是中文的话，尝试将 description 转化为中文
            let translatedKeyType = keyType;
            if (iManager && iManager.config && iManager.config.language === 'zh_cn') {
                translatedKeyType = t_description[keyType] || keyType;
            }
            
            // Add to keyswap if not already present
            const keyEntry = {
                key: keyDisplay,
                description: translatedKeyType + backSuffix
            };
            
            if (!keyswap.some(k => k.key === keyEntry.key)) {
                keyswap.push(keyEntry);
            }
        }
    });

    //debug
    console.log(`for ini file ${iniFilePath}, keyswap:`, keyswap);
    return keyswap;
};

module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '识别mod信息',
        en: 'Recognize Mod Info'
    },
    init(iManager) {
        iManager.on('addMod', async (mod) => {
            if (!mod) return;
            
            if (iManager.getPluginData(pluginName, "ifAddKeySwap")) {
                const newMod = await getModKeySwap(iManager, mod);
                if (!newMod || newMod.hotkeys.length === 0) return;
                
                mod.saveModInfo();

                if (iManager.temp.currentMod.name === mod.name) {
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

        // info
        pluginData.push({
            name: 'info',
            type: 'markdown',
            description: 'Info',
            t_description: {
                zh_cn: '感谢 [Jank8](https://github.com/Jank8) 对该插件的贡献',
                en: 'Thanks to [Jank8](https://github.com/Jank8) for contributing to this plugin'
            }
        });

        // Plugin configuration options
        pluginData.push({
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
            }
        });

        // Divider for visual separation
        pluginData.push({
            name: 'divider',
            data: '',
            type: 'markdown',
            displayName: 'Divider',
            description: '---',
            t_displayName: {
                zh_cn: '分割线',
                en: 'Divider'
            }
        });

        // Refresh confirmation switch
        const ifRefreshAllMod = {
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

                if (value) {
                    const snackMessage = {
                        zh_cn: '刷新全部的mod的切换键可能会需要一些时间，这取决于你的mod数量，请坐和放宽，不要关闭程序',
                        en: 'Refreshing all mod keyswap may take some time, depending on the number of mods you have, please be patient and do not close the program'
                    };
                    iManager.t_snack(snackMessage);
                }
            }
        };
        pluginData.push(ifRefreshAllMod);

        // Refresh all mods button
        pluginData.push({
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
            onChange: async () => {
                if (ifRefreshAllMod.data) {
                    // Turn off confirmation after starting
                    ifRefreshAllMod.data = false;
                    iManager.showDialog('loading-dialog');
                    
                    iManager.t_snack({
                        en: "Refreshing all mods...",
                        zh_cn: "正在刷新所有mod..."
                    });

                    try {
                        for (const mod of iManager.data.modList) {
                            const newMod = await getModKeySwap(iManager, mod);
                            if (newMod) {
                                const modFilePath = path.join(iManager.config.modSourcePath, mod.name, 'mod.json');
                                fs.writeFileSync(modFilePath, JSON.stringify(newMod, null, 4));
                            }
                        }

                        iManager.t_snack({
                            en: "Successfully refreshed all mods",
                            zh_cn: "成功刷新所有mod"
                        }, 'success');
                    } catch (error) {
                        console.error('Error refreshing mods:', error);
                        iManager.t_snack({
                            en: "Error refreshing mods: " + error.message,
                            zh_cn: "刷新mod时出错: " + error.message
                        }, 'error');
                    } finally {
                        iManager.dismissDialog('loading-dialog');
                        iManager.showDialog('dialog-need-refresh');
                    }
                } else {
                    iManager.t_snack({
                        en: "Please enable the confirmation toggle above first",
                        zh_cn: "请先打开上方的确认开关"
                    }, 'warning');
                }
            }
        });

        iManager.registerPluginConfig(pluginName, pluginData);
    }
}