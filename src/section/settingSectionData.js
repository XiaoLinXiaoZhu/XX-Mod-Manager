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
        iManager.trigger('languageChange', value);
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
//-------------------- 模组目标路径 ------------------//
let modTargetPathData = {
    name: 'modTargetPath',
    data: '',
    type: 'path',
    displayName: 'Mod Target Path',
    description: 'The path of the mod target',
    t_displayName: {
        zh_cn: '模组目标路径',
        en: 'Mod Target Path'
    },
    t_description: {
        zh_cn: '模组目标的路径',
        en: 'The path of the mod target'
    },
    onChange: (value) => {
        console.log('modTargetPath changed:', value);
        iManager.setConfig('modTargetPath', value);
    }
}
//-------------------- 模组源路径 ------------------//
let modSourcePathData = {
    name: 'modSourcePath',
    data: '',
    type: 'path',
    displayName: 'Mod Source Path',
    description: 'The path of the mod source',
    t_displayName: {
        zh_cn: '模组源路径',
        en: 'Mod Source Path'
    },
    t_description: {
        zh_cn: '模组源的路径',
        en: 'The path of the mod source'
    },
    onChange: (value) => {
        console.log('modSourcePath changed:', value);
        iManager.setConfig('modSourcePath', value);
    }
}
//-------------------- 预设路径 ------------------//
let presetPathData = {
    name: 'presetPath',
    data: '',
    type: 'path',
    displayName: 'Preset Path',
    description: 'The path of the preset',
    t_displayName: {
        zh_cn: '预设路径',
        en: 'Preset Path'
    },
    t_description: {
        zh_cn: '预设的路径',
        en: 'The path of the preset'
    },
    onChange: (value) => {
        console.log('presetPath changed:', value);
        iManager.setConfig('presetPath', value);
    }
}


export default {
    languageData, themeData, modTargetPathData, modSourcePathData, presetPathData
}
