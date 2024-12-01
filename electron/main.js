// main.js
const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('node:path')
require('./fileSystem.js')
const setMainWindow = require('./fileSystem.js').setMainWindow

let currentMainWindow;

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
  let devMode = false;
  console.log('process.argv', process.argv);
  
  devMode = process.argv.includes('--dev');

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
  


  mainWindow.webContents.send('snack', 'hello from main.js')
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

  newWindow.loadURL('http://localhost:3000/' + arg)

  newWindow.webContents.openDevTools()
})


ipcMain.on('snack', (event, message, type = 'info') => {
  currentMainWindow.webContents.send('snack', message, type)
})






module.exports = {
  currentMainWindow,
  getMainWindow: () => {
    return currentMainWindow
  }
}