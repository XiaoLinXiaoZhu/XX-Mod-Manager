const { app, BrowserWindow, ipcMain, dialog, screen, ipcRenderer } = require('electron');
const fs = require('fs');
const { url } = require('inspector');
const { execFile } = require('child_process');
const path = require('path');
const shell = require('electron').shell;
const HMC = require("hmc-win32");
const os = require('os');
const { exec } = require('child_process');
const isMac = os.platform() === "darwin";
const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 实际上 ___dirname 是当前文件所在的目录,但是 最终的目标是要找到 modSource 的根文件夹，所以要找到这个文件夹的路径
// 通过 在第一次打开时询问 rootdir 来 确认文件保存的位置

// 国际化，但是我不会使用i18next，这里就直接自定义自己方法来实现国际化
// 通过传递一个json文件来实现国际化
// 需要的时候，通过读取json文件来显示对应的语言的内容


//-======================== 核心变量 ========================
let mainWindow = null;

//------------------状态变量------------------

let modRootDir = '';
let modSourceDIr = '';
let modLoaderDir = '';
let gameDir = '';
let ifUseAdmin = false;
let ifAutoStartGame = false;
let ifAskSwitchConfig = false;


let functionAfterSync = null;
let functionAfterSyncName = '';

let ifMainProcessReady = false;


// -===================== 主进程 =====================

// // 防止多开，如果已经有一个实例在运行，则将焦点切换到已经运行的实例，并关闭当前实例
// const gotTheLock = app.requestSingleInstanceLock();
// if (!gotTheLock) {
//   console.log('Another instance is running, focus the existing instance and close this instance');
//   app.quit();
// }
// else {
//   app.on('second-instance', (event, commandLine, workingDirectory) => {
//     const mainWindow = BrowserWindow.getAllWindows()[0];
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.focus();
//     }
//   });
// }

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});


// -===================== 窗口控制 =====================
//------------------- firstLoad -------------------
//首次打开时询问用户的默认设置的窗口
function openFirstLoadWindow() {
  //创建一个新的窗口
  const firstLoadWindow = new BrowserWindow({
    frame: false,
    width: 1080,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, 'pages/firstLoad/firstLoad-preload.js'),
      contextIsolation: false, // 启用 contextIsolation
      nodeIntegration: true,
      webSecurity: false,
    },
  });
  firstLoadWindow.setMenuBarVisibility(false);
  firstLoadWindow.loadFile('pages/firstLoad/firstLoad.html');
}

ipcMain.handle('open-first-load-window', async (event) => {
  openFirstLoadWindow();
});


//---------------------主窗口---------------------
//创建主窗口
function createMainWindow() {
  const newMainWindow = new BrowserWindow({
    setMenuBarVisibility: false,
    frame: false,
    show: false,
    width: 1050,
    height: 800,
    backgroundColor: '#1d1f1e',
    webPreferences: {
      // preload: path.join(__dirname, 'pages/index/index-preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false, // 不推荐使用
      webSecurity: false, // 允许加载跨域资源，生产环境中应谨慎使用
    },
  });

  mainWindow = newMainWindow;
  //隐藏菜单栏
  // app.on('browser-window-created', (e, window) => {
  //   window.setMenu(null);
  // });
  newMainWindow.loadFile('pages/tape/tapePage.html');

  //因为需要调整窗口大小，所以需要等待窗口加载完成
  newMainWindow.once('ready-to-show', () => {
    newMainWindow.show();
    newMainWindow.webContents.send('get-localStorage');
    console.log('main window is ready');
    init(newMainWindow);
  });
}

