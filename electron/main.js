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
// console.log('process', process);

let firstpage = false;
firstpage = process.argv.includes('--firstpage');
console.log('firstpage', firstpage);

let switchConfig = false;
switchConfig = process.argv.includes('--switchConfig');
console.log('switchConfig', switchConfig);

let devTools = false;
devTools = process.argv.includes('--devTools');
console.log('devTools', devTools);

let ifCustomConfig = false;
ifCustomConfig = process.argv.includes('--customConfig');
console.log('customConfig', ifCustomConfig);
// customConfig 获取一个配置文件路径
let customConfigFolder = '';
if (ifCustomConfig) {
  const index = process.argv.indexOf('--customConfig');
  customConfigFolder = process.argv[index + 1];
  console.log('customConfigFolder', customConfigFolder);

  setCustomConfigFolder(customConfigFolder);
}

// 渲染进程获取参数
ipcMain.handle('get-args', async () => {
  return {
    devMode: devMode,
    firstpage: firstpage,
    switchConfig: switchConfig,
    devTools: devTools,
    ifCustomConfig: ifCustomConfig,
    customConfigFolder: customConfigFolder
  }
});

// 获取参数的同步版本
ipcMain.on('get-args-sync', (event) => {
  //debug
  console.log('get-args-sync', {
    devMode: devMode,
    firstpage: firstpage,
    switchConfig: switchConfig,
    devTools: devTools,
    ifCustomConfig: ifCustomConfig,
    customConfigFolder: customConfigFolder
  });
  event.returnValue = {
    devMode: devMode,
    firstpage: firstpage,
    switchConfig: switchConfig,
    devTools: devTools,
    ifCustomConfig: ifCustomConfig,
    customConfigFolder: customConfigFolder
  }
});

ipcMain.on("set-custom-config-folder", (event, folder) => {
  console.log("set-custom-config-folder", folder);
  // 设置配置文件夹路径
  ifCustomConfig = true;
  customConfigFolder = folder;
  // 设置配置文件夹路径
  setCustomConfigFolder(folder);
});


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

  currentMainWindow.on("blur", () => {
    console.debug("window blur");
    currentMainWindow.webContents.send('windowBlur')
  });

  currentMainWindow.on("focus", () => {
    console.debug("window focus");
    currentMainWindow.webContents.send('windowFocus')
  });


  //debug
  console.log('===== createWindow =====');
  //mainWindow.loadFile(path.resolve(__dirname,"../dist/index.html"))

  // 加载 index.html(这里不管是什么路径，都是相对于你的项目根目录的路径)
  //mainWindow.loadFile('./electron/index.html')
  // 因为现在是 使用 vite + vue3 开发的，所以这里加载的是 vite 启动的地址
  if (devMode) {
    mainWindow.loadURL('http://localhost:3000/')
    if (firstpage) {
      mainWindow.loadURL('http://localhost:3000/firstLoad/index.html')
    }
    if (switchConfig) {
      mainWindow.loadURL('http://localhost:3000/switchConfig/index.html')
    }
    if (devTools) {
      mainWindow.webContents.openDevTools()
    }
  }
  else {
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
  // setTimeout(() => {
  //   console.log('===== createWindow end =====');
  //   wakeUpCondition ++;
  //   if (wakeUpCondition > 1) {
  //     sendWakeUp()
  //   }
  // }, 1000);

  console.log('===== createWindow end =====');
  wakeUpCondition++;
  console.log('wakeUp condition count', wakeUpCondition);
  if (wakeUpCondition == wakeUpNeeds) {
    sendWakeUp()
  }
})

let wakeUpCondition = 0;
const wakeUpNeeds = 2; // 需要唤醒的次数

function sendWakeUp() {
  if (currentMainWindow) {
    //debug
    console.log('send wakeUp', currentMainWindow == null);
    // 向主窗口发送消息，告诉它可以开始工作了
    currentMainWindow.webContents.send('wakeUp')
  }
}

// 监听主窗口是否准备好
ipcMain.on('main-window-ready', (event) => {
  console.log('main-window-ready', currentMainWindow == null);
  wakeUpCondition++;
  console.log('wakeUp condition count', wakeUpCondition);
  if (wakeUpCondition == wakeUpNeeds) {
    sendWakeUp()
  }
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态, 
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 白屏意味着渲染进程崩溃了，这里可以尝试重启
app.on('web-contents-created', (e, contents) => {
  contents.on('crashed', () => {
    if (!contents.isDestroyed()) {
      contents.reload();
    }
  });
});

app.on("render-process-gone", (e, webContents, details) => {
  console.log("render-process-gone", details);
  if (!webContents.isDestroyed()) {
    webContents.reload();
  }
});


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
  else {
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

ipcMain.handle('pin-window', async () => {
  const win = BrowserWindow.getFocusedWindow();
  win.setAlwaysOnTop(true);
  //debug
  console.log('pin-window', win.isAlwaysOnTop());
  return true;
});

ipcMain.handle('unpin-window', async () => {
  const win = BrowserWindow.getFocusedWindow();
  win.setAlwaysOnTop(false);
  //debug
  console.log('unpin-window', win.isAlwaysOnTop());
  return false;
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