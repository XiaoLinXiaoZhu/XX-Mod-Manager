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

function runCommand(iManager, command) {
    //debug
    console.log('runCommand:', command);
    if (!command) {
        const snackMessage = iManager.config.language === 'zh_cn' ? '命令未设置' : 'Command not set';
        iManager.snack(snackMessage, "error");
        return false;
    }
    iManager.runCommand(command);
}

const pluginName = 'autoStartPlugin';
module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '自动启动插件',
        en: 'Auto Start Plugin'
    },
    init(iManager) {
        // iManager.snack('Auto Start Plugin Loaded from '+__dirname);
        const ignoredState = 'ignoreSwitchConfig,waiting for switchConfig';
        iManager.on('wakeUp', () => {
            console.log('wakeUp', iManager.getPluginData(pluginName, 'autoStartModLoader'), iManager.getPluginData(pluginName, 'autoStartGame'), iManager.getPluginData(pluginName, 'ifRunCommand'));
            if (iManager.getPluginData(pluginName, 'autoStartModLoader')) startModLoader(iManager, iManager.getPluginData(pluginName, 'modLoaderPath'));
            if (iManager.getPluginData(pluginName, 'autoStartGame')) startGame(iManager, iManager.getPluginData(pluginName, 'gamePath'));
            if (iManager.getPluginData(pluginName, 'ifRunCommand')) {
                ipcRenderer.invoke('get-args').then((args) => {
                    //debug
                    console.log('get-args:', args, args.switchConfig, iManager.getPluginData(pluginName, 'ignoreSwitchConfig'));
                    if (!args.switchConfig || iManager.getPluginData(pluginName, 'ignoreSwitchConfig')) {
                        runCommand(iManager, iManager.getPluginData(pluginName, 'command'));
                        // 重置 commandStatus
                        commandStatus.data = '';
                    } else {
                        console.log('ignoreSwitchConfig,waiting for switchConfig');
                        commandStatus.data = ignoredState;
                        iManager.savePluginConfig();
                    }
                });
            }
            
            // 如果发现 commandStatus 为 ignoredState,那么就说明上一次刷新结束时，并没有执行命令，这次刷新时，即使拥有参数 --switchConfig 也要执行命令
            if (iManager.getPluginData(pluginName, 'commandStatus') === ignoredState && !window.location.href.includes('switchConfig')) {
                runCommand(iManager, iManager.getPluginData(pluginName, 'command'));
                // 重置 commandStatus
                commandStatus.data = '';
                iManager.savePluginConfig();
            }
        });

        let pluginData = [];



        let markdownModLoader = {
            name: 'markdownModLoader',
            data: '',
            type: 'markdown',
            displayName: 'Mod Loader',
            description: 'The path of the mod loader',
            t_displayName: {
                zh_cn: 'Mod加载器',
                en: 'Mod Loader'
            },
            t_description: {
                zh_cn: '# 在程序启动时自动启动mod加载器\n请确保mod加载器的路径正确,并且将开关打开。\n你可以通过手动点击按钮测试程序是否正常启动。',
                en: '# Auto Start Mod Loader on Program Start\nPlease make sure the path of the mod loader is correct and turn on the switch. \nYou can test if the program starts normally by manually clicking the button.'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        };
        pluginData.push(markdownModLoader);

        //- 是否自动启动mod加载器
        let autoStartModLoader = {
            name: 'autoStartModLoader',
            data: false,
            type: 'boolean',
            displayName: 'Auto Start Mod Loader',
            t_displayName: {
                zh_cn: '自动启动mod加载器',
                en: 'Auto Start Mod Loader'
            },
            onChange: (value) => {
                // 检查 mod 加载器路径是否存在
                const modLoaderPath = iManager.getPluginData(pluginName, 'modLoaderPath');
                if (value && !modLoaderPath && !fs.existsSync(modLoaderPath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? 'Mod加载器路径未设置或不存在' : 'Mod Loader Path not set or not exist';
                    iManager.snack(snackMessage, "error");
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
        //- mod加载器路径
        let modLoaderPath = {
            name: 'modLoaderPath',
            data: '',
            type: 'exePath',
            displayName: 'Mod Loader Path',
            t_displayName: {
                zh_cn: 'mod加载器路径',
                en: 'Mod Loader Path'
            },
            onChange: (value) => {
                console.log('modLoaderPath changed:', value);
                modLoaderPath.data = value;
                iManager.snack('modLoaderPath changed:' + value);
                iManager.savePluginConfig();
            }
        };
        pluginData.push(modLoaderPath);

        //- 手动启动mod加载器的按钮
        let startModLoaderButton = {
            name: 'startModLoader',
            type: 'iconbutton',
            displayName: 'Test Start Mod Loader',
            t_displayName: {
                zh_cn: '测试启动mod加载器',
                en: 'Test Start Mod Loader'
            },
            buttonName: 'Start Mod Loader',
            t_buttonName: {
                zh_cn: '启动mod加载器',
                en: 'Start Mod Loader'
            },
            onChange: () => {
                // 检查 mod 加载器路径是否存在
                const modLoaderPath = iManager.getPluginData(pluginName, 'modLoaderPath');
                if (!modLoaderPath || !fs.existsSync(modLoaderPath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? 'Mod加载器路径未设置或不存在' : 'Mod Loader Path not set or not exist';
                    iManager.snack(snackMessage, "error");
                    return false;
                }
                iManager.startExe(modLoaderPath);
            }
        };
        pluginData.push(startModLoaderButton);





        let divider1 = {
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
        pluginData.push(divider1);

        let markdownGame = {
            name: 'markdownGame',
            data: '',
            type: 'markdown',
            displayName: 'Game',
            description: 'The path of the game',
            t_displayName: {
                zh_cn: '游戏',
                en: 'Game'
            },
            t_description: {
                zh_cn: '# 在程序启动时自动启动游戏\n请确保游戏的路径正确,并且将开关打开。\n你可以通过手动点击按钮测试程序是否正常启动。',
                en: '# Auto Start Game on Program Start\nPlease make sure the path of the game is correct and turn on the switch. \nYou can test if the program starts normally by manually clicking the button.'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        };
        pluginData.push(markdownGame);


        //- 是否自动启动游戏
        let autoStartGame = {
            name: 'autoStartGame',
            data: false,
            type: 'boolean',
            displayName: 'Auto Start Game',
            t_displayName: {
                zh_cn: '自动启动游戏',
                en: 'Auto Start Game'
            },
            onChange: (value) => {
                // 检查游戏路径是否存在
                const gamePath = iManager.getPluginData(pluginName, 'gamePath');
                if (value && !gamePath && !fs.existsSync(gamePath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? '游戏路径未设置或不存在' : 'Game Path not set or not exist';
                    iManager.snack(snackMessage, "error");
                    return false;
                }
                console.log('autoStartGame changed:', value);
                autoStartGame.data = value;
                iManager.savePluginConfig();
            }
        }
        pluginData.push(autoStartGame);
        //- 游戏路径
        let gamePath = {
            name: 'gamePath',
            data: '',
            type: 'exePath',
            displayName: 'Game Path',
            t_displayName: {
                zh_cn: '游戏路径',
                en: 'Game Path'
            },
            onChange: (value) => {
                console.log('gamePath changed:', value);
                gamePath.data = value;
                iManager.snack('gamePath changed:' + value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(gamePath);

        //- 手动启动游戏的按钮
        let startGameButton = {
            name: 'startGame',
            type: 'iconbutton',
            displayName: 'Test Start Game',
            t_displayName: {
                zh_cn: '测试启动游戏',
                en: 'Test Start Game'
            },
            buttonName: 'Start Game',
            t_buttonName: {
                zh_cn: '启动游戏',
                en: 'Start Game'
            },
            onChange: () => {
                // 检查游戏路径是否存在
                const gamePath = iManager.getPluginData(pluginName, 'gamePath');
                if (!gamePath || !fs.existsSync(gamePath)) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? '游戏路径未设置或不存在' : 'Game Path not set or not exist';
                    iManager.snack(snackMessage, "error");
                    return false;
                }
                iManager.startExe(gamePath);
            }
        };
        pluginData.push(startGameButton);

        let divider2 = {
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
        pluginData.push(divider2);

        let markdownCommand = {
            name: 'markdownCommand',
            data: '',
            type: 'markdown',
            displayName: 'Command',
            description: 'Run command when program start',
            t_displayName: {
                zh_cn: '命令',
                en: 'Command'
            },
            t_description: {
                zh_cn: '# 在程序启动时运行自定义命令\n比如你想要在XXMM启动时，也启动当前配置对应的游戏的XXMI，你可以在这里设置运行命令行为：\n "XXMI Launcher.exe" --nogui --xxmi ZZMI \n-\n注意将其中的XXMI替换为你的XXMI所在的位置，ZZMI为其所启动的模组加载器的类型，有ZZMI/WWMI/HSMI等\n请确保命令正确，并且将开关打开。',
                en: '# Run custom command when program start\nFor example, if you want to start the XXMI corresponding to the current configuration when XXMM starts, you can set the command to run here: \n "XXMI Launcher.exe" --nogui --xxmi ZZMI \n-\nReplace XXMI with the location of your XXMI, and ZZMI with the type of mod loader it starts, such as ZZMI/WWMI/HSMI, etc. \nPlease make sure the command is correct and turn on the switch.'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        };
        pluginData.push(markdownCommand);

        //- 是否运行命令
        let ifRunCommand = {
            name: 'ifRunCommand',
            data: false,
            type: 'boolean',
            displayName: 'Run Command',
            t_displayName: {
                zh_cn: '运行命令',
                en: 'Run Command'
            },
            onChange: (value) => {
                console.log('runCommand changed:', value);
                ifRunCommand.data = value;
            }
        }
        pluginData.push(ifRunCommand);

        //- 忽略是否是切换配置界面
        let ignoreSwitchConfig = {
            name: 'ignoreSwitchConfig',
            data: false,
            type: 'boolean',
            displayName: 'Ignore Switch Config',
            t_displayName: {
                zh_cn: '忽略切换配置界面',
                en: 'Ignore Switch Config'
            },
            onChange: (value) => {
                console.log('ignoreSwitchConfig changed:', value);
                ignoreSwitchConfig.data = value;
            }
        }
        pluginData.push(ignoreSwitchConfig);

        //- 命令
        let command = {
            name: 'command',
            data: '',
            type: 'string',
            displayName: 'Command',
            t_displayName: {
                zh_cn: '命令',
                en: 'Command'
            },
            onChange: (value) => {
                console.log('command changed:', value);
                command.data = value;
            }
        }
        pluginData.push(command);

        //- 指令执行状态
        let commandStatus = {
            name: 'commandStatus',
            data: '',
            type: 'hidden',
            displayName: 'Command Status',
            t_displayName: {
                zh_cn: '命令执行状态',
                en: 'Command Status'
            },
            onChange: (value) => {
                console.log('commandStatus changed:', value);
                commandStatus.data = value;
            }
        }
        pluginData.push(commandStatus);

        //- 手动运行命令的按钮
        let runCommandButton = {
            name: 'runCommand',
            type: 'iconbutton',
            displayName: 'Test Run Command',
            t_displayName: {
                zh_cn: '测试运行命令',
                en: 'Test Run Command'
            },
            buttonName: 'Run Command',
            t_buttonName: {
                zh_cn: '运行命令',
                en: 'Run Command'
            },
            onChange: () => {
                const command = iManager.getPluginData(pluginName, 'command');
                if (!command) {
                    const snackMessage = iManager.config.language === 'zh_cn' ? '命令未设置' : 'Command not set';
                    iManager.snack(snackMessage, "error");
                    return false;
                }
                runCommand(iManager, command);
            }
        };
        pluginData.push(runCommandButton);



        iManager.registerPluginConfig(pluginName, pluginData);
    }
}