// -===================== 内部函数 =====================
//-------------------初始化-------------------
function init(currentWindow) {

  // 激活get-localStorage后，
  // 渲染进程 通过sync-localStorage 传递数据给主进程
  // 之后，需要根据这些值进行初始化

  const functionIfUseAdmin = () => {
    //为什么这里的ifUseAdmin是字符串……导致ifUseAdmin == true这个判断不成立
    if (ifUseAdmin == "true" && !HMC.isAdmin()) {
      //如果开启了 useAdmin，则需要以管理员模式重新启动
      // 通过管理员模式重新启动
      restartAsAdmin();
      return;
    }

    if (ifAskSwitchConfig == "true") {
      // 如果开启了 在开始时 询问是否切换配置
      // 则在获取新的配置之后再尝试启动游戏
      const functionCheckAutoStartGame = () => {
        //检查是否 开启了 autoStartGame
        console.log(`ifAutoStartGame: ${ifAutoStartGame}`);
        if (ifAutoStartGame == "true") {
          //启动游戏
          // 之后不再在渲染进程中启动游戏，而是在主进程中启动游戏
          startModLoader();
          startGame();
        }

        //告诉渲染进程，可以加载mod列表了
        ifMainProcessReady = true;
        currentWindow.webContents.send('main-process-inited');
      }
      setTimeout(() => {
        //debug
        console.log('open switch config dialog');
        functionAfterSync = functionCheckAutoStartGame;
        functionAfterSyncName = 'check auto start game after sync';
        //打开切换配置dialog，等待被激活sync-localStorage
        currentWindow.webContents.send('open-switch-config-dialog');
      }, 0);
    }
    else {
      //如果没有开启 在开始时 询问是否切换配置
      //直接根据当前配置启动游戏
      console.log(`ifAutoStartGame: ${ifAutoStartGame}`);
      if (ifAutoStartGame == "true") {
        //启动游戏
        startModLoader();
        startGame();
      }

      //告诉渲染进程，可以加载mod列表了
      ifMainProcessReady = true;
      currentWindow.webContents.send('main-process-inited');
    }
  }

  functionAfterSync = functionIfUseAdmin;
  functionAfterSyncName = 'check if use admin after sync';
  // 通过主窗口设置渲染进程的rootdir
  currentWindow.webContents.send('get-localStorage');
}


//-------------------功能函数-------------------
function moveDirectory(from, dest) {
  let ret = '';
  //将Mods文件夹里面的文件夹移动到modSource文件夹
  fs.readdirSync(from).forEach(file => {
    //如果说，文件夹已经存在于modSource文件夹中，提示用户存在冲突，稍后可以在主页面中手动处理
    if (fs.existsSync(path.join(dest, file))) {
      ret = `detect file already exist in ${dest},you can handle it later`;
      ret += `\nconflict:${file}`;
      return;
    }
    fs.cpSync(path.join(from, file), path.join(dest, file), { recursive: true });
    //删除Mods文件夹里面的文件夹
    fs.rmSync(path.join(from, file), { recursive: true, force: true });
  });

  return ret;
}


// -===================== 对外接口 =====================

//------------------移动文件夹------------------
ipcMain.handle('auto-move-mod', async (event) => {
  let ret = '';

  if (!fs.existsSync(modSourceDIr)) {
    //console.log("modSource don't exist,create it");
    fs.mkdirSync(modSourceDIr);
    ret = 'modSource don\'t exist,succeed to create it,your mods have been moved to modSource';
  }
  else {
    ret = 'modSource exist,your mods have been moved to modSource';
  }

  //将Mods文件夹里面的文件夹移动到modSource文件夹
  ret = moveDirectory(modRootDir, modSourceDIr);
  return ret;
});

//-------------------获取翻译-------------------
ipcMain.handle('get-translate', async (event, lang) => {
  // 读取对应的json文件，文件位于locales文件夹下,文件名为lang.json
  const langDir = path.join(__dirname, 'locales');
  const langPath = path.join(langDir, `${lang}.json`);
  if (fs.existsSync(langPath)) {
    return JSON.parse(fs.readFileSync(langPath));
  }
  else {
    return {};
  }
});


//-------------------获取主进程是否准备好-------------------
ipcMain.handle('get-main-process-ready', async (event) => {
  return ifMainProcessReady;
});


//------------------同步localStorage------------------
ipcMain.handle('sync-localStorage', async (event, userConfig) => {
  //读取userConfig中的各个值，将主进程的值设置为userConfig中的值
  modRootDir = userConfig.modRootDir;
  modSourceDIr = userConfig.modSourceDIr;
  modLoaderDir = userConfig.modLoaderDir;
  gameDir = userConfig.gameDir;
  ifUseAdmin = userConfig.ifUseAdmin;
  ifAutoStartGame = userConfig.ifAutoStartGame;
  ifAskSwitchConfig = userConfig.ifAskSwitchConfig;

  //debug
  console.log(`[${new Date().toLocaleTimeString()}] success to sync localStorage`);

  //检查是否 开启了 useAdmin
  // //debug
  // console.log(ifUseAdmin);
  // //打印一下ifUseAdmin的类型
  // console.log(typeof ifUseAdmin);
  // console.log(`ifUseAdmin: ${ifUseAdmin}, isAdmin: ${HMC.isAdmin()}`);
  // console.log("!HMC.isAdmin: " + !HMC.isAdmin());
  // console.log("ifUseAdmin == true: " + ifUseAdmin == "true");
  // console.log("!HMC.isAdmin() && ifUseAdmin == true: " + (!HMC.isAdmin() && ifUseAdmin == true));

  if (functionAfterSync != null) {
    //debug
    console.log(`run functionAfterSync: ${functionAfterSyncName}`);
    functionAfterSync();

    //清空functionAfterSync
    functionAfterSync = null;
    functionAfterSyncName = 'null';
  }
}
);

