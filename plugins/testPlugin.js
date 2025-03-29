


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
const pluginName = 'testPlugin';
const markdown_cn = `# 测试插件
这是一个简单的测试插件，用于测试插件的功能和显示效果，对于 用户来说，你可以将该插件在 设置-插件 中关闭，以取消该插件的显示。
# 声明配置项
插件可以通过声明数据来在设置页面中显示配置项，用户可以通过设置页面来配置插件的功能：
- boolean 类型的数据可以通过开关来控制
- number 类型的数据可以通过输入框来控制
- path 类型的数据可以通过文件夹选择器来控制
- select 类型的数据可以通过选择器来控制
- button 类型的数据可以通过按钮来触发事件
- markdown 类型的数据可以展示 markdown 格式的文本

# 监听数据变化
插件可以通过声明 onChange 方法来监听数据的变化，当数据发生变化时，onChange 方法会被触发。
# 保存数据
插件可以通过调用 iManager.savePluginConfig() 方法来手动保存数据，当然程序在关闭时会自动保存数据。
# 事件监听
插件可以通过 iManager.on() 方法来监听事件，从而实现插件的功能。
---
# 配置项展示：
下面是一些配置项的展示：`;
const markdown_en = `# Test Plugin
This is a simple test plugin, used to test the function and display effect of the plugin, for users, you can turn off the plugin in settings-plugin to cancel the display of the plugin.
# Declare configuration items
Plugins can display configuration items by declaring data, and users can configure the function of the plugin through the settings page:
- boolean type data can be controlled by switch
- number type data can be controlled by input box
- path type data can be controlled by folder selector
- select type data can be controlled by selector
- button type data can trigger events by button
- markdown type data can display text in markdown format

# Listen for data changes
Plugins can listen for data changes by declaring the onChange method, which will be triggered when data changes.
# Save data
Plugins can manually save data by calling iManager.savePluginConfig() method, of course the program will automatically save data when closing.
# Event listening
Plugins can listen for events through the iManager.on() method to implement the function of the plugin.
---
# Configuration item display:
Here are some configuration items display:`;

