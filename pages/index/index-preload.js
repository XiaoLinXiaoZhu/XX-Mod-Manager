const { ipcRenderer, remote } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
// 获取是否是第一次打开

window.platform = os.platform();