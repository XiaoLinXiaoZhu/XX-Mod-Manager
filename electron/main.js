// main.js
const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('node:path')
require('./fileSystem.js')
const setMainWindow = require('./fileSystem.js').setMainWindow;
const setCustomConfigFolder = require('./fileSystem.js').setCustomConfigFolder;
let currentMainWindow;

let devMode = false;
devMode = process.argv.includes('--dev');
console.log('process.argv', process.argv);

let firstpage = false;
firstpage = process.argv.includes('--firstpage');
console.log('firstpage', firstpage);

let switchConfig = false;
switchConfig = process.argv.includes('--switchConfig');
console.log('switchConfig', switchConfig);

let devTools = false;
devTools = process.argv.includes('--devTools');
console.log('devTools', devTools);

let customConfig = false;
customConfig = process.argv.includes('--customConfig');
console.log('customConfig', customConfig);
// customConfig 获取一个配置文件路径
let customConfigFolder = '';
if(customConfig){
  const index = process.argv.indexOf('--customConfig');
  customConfigFolder = process.argv[index + 1];
  console.log('customConfigFolder', customConfigFolder);

  setCustomConfigFolder(customConfigFolder);
}


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

  //-==================== 监听窗口显隐 ====================
// currentMainWindow.on("minimize",()=>{
//   console.debug("window minimize");
// });

// currentMainWindow.on("restore",()=>{
//   console.debug("window restore");
// });

currentMainWindow.on("blur",()=>{
  console.debug("window blur");
  currentMainWindow.webContents.send('windowBlur')
});

currentMainWindow.on("focus",()=>{
  console.debug("window focus");
  currentMainWindow.webContents.send('windowFocus')
});


  //debug
  console.log('===== createWindow =====');
  //mainWindow.loadFile(path.resolve(__dirname,"../dist/index.html"))

  // 加载 index.html(这里不管是什么路径，都是相对于你的项目根目录的路径)
  //mainWindow.loadFile('./electron/index.html')
  // 因为现在是 使用 vite + vue3 开发的，所以这里加载的是 vite 启动的地址
  if(devMode){
    mainWindow.loadURL('http://localhost:3000/')
    if(firstpage){
      mainWindow.loadURL('http://localhost:3000/firstLoad/index.html')
    }
    if(switchConfig){
      mainWindow.loadURL('http://localhost:3000/switchConfig/index.html')
    }
    if(devTools){
      mainWindow.webContents.openDevTools()
    }
  }
  else{
    mainWindow.loadFile('dist/index.html')
  }

  // 打开开发工具
  //mainWindow.webContents.openDevTools()
  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false)

  //因为需要调整窗口大小，所以需要等待窗口加载完成
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('main window is ready');
  });
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

//-==================== 新窗口 ====================
ipcMain.on('open-new-window', (event, arg) => {
  console.log('open-new-window', arg);

  const newWindow = new BrowserWindow({
    frame: false,
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





//-==================== 窗口控制 ====================

ipcMain.on('refresh-main-window', (event) => {
  currentMainWindow.reload()
});

ipcMain.handle('minimize-window', async () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.handle('maximize-window', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win.isMaximized()) {
    win.unmaximize();
  }
  else {
    win.maximize();
  }
});

ipcMain.handle('close-window', async () => {
  BrowserWindow.getFocusedWindow().close();
});

ipcMain.handle('toggle-fullscreen', async () => {
  //窗口化全屏
  const win = BrowserWindow.getFocusedWindow();
  if (win.isFullScreen()) {
    win.setFullScreen(false);
    return false;
  }
  else {
    win.setFullScreen(true);
    return true;
  }
});


// 设置窗口大小
ipcMain.handle('set-bounds', async (event, boundsStr) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const bounds = JSON.parse(boundsStr);
    //debug
    console.log('set-bounds', bounds, win == null);

    if (win && bounds) {
      const screenArea = screen.getDisplayMatching(bounds).workArea;

      // 如果bounds的x,y，为-1，表示居中
      if (bounds.x === -1 || bounds.y === -1) {
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        //debug
        console.log('set-bounds', { x: x, y: y, width: width, height: height });
        win.setBounds({ x: x, y: y, width: width, height: height });
      }
      else
       if (
        (bounds.x + bounds.width) > (screenArea.x + screenArea.width) ||
        bounds.x > (screenArea.x + screenArea.width) ||
        bounds.x < screenArea.x ||
        (bounds.y + bounds.height) > (screenArea.y + screenArea.height) ||
        bounds.y > (screenArea.y + screenArea.height) ||
        bounds.y < screenArea.y
      ) {
        // Fit and center window into the existing screenarea
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        //debug
        console.log('set-bounds', { x: x, y: y, width: width, height: height });
        win.setBounds({ x: x, y: y, width: width, height: height });
      }
      else {
        win.setBounds(bounds);
      }
    }
  } catch (e) {
    console.error('set-bounds', e);
  }
});











//-==================== 通知 ====================
ipcMain.on('snack', (event, message, type = 'info') => {
  currentMainWindow.webContents.send('snack', message, type)
})






module.exports = {
  currentMainWindow,
  getMainWindow: () => {
    return currentMainWindow
  }
}