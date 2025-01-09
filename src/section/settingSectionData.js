// 因为 使用 了 统一的 settingBar 结构，所以说不再需要 一个个的写 settingBar 的数据了
// settingSection.vue 直接 import settingBarData from './settingSectionData.js' 即可
// 会在这里 定义 settingBar 的 需要显示的 配置项

// data 为一个对象，包含了插件的可配置数据，比如说是否启用，是否显示等等
// 它会被 解析 之后 在 设置页面 中显示，并且为 插件提供数据
// 当它发生变化时，会触发 插件的 onChange 方法

// 在这里 将 程序原本的核心程序 视作一个 特殊的插件

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
import IManager from "../../electron/IManager";
const iManager = new IManager();



//- ========================== 常规设置 ========================== -//
function getData() {
    //-------------------- 语言 ------------------//
    let languageData = {
        name: 'language',
        data: iManager.config.language,
        type: 'select',
        displayName: 'Language',
        description: '',
        t_displayName: {
            zh_cn: '语言',
            en: 'Language'
        },
        options: [{
            value: 'en',
            t_value: {
                zh_cn: 'English',
                en: 'English'
            }
        },
        {
            value: 'zh_cn',
            t_value: {
                zh_cn: '简体中文',
                en: '简体中文'
            }
        }
        ],
        onChange: (value) => {
            console.log('language changed:', value);
            iManager.setLanguage(value);
        }
    }
    //-------------------- 主题 ------------------//
    let themeData = {
        name: 'theme',
        data: iManager.config.theme,
        type: 'select',
        displayName: 'Theme',
        description: '',
        t_displayName: {
            zh_cn: '主题',
            en: 'Theme'
        },
        options: [{
            value: 'auto',
            t_value: {
                zh_cn: '自动',
                en: 'Auto'
            }
        },
        {
            value: 'dark',
            t_value: {
                zh_cn: '暗色',
                en: 'Dark'
            }
        },
        {
            value: 'light',
            t_value: {
                zh_cn: '亮色',
                en: 'Light'
            }
        }
        ],
        onChange: (value) => {
            console.log('theme changed:', value);
            iManager.setTheme(value);
        }
    }
    //-------------------- 模组目标文件夹 ------------------//
    let modTargetPathData = {
        name: 'modTargetPath',
        data: iManager.config.modTargetPath,
        type: 'dir',
        displayName: 'Mod Target Path',
        description: 'The path of the mod target',
        t_displayName: {
            zh_cn: 'mod 目标文件夹',
            en: 'Mod Target Folder'
        },
        t_description: {
            zh_cn: 'mod目标文件夹为modLoader读取mod的位置，一般为Mods文件夹',
            en: 'Mod target directory is the location where modLoader reads mod, usually the Mods folder'
        },
        onChange: (value) => {
            console.log('modTargetPath changed:', value);
            iManager.setConfig('modTargetPath', value);
        }
    }
    //-------------------- 模组源文件夹 ------------------//
    let modSourcePathData = {
        name: 'modSourcePath',
        data: iManager.config.modSourcePath,
        type: 'dir',
        displayName: 'Mod Source Path',
        description: 'The path of the mod source',
        t_displayName: {
            zh_cn: 'mod来源文件夹',
            en: 'Mod Source Folder'
        },
        t_description: {
            zh_cn: 'mod来源文件夹为程序存储mod的位置，当mod被启用时，会从这里创建链接到mod目标文件夹。',
            en: 'Mod Source directory is the location where the program stores mod. When the mod is enabled, a link will be created from here to the mod target directory.'
        },
        onChange: (value) => {
            console.log('modSourcePath changed:', value);
            iManager.setConfig('modSourcePath', value);
        }
    }
    //-------------------- 预设文件夹 ------------------//
    let presetPathData = {
        name: 'presetPath',
        data: iManager.config.presetPath,
        type: 'dir',
        displayName: 'Preset Path',
        description: 'The path of the preset',
        t_displayName: {
            zh_cn: '预设文件夹',
            en: 'Preset Folder'
        },
        t_description: {
            zh_cn: '预设文件夹为存储预设的位置，预设是一组mod的集合，可以通过预设一键启用多个mod',
            en: 'The preset path is the location where the preset is stored. The preset is a collection of mods that can be enabled with one click.'
        },
        onChange: (value) => {
            console.log('presetPath changed:', value);
            iManager.setConfig('presetPath', value);
        }
    }

    //-------------------- 初始化所有数据的按钮 ------------------//
    let initAllDataButton = {
        name: 'initAllData',
        type: 'button',
        displayName: 'Init All Data',
        description: 'Initialize all data',
        t_displayName: {
            zh_cn: '初始化所有数据',
            en: 'Init All Data'
        },
        t_description: {
            zh_cn: '初始化所有数据',
            en: 'Initialize all data'
        },
        buttonName: 'Init All Data',
        t_buttonName: {
            zh_cn: '初始化所有数据',
            en: 'Init All Data'
        },
        onChange: () => {
            iManager.initAllData();
        }
    }

    //-------------------- 打开 firstLoad 页面的按钮 ------------------//
    let openFirstLoadButton = {
        name: 'openFirstLoad',
        type: 'iconbutton',
        displayName: 'Open First Load',
        description: 'Open First Load',
        t_displayName: {
            zh_cn: '新手引导',
            en: 'New User Guide'
        },
        t_description: {
            zh_cn: '打开 新手引导 页面',
            en: 'Open New User Guide Page'
        },
        buttonName: 'First Load',
        t_buttonName: {
            zh_cn: '打开 新手引导',
            en: 'Open New User Guide'
        },
        onChange: () => {
            iManager.openNewWindow('firstLoad');
            iManager.config.firstLoad = true;
        }
    }
    return {
        languageData, themeData, modTargetPathData, modSourcePathData, presetPathData, initAllDataButton, openFirstLoadButton
    }
}


export default getData;
