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
const { ipcRenderer } = require('electron');
const fs = require('fs');

function startGame(iManager, gamePath) {
    // 检查游戏路径是否存在
    if (!gamePath) {
        const snackMessage = iManager.config.language === 'zh_cn' ? '游戏路径未设置' : 'Game Path not set';
        iManager.snack(snackMessage, "error");
        return false;
    }
    if (!fs.existsSync(gamePath)) {
        const snackMessage = iManager.config.language === 'zh_cn' ? '游戏路径不存在' : 'Game Path not exist';
        iManager.snack(snackMessage, "error");
        return false;
    }
    // 启动游戏
    iManager.startExe(gamePath);
}

function startModLoader(iManager, modLoaderPath) {
    // 检查 mod 加载器路径是否存在
    if (!modLoaderPath) {
        const snackMessage = iManager.config.language === 'zh_cn' ? 'Mod加载器路径未设置' : 'Mod Loader Path not set';
        iManager.snack(snackMessage, "error");
        return false;
    }
    if (!fs.existsSync(modLoaderPath)) {
        const snackMessage = iManager.config.language === 'zh_cn' ? 'Mod加载器路径不存在' : 'Mod Loader Path not exist';
        iManager.snack(snackMessage, "error");
        return false;
    }
    // 启动 mod 加载器
    iManager.startExe(modLoaderPath);
}

const pluginName = 'autoStartPlugin';
module.exports = {
    name: pluginName,
    t_displayName:{
        zh_cn:'自动启动插件',
        en:'Auto Start Plugin'
    },
    init(iManager){
        // iManager.snack('Auto Start Plugin Loaded from '+__dirname);

        iManager.on('wakeUp', () => {
            console.log('wakeUp');
            if (iManager.getPluginData(pluginName, 'autoStartModLoader')) startModLoader(iManager, iManager.getPluginData(pluginName, 'modLoaderPath'));
            if (iManager.getPluginData(pluginName, 'autoStartGame')) startGame(iManager, iManager.getPluginData(pluginName, 'gamePath'));
        });
        


        let pluginData = [];

        //- mod加载器路径
        let modLoaderPath = {
            name: 'modLoaderPath',
            data: '',
            type: 'exePath',
            displayName: 'Mod Loader Path',
            description: 'The path of the mod loader',
            t_displayName:{
                zh_cn:'mod加载器路径',
                en:'Mod Loader Path'
            },
            t_description:{
                zh_cn:'mod加载器的路径',
                en:'The path of the mod loader'
            },
            onChange: (value) => {
                console.log('modLoaderPath changed:', value);
                modLoaderPath.data = value;
                iManager.snack('modLoaderPath changed:'+value);
                iManager.savePluginConfig();
            }
        };
        pluginData.push(modLoaderPath);

        //- 手动启动mod加载器的按钮
        let startModLoaderButton = {
            name: 'startModLoader',
            type: 'iconbutton',
            displayName: 'Start Mod Loader',
            description: 'Start the mod loader manually',
            t_displayName:{
                zh_cn:'启动mod加载器',
                en:'Start Mod Loader'
            },
            t_description:{
                zh_cn:'手动启动mod加载器',
                en:'Start the mod loader manually'
            },
            buttonName: 'Start Mod Loader',
            t_buttonName:{
                zh_cn:'启动mod加载器',
                en:'Start Mod Loader'
            },
            onChange: () => {
                // 检查 mod 加载器路径是否存在
                const modLoaderPath = iManager.getPluginData(pluginName, 'modLoaderPath');
                if (!modLoaderPath || !fs.existsSync(modLoaderPath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? 'Mod加载器路径未设置或不存在' : 'Mod Loader Path not set or not exist'; 
                    iManager.snack(snackMessage,"error");
                    return false;
                }
                iManager.startExe(modLoaderPath);
            }
        };
        pluginData.push(startModLoaderButton);



        //- 是否自动启动mod加载器
        let autoStartModLoader = {
            name: 'autoStartModLoader',
            data: false,
            type: 'boolean',
            displayName: 'Auto Start Mod Loader',
            description: 'If true, the mod loader will start automatically',
            t_displayName:{
                zh_cn:'自动启动mod加载器',
                en:'Auto Start Mod Loader'
            },
            t_description:{
                zh_cn:'如果为真，mod加载器将自动启动',
                en:'If true, the mod loader will start automatically'
            },
            onChange: (value) => {
                // 检查 mod 加载器路径是否存在
                const modLoaderPath = iManager.getPluginData(pluginName, 'modLoaderPath');
                if (value && !modLoaderPath && !fs.existsSync(modLoaderPath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? 'Mod加载器路径未设置或不存在' : 'Mod Loader Path not set or not exist'; 
                    iManager.snack(snackMessage,"error");
                    return false;
                }
                console.log('autoStartModLoader changed:', value);
                autoStartModLoader.data = value;
                const snackMessage = iManager.config.language === 'zh_cn' ? '自动启动mod加载器已更改为' : 'autoStartModLoader changed to';
                iManager.snack(snackMessage + value);
                iManager.savePluginConfig();
            }
        };
        pluginData.push(autoStartModLoader);


        //- 游戏路径
        let gamePath = {
            name: 'gamePath',
            data: '',
            type: 'exePath',
            displayName: 'Game Path',
            description: 'The path of the game',
            t_displayName:{
                zh_cn:'游戏路径',
                en:'Game Path'
            },
            t_description:{
                zh_cn:'游戏的路径',
                en:'The path of the game'
            },
            onChange: (value) => {
                console.log('gamePath changed:', value);
                gamePath.data = value;
                iManager.snack('gamePath changed:'+value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(gamePath);

        //- 手动启动游戏的按钮
        let startGameButton = {
            name: 'startGame',
            type: 'iconbutton',
            displayName: 'Start Game',
            description: 'Start the game manually',
            t_displayName:{
                zh_cn:'启动游戏',
                en:'Start Game'
            },
            t_description:{
                zh_cn:'手动启动游戏',
                en:'Start the game manually'
            },
            buttonName: 'Start Game',
            t_buttonName:{
                zh_cn:'启动游戏',
                en:'Start Game'
            },
            onChange: () => {
                // 检查游戏路径是否存在
                const gamePath = iManager.getPluginData(pluginName, 'gamePath');
                if (!gamePath || !fs.existsSync(gamePath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? '游戏路径未设置或不存在' : 'Game Path not set or not exist'; 
                    iManager.snack(snackMessage,"error");
                    return false;
                }
                iManager.startExe(gamePath);
            }
        };
        pluginData.push(startGameButton);

        //- 是否自动启动游戏
        let autoStartGame = {
            name: 'autoStartGame',
            data: false,
            type: 'boolean',
            displayName: 'Auto Start Game',
            description: 'If true, the game will start automatically',
            t_displayName:{
                zh_cn:'自动启动游戏',
                en:'Auto Start Game'
            },
            t_description:{
                zh_cn:'如果为真，游戏将自动启动',
                en:'If true, the game will start automatically'
            },
            onChange: (value) => {
                // 检查游戏路径是否存在
                const gamePath = iManager.getPluginData(pluginName, 'gamePath');
                if (value && !gamePath && !fs.existsSync(gamePath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? '游戏路径未设置或不存在' : 'Game Path not set or not exist'; 
                    iManager.snack(snackMessage,"error");
                    return false;
                }
                console.log('autoStartGame changed:', value);
                autoStartGame.data = value;
                iManager.savePluginConfig();
            }
        }
        pluginData.push(autoStartGame);

        iManager.registerPluginConfig(pluginName, pluginData);
    }
}