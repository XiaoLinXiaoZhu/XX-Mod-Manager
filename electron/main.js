// main.js
const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('node:path')
require('./fileSystem.js')
const setMainWindow = require('./fileSystem.js').setMainWindow

let currentMainWindow;

let devMode = false;
devMode = process.argv.includes('--dev');
console.log('process.argv', process.argv);

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      //preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  // 因为这里使用了 nodeIntegration: true, contextIsolation: false
  // 所以可以直接使用 node.js 的模块
  // 也就不需要 preload.js 了

  currentMainWindow = mainWindow;
  setMainWindow(mainWindow);


  
  //debug
  console.log('===== createWindow =====');
  if(devMode){
    mainWindow.loadURL('http://localhost:3000/')
  }
  else{
    mainWindow.loadFile('dist/index.html')
  }

    //mainWindow.loadFile(path.resolve(__dirname,"../dist/index.html"))

  // 加载 index.html(这里不管是什么路径，都是相对于你的项目根目录的路径)
  //mainWindow.loadFile('./electron/index.html')
  // 因为现在是 使用 vite + vue3 开发的，所以这里加载的是 vite 启动的地址
  

  
  // 打开开发工具
  //mainWindow.webContents.openDevTools()
  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false)
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  //! 这里因为 vite 的热更新问题，它的服务器 需要 先加载完毕，才能加载 electron 的窗口
  //! 按理来说应该寻找一个更好的解决方案，而不是这样延迟加载
  setTimeout(() => {
    console.log('===== createWindow end =====');
    currentMainWindow.webContents.send('wakeUp')
  }, 1000);
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态, 
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 在当前文件中你可以引入所有的主进程代码
// 也可以拆分成几个文件，然后用 require 导入。



// ipcRenderer.send('open-new-window', 'tapePage');
ipcMain.on('open-new-window', (event, arg) => {
  console.log('open-new-window', arg);

  const newWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // newWindow.loadURL('http://localhost:3000/' + arg)
  if (devMode) {
    newWindow.loadURL('http://localhost:3000/' + arg + '/index.html')
  }
  else{
    const path = require('path');
    const filePath = path.join(__dirname, `../dist/${arg}/index.html`);
    console.log('filePath', filePath);

    newWindow.loadFile(filePath)
  }

  //newWindow.webContents.openDevTools()
})

ipcMain.on('refresh-main-window', (event) => {
  currentMainWindow.reload()
});


ipcMain.on('snack', (event, message, type = 'info') => {
  currentMainWindow.webContents.send('snack', message, type)
})






module.exports = {
  currentMainWindow,
  getMainWindow: () => {
    return currentMainWindow
  }
}