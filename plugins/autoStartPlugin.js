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


const pluginName = 'autoStartPlugin';
module.exports = {
    name: pluginName,
    t_displayName:{
        zh_cn:'自动启动插件',
        en:'Auto Start Plugin'
    },
    init(iManager){
        iManager.snack('Auto Start Plugin Loaded');

        let pluginData = [];

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
                console.log('autoStartGame changed:', value);
                autoStartGame.data = value;
                iManager.snack('autoStartGame changed:'+value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(autoStartGame);

        //- 游戏路径
        let gamePath = {
            name: 'gamePath',
            data: '',
            type: 'path',
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

        iManager.registerPluginConfig(pluginName, pluginData);

        iManager.on('initDone', (iManager) => {
            //debug
            console.log('autoStartPlugin initDone',iManager.pluginConfig[pluginName]);
            const pluginConfig = iManager.pluginConfig[pluginName]; // 获取插件配置,这个是 data 的数组
            // 如果 name 为 autoStartGame 的 data 为 true,则自动启动游戏
            //debug
            console.log('autoStartGame:',pluginConfig.find((data) => data.name === 'autoStartGame'));
            if(iManager.getPluginData(pluginName, 'autoStartGame')){
                // 如果游戏路径存在,则启动游戏
                if(iManager.getPluginData(pluginName, 'gamePath')){
                    iManager.snack('Auto Start Game '+ iManager.getPluginData(pluginName, 'gamePath'));
                    // 启动游戏
                    // iManager.startGame(pluginConfig.find((data) => data.name === 'gamePath').data);
                }else{
                    iManager.snack('Game Path not set');
                }
            }
        });
    }
}