// -====================== 提供方法 ======================

//-------------------文件选择-------------------
ipcMain.handle('get-file-path', async (event, fileName, fileType) => {
  //通过文件选择对话框选择文件
  let result;
  if (fileType == 'directory') {
    result = await dialog.showOpenDialog({
      title: 'Select ' + fileName,
      properties: ['openDirectory']
    });
  }
  else if (fileType == 'image') {
    result = await dialog.showOpenDialog({
      title: 'Select ' + fileName,
      properties: ['openFile'],
      filters: [
        { name: fileName, extensions: ['jpg', 'png', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'] }
      ]
    });
  }
  else {
    result = await dialog.showOpenDialog({
      title: 'Select ' + fileName,
      properties: ['openFile'],
      filters: [
        { name: fileName, extensions: [fileType] }
      ]
    });
  }

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return '';
}
);


ipcMain.handle('get-mods', async () => {
  //增加纠错
  if (modRootDir === '') {
    //console.log("rootdir is empty");
    modRootDir = __dirname;
  }
  if (!fs.existsSync(modSourceDIr)) {
    //console.log("modSource not found");
    return [];
  }
  //debug
  //console.log(`get-mods rootdir: ${rootdir}`);
  const modDir = path.join(modSourceDIr);
  const mods = fs.readdirSync(modDir).filter(file => fs.statSync(path.join(modDir, file)).isDirectory());
  //输出mods
  //console.log(`load mods in ${modDir}: ${mods}`);
  return mods;
});

//-------------------获取mod信息-------------------

function dealIniFile(iniPath) {
  const lines = fs.readFileSync(iniPath, 'utf-8').split('\n');
  let keyswap = [];
  let flag = false;
  lines.forEach(line => {
    //debug
    //console.log(line);
    if (line.startsWith('[KeySwap') || line.startsWith('[[KeyGlow')) {
      flag = true;
      //debug
      //console.log(`find [KeySwap]`);
      return;
    }
    if (!flag) {
      return;
    }
    if (line.startsWith('[')) {
      flag = false;
      return;
    }
    let key = '';
    //匹配 key = xxx 或 key=xxx 或 back = xxx
    if (line.startsWith('key =') && line.length > 6) {
      key = line.slice(6).trim();
    }
    if (line.startsWith('key=') && line.length > 5) {
      key = line.slice(5).trim();
    }
    if (line.startsWith('back = ') && line.length > 7) {
      key = line.slice(7).trim();
    }


    if (key === '') {
      return;
    }
    let add = '';
    // 因为这里的key是代码，将其转化为单个字符可读性会更好
    switch (key) {
      case 'VK_UP': add = '↑'; break;
      case 'VK_DOWN': add = '↓'; break;
      case 'VK_LEFT': add = '←'; break;
      case 'VK_RIGHT': add = '→'; break;
      case 'VK_RETURN': add = '↵'; break;
      case 'VK_ESCAPE': add = 'ESC'; break;
      case 'no_modifiers [': add = '['; break;
      default: add = key; break;
    }

    if (!keyswap.includes(add)) {
      keyswap.push(add);
    }

    //debug
    //console.log(`keyswap: ${keyswap}`);

  });

  //debug
  //console.log(`for ini file ${iniPath}, keyswap: ${keyswap}`);
  return keyswap;
}

function findIniFile(dir) {
  let keyswap = [];
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      keyswap = keyswap.concat(findIniFile(filePath));
    }
    else if (file.endsWith('.ini')) {
      keyswap = keyswap.concat(dealIniFile(filePath));

      //debug
      //console.log(`==================for ini file ${filePath}, keyswap: ${keyswap}`);
    }
  });
  return keyswap;
}


