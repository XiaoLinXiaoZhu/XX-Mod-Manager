


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
const pluginName = 'testPlugin';
module.exports = {
    name: pluginName,
    t_name:{
        zh_cn:'测试插件',
        en:'Test Plugin'
    },
    init(iManager){
        iManager.snack('Auto Start Plugin Loaded');

        let pluginData = [];


        //- 测试 boolean 类型
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

        //- 测试 path 类型
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

        //- 测试 number 类型
        let refreshTime = {
            name: 'refreshTime',
            data: 1000,
            type: 'number',
            displayName: 'Refresh Time',
            description: 'The time to refresh',
            t_name:{
                zh_cn:'刷新时间',
                en:'Refresh Time'
            },
            t_description:{
                zh_cn:'刷新的时间',
                en:'The time to refresh'
            },
            onChange: (value) => {
                console.log('refreshTime changed:', value);
                refreshTime.data = value;
                iManager.snack('Refresh Time changed:'+value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(refreshTime);

        //- 测试 button 类型
        let testButton = {
            name: 'testButton',
            type: 'button',
            displayName: 'Test Button',
            description: 'Test Button',
            t_name:{
                zh_cn:'测试按钮',
                en:'Test Button'
            },
            t_description:{
                zh_cn:'测试按钮',
                en:'Test Button'
            },
            buttonName: 'Test Button',
            t_buttonName:{
                zh_cn:'测试按钮',
                en:'Test Button'
            },
            onChange: (value) => {
                iManager.snack('Test Button Clicked');
            }
        }
        pluginData.push(testButton);

        //- 测试 select 类型
        let testSelect = {
            name: 'testSelect',
            data: 'a',
            type: 'select',
            displayName: 'Test Select',
            description: 'Test Select',
            t_name:{
                zh_cn:'测试选择',
                en:'Test Select'
            },
            t_description:{
                zh_cn:'测试选择',
                en:'Test Select'
            },
            options:[
                {
                    value:'a',
                    t_value:{
                        zh_cn:'选项A',
                        en:'Option A'
                    }
                },
                {
                    value:'b',
                    t_value:{
                        zh_cn:'选项B',
                        en:'Option B'
                    }
                }
            ],
            onChange: (value) => {
                console.log('testSelect changed:', value);
                testSelect.data = value;
                iManager.snack('Test Select changed:'+value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(testSelect);

        iManager.registerPluginConfig(pluginName,pluginData);
    }
}