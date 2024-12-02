import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import test_app from './test/test_app.vue'
import 'sober'
//npm
import 'sober/style/scroll-view.css'
import { Snackbar } from 'sober'
const { ipcRenderer} = require('electron');
import IManager from '../electron/IManager'
const iManager = new IManager();

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

//-==================== 挂载 ====================-//

vue_app.mount('#app');
iManager.waitInit().then((iManager) => {
    iManager.on('languageChange', (language) => {
        // 将语言设置为 imanager 中的语言
        vue_app.config.globalProperties.$i18n.locale = language;
        //debug
        console.log('set language:', language);
    });

    iManager.trigger('languageChange', iManager.config.language);
})


//-=====================事件监听====================-//
console.log('main.js');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    // // 获取 preload.js 暴露的 electronAPI 对象
    // const electronAPI = window.electronAPI;
    // console.log(electronAPI.version);
    

    // 开启 了 nodeIntegration: true, contextIsolation: false
    // 所以可以直接使用 node.js 的模块

    // 获取 process 对象
    const process = window.process;

    // 获取 node.js 的版本信息
    const nodeVersion = process.versions.node;
    console.log(nodeVersion);
})



ipcRenderer.on('snack', (event, message,type = 'info') => {
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
})