function getSwapkeyFromIni(modDir) {
  let keyswap = findIniFile(modDir);
  // keyswap去重
  keyswap = Array.from(new Set(keyswap));
  return keyswap;
}

ipcMain.handle('get-mod-info', async (event, mod) => {
  //增加纠错
  if (modRootDir === '') {
    console.log("rootdir is empty");
    return {};
  }
  if (mod === '') {
    console.log("mod is empty");
    return {};
  }
  if (!fs.existsSync(path.join(modSourceDIr, mod))) {
    console.log(`mod ${mod} not found`);
    return {};
  }

  const modDir = path.join(modSourceDIr, mod);
  const modInfoPath = path.join(modDir, 'mod.json');
  let modInfo = {};
  if (fs.existsSync(modInfoPath)) {
    modInfo = JSON.parse(fs.readFileSync(modInfoPath));

    //然后需要对modInfo进行一些处理，为了兼容老的mod.json文件
    //如果没有url字段，则添加一个空的url字段
    if (!modInfo.url) {
      modInfo.url = '';
    }
    // 如果没有keyswap字段，则添加一个空的keyswap字段
    if (!modInfo.keyswap) {
      modInfo.keyswap = 'null';
    }

    // 如果 keyswap 字段是字符串，则转化为数组
    //debug
    //console.log(`for mod ${mod}, keyswap: ${modInfo.keyswap}, type: ${typeof modInfo.keyswap}`);
    if (typeof modInfo.keyswap === 'string') {
      modInfo.keyswap = [];
    }

    if (modInfo.keyswap === '') {
      modInfo.keyswap = [];
    }

    // 如果存在 cover 字段，则将其改为 imagePath
    if (modInfo.cover) {
      //如果也存在imagePath字段，则将cover字段删除
      if (modInfo.imagePath === '') {
        modInfo.imagePath = modInfo.cover;
      }
      delete modInfo.cover;
    }

    //如果不存在imagePath字段，则设置为preview.jpg
    if (modInfo.imagePath === '') {
      modInfo.imagePath = 'preview.jpg';
    }
  }
  else {
    //创建默认的mod.json文件
    modInfo = {
      character: 'unknown',
      description: 'no description',
      imagePath: 'preview.jpg',
      url: '',
      keyswap: []
    };
    fs.writeFileSync(modInfoPath, JSON.stringify(modInfo));
  }

  //如果不存在 keyswap 字段，则尝试从 ini 文件中读取
  if (modInfo.keyswap == []) {
    modInfo.keyswap = getSwapkeyFromIni(modDir);
  }

  //如果有更新的mod.json文件，则写入
  if (modInfo !== JSON.parse(fs.readFileSync(modInfoPath))) {
    fs.writeFileSync(modInfoPath, JSON.stringify(modInfo));
  }

  return modInfo;
});

ipcMain.handle('set-mod-info', async (event, mod, modInfo) => {
  //增加纠错
  if (modRootDir === '') {
    console.log("rootdir is empty");
    return;
  }
  if (mod === '') {
    console.log("mod is empty");
    return;
  }
  if (!fs.existsSync(path.join(modSourceDIr, mod))) {
    console.log(`mod ${mod} not found`);
    return;
  }
  const modDir = path.join(modSourceDIr, mod);
  const modInfoPath = path.join(modDir, 'mod.json');
  fs.writeFileSync(modInfoPath, JSON.stringify(modInfo));
});

ipcMain.handle('refresh-mod-info-swapkey', async () => {
  //遍历mod文件夹，对每个mod的keyswap字段进行更新
  const mods = fs.readdirSync(modSourceDIr);
  mods.forEach(mod => {
    const modDir = path.join(modSourceDIr, mod);
    const modInfoPath = path.join(modDir, 'mod.json');
    if (!fs.existsSync(modInfoPath)) {
      return;
    }
    let modInfo = JSON.parse(fs.readFileSync(modInfoPath));
    modInfo.keyswap = getSwapkeyFromIni(modDir);
    fs.writeFileSync(modInfoPath, JSON.stringify(modInfo));
  });
});


