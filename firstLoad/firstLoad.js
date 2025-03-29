import 'sober'
import 'sober/style/scroll-view.css'
import { Snackbar } from 'sober'

import '../src/style.css'

import { createApp, watch } from 'vue'
import firstLoadPage from './firstLoadPage.vue'

const { ipcRenderer} = require('electron');

import IManager from '../electron/IManager'
const iManager = new IManager();
import { g_config_vue } from '../electron/IManager'

//-=================== 旧的导入 ===================-//
const path = require('path');
const fs = require('fs');
const { shell } = require("electron");

//-====================入口文件====================-//
const vue_app = createApp(firstLoadPage);

//-====================国际化====================-//
import { createI18n } from 'vue-i18n';

// 导入语言包
import en from '../src/locales/en.json';
import zh_cn from '../src/locales/zh-cn.json';

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

//-==================== 挂载 ====================-//

vue_app.mount('#app-container');

const language = g_config_vue.language;
watch(language, (language) => {
    // 将语言设置为 imanager 中的语言
    vue_app.config.globalProperties.$i18n.locale = language;
    console.log('set language to:', language);
})

iManager.on("initDone", () => {
    // 手动触发一次语言切换事件
    vue_app.config.globalProperties.$i18n.locale = iManager.config.language;
    console.log('languageChange:', iManager.config.language);
}
);

// 每1s打印一次语言
setInterval(() => {
    console.log('language:', g_config_vue.language.value);
}, 1000);


//-=====================事件监听====================-//
console.log('main.js');

document.addEventListener('DOMContentLoaded', () => {
    

    // 开启 了 nodeIntegration: true, contextIsolation: false
    // 所以可以直接使用 node.js 的模块

    // 获取 process 对象
    const process = window.process;

    // 获取 node.js 的版本信息
    const nodeVersion = process.versions.node;

    // console.log('DOMContentLoaded' + nodeVersion);
})

window.addEventListener('beforeunload', () => {
    iManager.config.firstLoad = false;
    iManager.saveConfig();
    ipcRenderer.send('refresh-main-window');
});

//-======================== snackbar ========================-//
ipcRenderer.on('snack', (event, message,type = 'info') => {
    snack(message,type);
})

function snack(message, type = 'info') {
    console.log(`snack:${message} type:${type}`);
    switch (type) {
        case 'info':
            Snackbar.show({
                text: message,
                align: 'top'
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
}
