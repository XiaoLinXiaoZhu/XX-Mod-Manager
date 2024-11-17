import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')


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