//-------------------应用mods-------------------
ipcMain.handle('apply-mods', async (event, mods) => {
  // 删除 未选中的mod 且 存在在modSource文件夹中的mod
  fs.readdirSync(modRootDir).forEach(file => {
    if (!mods.includes(file) && fs.existsSync(path.join(modSourceDIr, file))) {
      // 删除文件夹,包括文件夹内的文件，使用异步方法
      fs.rm(path.join(modRootDir, file), { recursive: true, force: true }, (err) => {
        if (err) {
          //console.log(`failed to delete ${file}: ${err}`);
        }
      }
      );
      //fs.rmSync(path.join(modsDir, file), { recursive: true, force: true });
    }
  });

  // 复制选中的mod
  mods.forEach(mod => {
    const src = path.join(modSourceDIr, mod);
    const dest = path.join(modRootDir, mod);
    if (!fs.existsSync(dest)) {
      fs.symlinkSync(src, dest, 'junction', (err) => {
        if (err) console.log(err);
      });
    }
  });
});

//-------------------刷新游戏-------------------
ipcMain.handle("refresh-in-zzz", async (event) => {
  // Refresh in ZZZ success flag
  // 0: Failed
  // 1: Success
  // 2: Cannot find the process
  // 3: Cannot find the zenless zone zero window
  // 4: Cannot find the mod manager window

  // Only availabe in windows
  if (isWindows) {
    // Virtual key code for F10. This key is the default but
    // can be changed in d3dx.ini. Future improvement.

    // We have the path to the 3dmigoto.exe, d3dx.ini is in the same folder
    // We just need to read the d3dx.ini file and get the VK_F10 value 
    const VK_F10 = 0x79;

    // Process name. Should be set as a config value for 
    // this to work while managing other games.
    const processName = "ZenlessZoneZero.exe";

    // Get the process from the name
    const process = HMC.getProcessNameList(processName);

    if (process.length <= 0) return 2;


    // Get the Zenless Zone Zero Hwnd handle
    const window = HMC.getProcessWindow(process[0].pid);

    // Get the Mod manager Hwnd handle
    const manager = HMC.getForegroundWindow();

    if (!window) return 3;
    if (!manager) return 4;

    // ZZZ wont accept any keys if the manager is not run as admin.
    // ZZZ wont accept virtual keys, only accepts direct input keys.
    // Here is the trick to get ZZZ to register the VK input without admin:

    // 1. Press the F10 Key down on the manager
    HMC.sendKeyboard(VK_F10, true);

    // 2. Set focus on ZZZ window
    window.setFocus(true);

    // 3. Wait a reasonable amount of time for the key to register
    await sleep(75);

    // 4. Set focus on the Manager window
    manager.setFocus(true);

    // 5. Wait again for the window
    await sleep(50);

    // 6. Release the F10 Key
    HMC.sendKeyboard(VK_F10, false);

    // 7. Set focus on ZZZ window again
    window.setFocus(true);

    refreshState = true;
  }
});

//-------------------presets-------------------
ipcMain.handle('save-preset', async (event, presetName, mods) => {
  const presetDir = path.join(modRootDir, '..', 'presets');
  if (!fs.existsSync(presetDir)) {
    fs.mkdirSync(presetDir);
  }
  fs.writeFileSync(path.join(presetDir, `${presetName}.json`), JSON.stringify(mods));
});

ipcMain.handle('get-presets', async () => {
  const presetDir = path.join(modRootDir, '..', 'presets');
  if (!fs.existsSync(presetDir)) {
    return [];
  }
  return fs.readdirSync(presetDir).map(file => path.basename(file, '.json'));
});

ipcMain.handle('load-preset', async (event, presetName) => {
  const presetDir = path.join(modRootDir, '..', 'presets');
  const presetPath = path.join(presetDir, `${presetName}.json`);
  if (fs.existsSync(presetPath)) {
    return JSON.parse(fs.readFileSync(presetPath));
  }
  return [];
});

ipcMain.handle('delete-preset', async (event, presetName) => {
  const presetDir = path.join(modRootDir, '..', 'presets');
  const presetPath = path.join(presetDir, `${presetName}.json`);
  //console.log("delete preset: " + presetPath);
  if (fs.existsSync(presetPath)) {
    fs.rmSync(presetPath);
  }
});

//-----------------------modInfo-----------------------
//打开mod文件夹
ipcMain.handle('open-mod-folder', async (event, mod) => {
  //判断mod是否存在
  const modDir = path.join(modSourceDIr, mod);
  if (!fs.existsSync(modDir)) {
    //console.log(`mod ${mod} not found`);
    return;
  }
  shell.openPath(modDir);
});

