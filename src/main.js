import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import test_app from './test/test_app.vue'
import 'sober'
//npm
import 'sober/style/scroll-view.css'
import { Snackbar } from 'sober'
const { ipcRenderer} = require('electron');

//-====================入口文件====================-//
createApp(test_app).mount('#app')




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