module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '测试插件',
        en: 'Test Plugin'
    },
    init(iManager) {
        iManager.t_snack({
            zh_cn: '测试插件从该路径加载：' + __dirname,
            en: 'Test Plugin loaded from path: ' + __dirname    
        });
        iManager.t_snack({
            zh_cn: '测试插件用以展示插件功能，提供插件编写参考，对于普通用户，你可以在设置>插件中关闭该插件，以取消该插件的显示。',  
            en: 'Test Plugin is used to show the function of the plugin, provide reference for plugin writing, for ordinary users, you can close the plugin in settings>plugin to cancel the display of the plugin.'      
        });

        iManager.on('pluginLoaded', () => {
            // 如果开启了打印日志到文件，则激活LogHandler
            const ifLog2File = iManager.getPluginData(pluginName, 'ifLog2File');
            if (ifLog2File) {
                iManager.t_snack({
                    zh_cn: '日志将会被打印到文件中',
                    en: 'Log will be printed to file'
                });
                iManager.LogHandler.init();
            }
        });

        let pluginData = [];

        //- 是否打印日志
        let ifLog2File = {
            name: 'ifLog2File',
            data: false,
            type: 'boolean',
            displayName: 'If Log To File',
            description: 'If true, the plugin will log to file',
            t_displayName: {
                zh_cn: '是否打印日志到文件',
                en: 'Log To File'
            },
            t_description: {
                zh_cn: '如果为真，插件将打印日志到文件',
                en: 'If true, the plugin will log to file'
            },
            onChange: (value) => {
                console.log('ifLog2File changed:', value);
                ifLog2File.data = value;
                iManager.snack('ifLog2File changed:' + value);
                iManager.showDialog('dialog-need-refresh');
            }
        };
        pluginData.push(ifLog2File);

        //- 测试 markdown 类型
        let testMarkdown = {
            name: 'testMarkdown',
            data: '',
            type: 'markdown',
            displayName: 'Test Markdown',
            description: 'Test Markdown',
            t_displayName: {
                zh_cn: '测试 Markdown',
                en: 'Test Markdown'
            },
            t_description: {
                zh_cn: markdown_cn,
                en: markdown_en
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        }
        pluginData.push(testMarkdown);

        //- 测试 boolean 类型
        let ifAblePlugin = {
            name: 'ifAblePlugin',
            data: true,
            type: 'boolean',
            displayName: 'If Able Plugin',
            description: 'If true, the plugin will be enabled',
            t_displayName: {
                zh_cn: '是否启用插件',
                en: 'Enable Plugin'
            },
            t_description: {
                zh_cn: '如果为真，插件将被启用',
                en: 'If true, the plugin will be enabled'
            },
            onChange: (value) => {
                console.log('ifAblePlugin changed:', value);
                ifAblePlugin.data = value;
                iManager.snack('ifAblePlugin changed:' + value);
                iManager.savePluginConfig();
            }
        };
        pluginData.push(ifAblePlugin);

        //- 测试 path 类型
        let modLoaderPath = {
            name: 'modLoaderPath',
            data: '',
            type: 'dir',
            displayName: 'Mod Loader Path',
            description: 'The path of the mod loader',
            t_displayName: {
                zh_cn: 'Mod Loader 路径',
                en: 'Mod Loader Path'
            },
            t_description: {
                zh_cn: 'Mod Loader 的路径',
                en: 'The path of the mod loader'
            },
            onChange: (value) => {
                console.log('modLoaderPath changed:', value);
                modLoaderPath.data = value;
                iManager.snack('Mod Loader Path changed:' + value);
                iManager.savePluginConfig();
            }
        }
        pluginData.push(modLoaderPath);

        //- 测试 number 类型
        let testNumber = {
            name: 'testNumber',
            data: 0,
            type: 'number',
            displayName: 'Test Number',
            description: 'Test Number',
            t_displayName: {
                zh_cn: '测试数字',
                en: 'test Number'
            },
            t_description: {
                zh_cn: '测试数字',
                en: 'test Number'
            },
            onChange: (value) => {
                console.log('testNumber changed:', value);
                testNumber.data = value;
            }
        }
        pluginData.push(testNumber);

        //- 测试 button 类型
        let testButton = {
            name: 'testButton',
            type: 'button',
            displayName: 'Test Button',
            description: 'Test Button',
            t_displayName: {
                zh_cn: '测试按钮',
                en: 'Test Button'
            },
            t_description: {
                zh_cn: '测试按钮',
                en: 'Test Button'
            },
            buttonName: 'Test Button',
            t_buttonName: {
                zh_cn: '测试按钮',
                en: 'Test Button'
            },
            onChange: (value) => {
                iManager.snack('Test Button Clicked');
            }
        }
        pluginData.push(testButton);

        //- 测试 iconbutton 类型
        let testIconButton = {
            name: 'testIconButton',
            type: 'iconbutton',
            displayName: 'Test IconButton',
            description: 'Test IconButton',
            t_displayName: {
                zh_cn: '测试图标按钮',
                en: 'Test IconButton'
            },
            t_description: {
                zh_cn: '测试图标按钮',
                en: 'Test IconButton'
            },
            icon: `  <svg viewBox="0 -960 960 960">
    <path d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z"></path>
  </svg>`,
            buttonName: 'Test IconButton',
            t_buttonName: {
                zh_cn: '测试图标',
                en: 'Test Icon'
            },
            onChange: (value) => {
                iManager.snack('Test IconButton Clicked');
            }
        }
        pluginData.push(testIconButton);

        //- 测试 select 类型
        let testSelect = {
            name: 'testSelect',
            data: 'a',
            type: 'select',
            displayName: 'Test Select',
            description: 'Test Select',
            t_displayName: {
                zh_cn: '测试选择',
                en: 'Test Select'
            },
            t_description: {
                zh_cn: '测试选择',
                en: 'Test Select'
            },
            options: [{
                value: 'a',
                t_value: {
                    zh_cn: '选项A',
                    en: 'Option A'
                }
            },
            {
                value: 'b',
                t_value: {
                    zh_cn: '选项B',
                    en: 'Option B'
                }
            }],
            onChange: (value) => {
                console.log('testSelect changed:', value);
                iManager.snack('Test Select changed: ' + value);
            }
        }
        pluginData.push(testSelect);

        iManager.registerPluginConfig(pluginName, pluginData);
    }
}