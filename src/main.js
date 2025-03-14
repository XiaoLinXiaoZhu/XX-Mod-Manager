import { createApp, watch } from 'vue'
import './style.css'
import test_app from './test/test_app.vue'
import 'sober'
//npm
import 'sober/style/scroll-view.css'
import { Snackbar } from 'sober'
const { ipcRenderer} = require('electron');
import IManager from '../electron/IManager'
const iManager = new IManager();
import { g_config_vue } from '../electron/IManager'

import { EventSystem } from '../helper/EventSystem'

//-====================入口文件====================-//
const vue_app = createApp(test_app);

//-====================国际化====================-//
import { createI18n } from 'vue-i18n';

// 导入语言包
import en from './locales/en.json';
import zh_cn from './locales/zh-cn.json';

// 创建i18n实例
const i18n = createI18n({
  locale: 'en', // 设置默认语言
  fallbackLocale: 'zh_cn', // 设置回退语言
  legacy: false,
  messages: {
    en,
    zh_cn,
  },
});

// 使用i18n插件
vue_app.use(i18n);
iManager.i18n = i18n;
//-==================== 挂载 ====================-//

vue_app.mount('#app');

// ------------------ 语言切换 ------------------ //
vue_app.config.globalProperties.$i18n.locale = `zh_cn`;
const language = g_config_vue.language;
watch(language, (newVal) => {
    vue_app.config.globalProperties.$i18n.locale = newVal;
    console.log('languageChange:', newVal);
});


// ------------------ first load ------------------ //
// 首次打开时打开 初始化窗口
// iManager.snack('first load : '+iManager.config.firstLoad);
EventSystem.on('wakeUp', () => {
    iManager.snack('first load : '+iManager.config.firstLoad);
    console.log('❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️\nfist load:', iManager.config.firstLoad);
    if (iManager.config.firstLoad) {
        // debug 
        console.log('ℹ️ first load');
        iManager.snack('ℹ️ first load');
        iManager.openNewWindow('firstLoad');
    }
});

// ------------------ 初始化 ------------------ //
// iManager.waitInit().then((iManager) => {
//     // 手动触发一次语言切换事件
//     EventSystem.trigger('languageChange', iManager.config.language);
// })

//-=====================事件监听====================-//
// console.log('main.js');

document.addEventListener('DOMContentLoaded', () => {
    // 开启 了 nodeIntegration: true, contextIsolation: false
    // 所以可以直接使用 node.js 的模块

    // 获取 process 对象
    const process = window.process;

    // 获取 node.js 的版本信息
    const nodeVersion = process.versions.node;

    // console.log('DOMContentLoaded' + nodeVersion);
})

//-=======禁用 tab 切换焦点=======-//
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
    }
})



//-======================== snack ========================-//
ipcRenderer.on('snack', (event, message,type = 'info') => {
    console.log(`snack:${message} type:${type}`);
    switch (type) {
        case 'info':
            Snackbar.show({
                text: message,
                align: 'top',
                duration: 2000
            })
            break;
        case 'error':
            Snackbar.show({
                text: message,
                align: 'top',
                type: 'error'
            })
            break;
        default:
            Snackbar.show({
                text: message,
                align: 'top'
            })
            break;
        }
})

//-======================== 窗口关闭时，保存配置 ========================-//

window.onbeforeunload = function (e) {
    // console.log('onbeforeunload');
    iManager.config.bounds = {
        x: window.screenX,
        y: window.screenY,
        width: window.outerWidth,
        height: window.innerHeight,
    };

    iManager.config.lastUsedPreset = iManager.temp.currentPreset;

    console.log('window unload');

    if (iManager.config.firstLoad) return;
    if (iManager.temp.ifDontSaveOnClose) return;

    console.log('save config');
    iManager.saveConfigSync();
    iManager.savePluginConfigSync();

    // e.returnValue = "你确定要离开吗？";
    // return "你确定要离开吗？";
};