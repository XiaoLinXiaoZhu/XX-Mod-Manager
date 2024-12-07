


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
//     t_name:{
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
    t_name:{
        zh_cn:'自启动插件',
        en:'Auto Start Plugin'
    },
    init(iManager){
        iManager.snack('Auto Start Plugin Loaded');

        let pluginData = [];

        let ifAblePlugin = {
            name: 'ifAblePlugin',
            data: true,
            type: 'boolean',
            displayName: 'If Able Plugin',
            description: 'If true, the plugin will be enabled',
            t_name:{
                zh_cn:'是否启用插件',
                en:'Enable Plugin'
            },
            t_description:{
                zh_cn:'如果为真，插件将被启用',
                en:'If true, the plugin will be enabled'
            },
            onChange: (value) => {
                console.log('ifAblePlugin changed:', value);
                ifAblePlugin.data = value;
                iManager.snack('ifAblePlugin changed:'+value);
                iManager.savePluginConfig();
            }
        };
        pluginData.push(ifAblePlugin);

        let modLoaderPath = {
            name: 'modLoaderPath',
            data: '',
            type: 'path',
            displayName: 'Mod Loader Path',
            description: 'The path of the mod loader',
            t_name:{
                zh_cn:'Mod Loader 路径',
                en:'Mod Loader Path'
            },
            t_description:{
                zh_cn:'Mod Loader 的路径',
                en:'The path of the mod loader'
            },
            onChange: (value) => {
                console.log('modLoaderPath changed:', value);
                modLoaderPath.data = value;
                iManager.snack('Mod Loader Path changed:'+value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(modLoaderPath);


        iManager.registerPluginConfig(pluginName,pluginData);
    }
}