//打开mod.json文件
ipcMain.handle('open-mod-json', async (event, mod) => {
  //判断mod是否存在
  const modJsonDir = path.join(modSourceDIr, mod, 'mod.json');
  const modDir = path.join(modSourceDIr, mod);
  if (!fs.existsSync(modDir)) {
    //console.log(`mod ${mod} not found`);
    return;
  }
  //判断mod.json文件是否存在，如果不存在则创建一个默认的mod.json文件
  if (!fs.existsSync(modJsonDir)) {
    const modInfo = {
      character: 'unknown',
      description: 'no description',
      imagePath: 'preview.jpg'
    };
    fs.writeFileSync(path.join(modJsonDir), JSON.stringify(modInfo));
  }

  //判断mod.json文件是否存在，如果存在则打开mod.json文件
  if (fs.existsSync(modJsonDir)) {
    shell.openPath(modJsonDir);
  }
  else {
    //console.log(`mod.json not found in ${mod}`);
    return;
  }
});


// 在渲染进程复制图片文件不知道为什么不生效，所以这里在主进程中复制图片文件
ipcMain.handle('copy-file', async (event, src, dest) => {
  //debug
  console.log(`copy file: ${src} to ${dest}`);
  //判断dest文件是否存在，如果存在则删除
  if (fs.existsSync(dest)) {
    fs.rmSync(dest);
    console.log(`delete file: ${dest}`);
  }

  fs.copyFileSync(src, dest);
});

//-------------------自动化-------------------

// 使用管理员模式重新启动
async function restartAsAdmin() {
  //debug
  console.log(`restart as admin`);
  if (isWindows) {
    const exePath = process.execPath;

    //当使用开发模式时，exePath为electron.exe，所以说重新打开时是没用的，直接返回
    if (exePath.endsWith('electron.exe')) {
      console.log(`in development mode, cannot restart with electron.exe`);
      ifMainProcessReady = true;
      mainWindow.webContents.send('main-process-inited');
      return;
    }
    console.log(`restart as admin: ${exePath}`);
    //使用管理员模式重新启动
    require('child_process').exec(`powershell -Command "Start-Process '${exePath}' -Verb RunAs"`);
    //关闭当前窗口
    app.quit();
    return true;
  }

  if (isMac) {
    // Mac OS
    // 使用 sudo -S 来获取管理员权限
    // 通过 osascript 来执行 AppleScript
    // AppleScript 用于获取管理员权限

    // AppleScript
    const appleScript = `do shell script "echo '${app.getPath('exe')}' | sudo -S open -a '${app.getPath('exe')}'"`;
    // 执行 AppleScript
    require('child_process').exec(`osascript -e '${appleScript}'`);
    // 关闭当前窗口
    app.quit();
    return true;
  }

  if (isLinux) {
    // Linux
    // 使用 pkexec 来获取管理员权限
    // pkexec 用于获取管理员权限
    require('child_process').exec(`pkexec ${app.getPath('exe')}`);
    // 关闭当前窗口
    app.quit();
    return true;
  }

  console.log('restart as admin: unsupported platform');
  return false;

}
ipcMain.handle('restart-as-admin', async () => {
  return restartAsAdmin();
});

//启动modLoader
async function startModLoader() {
  //debug
  console.log(`start modLoader: ${modLoaderDir}`);
  if (!fs.existsSync(modLoaderDir)) {
    console.log("exePath not found");
    return false;
  }
  HMC.openApp(modLoaderDir);

  return true;
}
ipcMain.handle('start-mod-loader', async () => {
  return startModLoader();
});

// 启动游戏
// 这里不再在渲染进程中启动游戏，而是在主进程中启动游戏
async function startGame() {
  //debug
  console.log(`start game: ${gameDir}`);
  if (!fs.existsSync(gameDir)) {
    console.log("gameDir not found");
    return false;
  }
  HMC.openApp(gameDir);
  return true;
}
ipcMain.handle('start-game', async () => {
  return startGame();
});



//---------------------窗口控制---------------------
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

    if (win && bounds) {
      const screenArea = screen.getDisplayMatching(bounds).workArea;

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
        win.setBounds({ x: x, y: y, width: width, height: height });
      }
      else {
        win.setBounds(bounds);
      }
    }
  } catch (e) { }
});


// 打开外部链接
ipcMain.handle('open-external-link', async (event, link) => {
  shell.openExternal(link);
});





