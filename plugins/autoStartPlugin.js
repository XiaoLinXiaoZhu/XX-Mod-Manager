


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
    init(iManager){
        iManager.snack('Auto Start Plugin Loaded');

        const ifAblePlugin = {
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
            }
        };

        let pluginData = [];
        pluginData.push(ifAblePlugin);


        iManager.registerPluginData(pluginName,pluginData);
    }
}