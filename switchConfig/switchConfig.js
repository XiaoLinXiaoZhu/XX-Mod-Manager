import 'sober'
import 'sober/style/scroll-view.css'
import { Snackbar } from 'sober'

import '../src/style.css'

import { createApp } from 'vue'
import switchConfigPage from './src/switchConfigPage.vue'

const { ipcRenderer} = require('electron');

import IManager from '../electron/IManager'
const iManager = new IManager();

//-=================== 旧的导入 ===================-//
const path = require('path');
const fs = require('fs');
const { shell } = require("electron");

//-====================入口文件====================-//
const vue_app = createApp(switchConfigPage);

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
iManager.on('languageChange', (language) => {
    // 将语言设置为 imanager 中的语言
    vue_app.config.globalProperties.$i18n.locale = language;
    //debug
    console.log('set language:', language);
});

iManager.waitInit().then((iManager) => {

    // ------------------ 语言切换 ------------------ //
    iManager.trigger('languageChange', iManager.config.language);

    // ------------------ first load ------------------ //
    // 首次打开时打开 初始化窗口
    // 已经初始化了
    iManager.config.firstLoad = false;
})


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
