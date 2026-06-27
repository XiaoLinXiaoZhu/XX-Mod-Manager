// fileSystem.js — 类型安全 IPC 迁移版
// 使用 @xxmm/ipc 的 createIPCMain 替代裸 ipcMain.handle
const { app, BrowserWindow, dialog, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { createIPCMain, IPC } = require("@xxmm/ipc");
const {
  parseFilePath,
  parseDirPath,
  parseModSourcePath,
  parseModTargetPath,
  parseImagePath,
  parseModName,
  parseModField,
  parsePluginName,
  parseCustomConfigFolder,
} = require("@xxmm/types");

const ipc = createIPCMain();

//-==================== 核心变量 =====================

//----------------- 状态 -----------------
const _isMac = os.platform() === "darwin";
const _isWindows = os.platform() === "win32";
const _isLinux = os.platform() === "linux";

//----------------- 变量 -----------------
let currentMainWindow = null;
let ifCustomConfig = false;
let customConfigFolder = "";

//! 这是非常不健康的方法
//! 同一个变量需要在多个地方使用，但是又不能直接获取
let currentLanguage = "zh_cn";

const dataPath = app.getPath("userData");
const configPath = () => {
  return ifCustomConfig
    ? path.join(customConfigFolder, "config.json")
    : path.join(dataPath, "config.json");
};
const pluginConfigPath = () => {
  return ifCustomConfig
    ? path.join(customConfigFolder, "pluginConfig.json")
    : path.join(dataPath, "pluginConfig.json");
};
const disabledPluginsPath = () => {
  return ifCustomConfig
    ? path.join(customConfigFolder, "disabledPlugins.json")
    : path.join(dataPath, "disabledPlugins.json");
};

function snack(message, type = "info") {
  const mainWindow = currentMainWindow;
  console.log(`snack:${message} type:${type}`);
  mainWindow.webContents.send("snack", message, type);
}
function t_snack(message_ch, message_en, type = "info") {
  getConfig(configPath()).then((config) => {
    const language = config.language;
    snack(language === "zh_cn" ? message_ch : message_en, type);
  });
}

// 核心数据
// 接受 send 的消息，设置 iManager
const _iManager = null;
ipc.handle(IPC.plugin.setIManager, async (_event, iManager) => {
  //debug
  console.log("===============set-imanager");
  console.log(iManager);
  await iManager.waitInit();
  //debug
  console.log("===============set-imanager success");
  console.log(iManager);
});

//-========================== 内部函数 ==========================

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function testPath(name, path, tryfix = false) {
  if (!path) {
    t_snack(`${name}路径未定义`, `${name} path not defined`, "error");
    return false;
  }
  if (!fs.existsSync(path) && !tryfix) {
    t_snack(`${name}路径不存在`, `${name} path not exists`, "error");
    return false;
  }
  if (!fs.existsSync(path) && tryfix) {
    try {
      fs.mkdirSync(path, { recursive: true });
      t_snack(
        `${name}路径不存在，已自动创建`,
        `${name} path not exists, auto created`,
        "info",
      );
    } catch (_err) {
      t_snack(
        `${name}路径不存在，自动创建失败`,
        `${name} path not exists, auto create failed`,
        "error",
      );
      return false;
    }
    return true;
  }
  return true;
}

function t_testPath(name_ch, name_en, path, tryfix = false) {
  const language = currentLanguage;
  return testPath(language === "zh_cn" ? name_ch : name_en, path, tryfix);
}

//-========================== 对外接口 ==========================
//----------------- 获取变量 -----------------
ipc.handle(IPC.app.getUserDataPath, async (_event) => {
  return app.getPath("userData");
});

ipc.on(IPC.app.getUserDataPathSync, (event, _data) => {
  event.returnValue = app.getPath("userData");
});

ipc.handle(IPC.app.getAppPath, async (_event) => {
  return app.getAppPath();
});

ipc.handle(IPC.app.getDesktopPath, async (_event) => {
  return app.getPath("desktop");
});

//----------------- 配置相关 -----------------

async function getConfig(filePath) {
  //debug
  console.log(`getConfig:${filePath}`);
  if (fs.existsSync(filePath)) {
    const data = await readFile(filePath);

    // 同步一下 language
    const config = JSON.parse(data);

    currentLanguage = config.language;

    //debug
    console.log(`file exists: `, filePath);
    return config;
  } else {
    const defaultConfig = {
      language: "zh_cn", // 语言
      theme: "dark", // 主题
      modSourcePath: null, // mod的源路径
      modTargetPath: null, // mod的目标路径
      presetPath: null, // 预设路径
    };
    fs.writeFileSync(filePath, JSON.stringify(defaultConfig), "utf-8");
    console.log(`file not exists:${filePath}`);
    snack("file not exists, create default config");
    return defaultConfig;
  }
}

async function getCurrentConfig() {
  return await getConfig(configPath());
}

async function setConfig(filePath, config) {
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

async function _setCurrentConfig(config) {
  await setConfig(configPath(), config);
}

ipc.handle(IPC.config.get, async (_event) => {
  const currentConfigPath = configPath();
  console.log(`get-current-config:${currentConfigPath}`);
  return await getConfig(currentConfigPath);
});

ipc.handle(IPC.config.set, async (_event, config) => {
  const currentConfigPath = configPath();
  console.log(`set-current-config:${currentConfigPath}`, config);
  await setConfig(configPath(), config);
});

//-========================== 对外接口 - 能力 ==========================
// 读取文件
ipc.handle(IPC.mod.getFiles, async (_event, dirPath) => {
  const safePath = parseDirPath(dirPath);
  if (!fs.existsSync(safePath)) {
    return {
      state: 0,
      ret: [],
    };
  }
  const files = fs.readdirSync(safePath);
  return {
    state: 1,
    ret: files,
  };
});

function tryGetModPreview(modPath, modConfigPreviewName) {
  //图片优先使用modInfo.preview，如果没有则尝试使用 mod文件夹下的preview.png或者preview.jpg或者preview.jpeg，如果没有则使用默认图片
  var modPreviewName = "";
  if (
    modConfigPreviewName &&
    fs.existsSync(path.join(modPath, modConfigPreviewName))
  ) {
    return {
      previewPath: path.join(modPath, modConfigPreviewName),
      previewName: modConfigPreviewName,
      state: 1,
      snack: "",
    };
  }

  const tryImageNames = ["preview.png", "preview.jpg", "preview.jpeg"];
  tryImageNames.forEach((imageName) => {
    if (fs.existsSync(path.join(modPath, imageName))) {
      modPreviewName = imageName;
    }
  });

  if (modPreviewName !== "") {
    // 如果找到了图片文件，说明mod文件夹下有preview图片，但是没有在modInfo中设置imagePath，所以需要将其保存到modInfo中
    setModInfoFiled(modPath, "preview", modPreviewName);
    return {
      previewPath: path.join(modPath, modPreviewName),
      previewName: modPreviewName,
      state: 1,
      snack: `Original image is ${modConfigPreviewName},but not found, find ${modPreviewName} instead, auto saved to mod.json`,
    };
  }

  // 如果都没有的话，尝试寻找mod文件夹下的第一个图片文件
  const files = fs.readdirSync(path.join(modPath));
  const imageFiles = files.filter(
    (file) =>
      file.endsWith(".png") ||
      file.endsWith(".jpg") ||
      file.endsWith(".jpeg") ||
      file.endsWith(".webp"),
  );
  //如果没有图片文件，则使用默认图片,之后直接跳出程序
  if (imageFiles.length <= 0) {
    return {
      previewPath: path.resolve("./src/assets/default.png"),
      previewName: "default.png",
    };
  }

  const modPreviewPath = imageFiles[0];
  setModInfoFiled(modPath, "preview", modPreviewPath);
  return {
    previewPath: path.join(modPath, modPreviewPath),
    previewName: modPreviewPath,
    state: 1,
    snack: "No image file found in mod folder, use first image file instead",
  };
}

function creatMod(modPath) {
  const mod = {
    name: path.basename(modPath),
    character: "Unknown",
    preview: "",
    description: "",
    url: "",
    hotkeys: [],
    newMod: true,
  };

  const modConfigPath = path.join(modPath, "mod.json");

  if (fs.existsSync(modConfigPath)) {
    mod.newMod = false;

    const modConfig = JSON.parse(fs.readFileSync(modConfigPath, "utf-8"));
    mod.character = modConfig.character;
    mod.preview = modConfig.preview;
    mod.description = modConfig.description;
    mod.url = modConfig.url;

    if (modConfig.hotkeys !== undefined) {
      mod.hotkeys = modConfig.hotkeys;
    }

    const modPreview = tryGetModPreview(modPath, modConfig.preview);
    mod.preview = modPreview.previewPath;
    mod.state = modPreview.state;
    mod.snack = modPreview.snack;
  } else {
    const modPreview = tryGetModPreview(modPath, "");
    mod.preview = modPreview.previewPath;
    mod.state = modPreview.state;
    mod.snack = modPreview.snack;

    // 如果没有mod.json文件，则创建一个
    const modSourcePath = path.dirname(modPath);
    saveModInfo(modSourcePath, JSON.stringify(mod));
  }

  return mod;
}

function getMods(modSourcePath) {
  const mods = [];

  // 错误处理
  if (!t_testPath("模组", "mod", modSourcePath, false)) {
    snack("get-mods failed");
    return mods;
  }

  const modFolders = fs.readdirSync(modSourcePath);
  modFolders.forEach((modFolder) => {
    const modPath = path.join(modSourcePath, modFolder);
    if (fs.statSync(modPath).isDirectory()) {
      mods.push(creatMod(modPath));
    }
  });
  return mods;
}

ipc.handle(IPC.mod.list, async (_event, modSourcePath) => {
  const safe = parseModSourcePath(modSourcePath);
  const startTime = Date.now();
  const mods = getMods(safe);
  const endTime = Date.now();
  console.log(`get ${mods.length} mods in ${endTime - startTime}ms`);
  snack(`get ${mods.length} mods in ${endTime - startTime}ms`);
  return mods;
});

// 因为 渲染进程 无法获取 本地文件，所以需要通过 主进程 来获取图片文件
ipc.handle(IPC.mod.getImage, async (_event, imagePath) => {
  const safe = parseImagePath(imagePath);
  // 传递一个 buffer 对象给渲染进程
  return fs.readFileSync(safe).toString("base64");
});

// 这里应该解构设计，渲染进程不再需要操心 当前的配置，mod的img等等
ipc.handle(IPC.mod.listFromCurrentConfig, async (_event) => {
  const currentConfig = await getConfig(configPath());
  const modSourcePath = currentConfig.modSourcePath;

  return fs.existsSync(modSourcePath) ? getMods(modSourcePath) : [];
});

ipc.handle(IPC.mod.getInfo, async (_event, modSourcePath, modName) => {
  const safeSource = parseModSourcePath(modSourcePath);
  const safeName = parseModName(modName);
  const modPath = path.join(safeSource, safeName);
  return fs.existsSync(modPath) ? creatMod(modPath) : null;
});

//-==========================设置mod信息==========================
function setModInfoFiled(modPath, field, value) {
  const modConfigPath = path.join(modPath, "mod.json");
  if (fs.existsSync(modConfigPath)) {
    const modConfig = JSON.parse(fs.readFileSync(modConfigPath, "utf-8"));
    modConfig[field] = value;
    fs.writeFileSync(modConfigPath, JSON.stringify(modConfig), "utf-8");
  }
}
ipc.handle(IPC.mod.setInfo, async (_event, modPath, field, value) => {
  const safePath = parseDirPath(modPath);
  const safeField = parseModField(field);
  setModInfoFiled(safePath, safeField, value);
});

//-===========================预设===========================
function getPresetList(presetPath) {
  const presets = [];

  // 错误处理
  if (!t_testPath("预设", "preset", presetPath, false)) return presets;

  // preset 以单个json文件存储，里面包含了该 preset 所启用的 mod
  // 这个函数只需要返回 preset 的名称即可
  const presetFiles = fs.readdirSync(presetPath);
  presetFiles.forEach((presetFile) => {
    const presetFilePath = path.join(presetPath, presetFile);
    if (fs.statSync(presetFilePath).isFile() && presetFile.endsWith(".json")) {
      // 这里的名称不需要后缀
      presets.push(presetFile.slice(0, -5));
    }
  });
  return presets;
}

function loadPreset(presetPath, presetName) {
  const presetFilePath = path.join(presetPath, `${presetName}.json`);
  if (fs.existsSync(presetFilePath)) {
    return JSON.parse(fs.readFileSync(presetFilePath, "utf-8"));
  }
  snack(`Preset ${presetName} not found`);
  return null;
}

async function savePreset(presetPath, presetName, mods) {
  const presetFilePath = path.join(presetPath, `${presetName}.json`);

  if (!t_testPath("预设", "preset", presetPath, true)) return;

  fs.writeFileSync(presetFilePath, JSON.stringify(mods));
}

ipc.handle(IPC.preset.list, async (_event) => {
  const modConfig = await getCurrentConfig();
  const presetPath = modConfig.presetPath;

  return getPresetList(presetPath);
});

ipc.handle(IPC.preset.load, async (_event, presetName) => {
  const modConfig = await getCurrentConfig();
  const presetPath = modConfig.presetPath;
  return loadPreset(presetPath, presetName);
});

ipc.handle(IPC.preset.save, async (_event, presetName, mods) => {
  const modConfig = await getCurrentConfig();
  const presetPath = modConfig.presetPath;
  //debug
  savePreset(presetPath, presetName, mods);
});

//-========================== 文件对话框 ==========================
ipc.handle(
  IPC.fs.getFilePath,
  async (_event, fileName, fileType, defaultPath) => {
    //通过文件选择对话框选择文件
    let result;
    if (fileType === "directory") {
      result = await dialog.showOpenDialog({
        defaultPath: defaultPath,
        title: `Select ${fileName}`,
        properties: ["openDirectory"],
      });
    } else if (fileType === "image") {
      result = await dialog.showOpenDialog({
        defaultPath: defaultPath,
        title: `Select ${fileName}`,
        properties: ["openFile"],
        filters: [
          {
            name: fileName,
            extensions: [
              "jpg",
              "png",
              "jpeg",
              "gif",
              "bmp",
              "webp",
              "svg",
              "ico",
              "tiff",
            ],
          },
        ],
      });
    } else if (fileType === "exe") {
      result = await dialog.showOpenDialog({
        defaultPath: defaultPath,
        title: `Select ${fileName}`,
        properties: ["openFile"],
        filters: [{ name: fileName, extensions: ["exe"] }],
      });
    } else if (fileType === "ini") {
      result = await dialog.showOpenDialog({
        defaultPath: defaultPath,
        title: `Select ${fileName}`,
        properties: ["openFile"],
        filters: [{ name: fileName, extensions: ["ini"] }],
      });
    } else {
      result = await dialog.showOpenDialog({
        defaultPath: defaultPath,
        title: `Select ${fileName}`,
        properties: ["openFile"],
        filters: [{ name: fileName, extensions: [fileType] }],
      });
    }

    if (!result.canceled) {
      //debug
      console.log(`get-file-path:${result.filePaths[0]}`);
      return result.filePaths[0];
    }
    return "";
  },
);

//-=========================== 插件 ===========================
// save-plugin-config

async function savePluginConfig(pluginName, config) {
  const currentPluginConfigPath = pluginConfigPath();

  // 不存在文件则创建
  if (!fs.existsSync(currentPluginConfigPath)) {
    fs.writeFileSync(currentPluginConfigPath, "{}", "utf-8");
  }
  // 读取文件，插入新的配置
  const data = JSON.parse(fs.readFileSync(currentPluginConfigPath, "utf-8"));
  data[pluginName] = config;
  //debug
  console.log(`save-plugin-config:${currentPluginConfigPath}`, data);

  // 保存文件
  fs.writeFileSync(
    currentPluginConfigPath,
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

async function getPluginConfig(pluginName) {
  const currentPluginConfigPath = pluginConfigPath();
  if (fs.existsSync(currentPluginConfigPath)) {
    const data = JSON.parse(fs.readFileSync(currentPluginConfigPath, "utf-8"));
    return data[pluginName];
  }
  return null;
}

async function saveDisabledPlugins(disabledPlugins) {
  const currentDisabledPluginsPath = disabledPluginsPath();
  fs.writeFileSync(
    currentDisabledPluginsPath,
    JSON.stringify(disabledPlugins, null, 2),
    "utf-8",
  );
}

async function getDisabledPlugins() {
  const currentDisabledPluginsPath = disabledPluginsPath();
  if (fs.existsSync(currentDisabledPluginsPath)) {
    return JSON.parse(fs.readFileSync(currentDisabledPluginsPath, "utf-8"));
  }
  return [];
}

ipc.handle(IPC.plugin.saveConfig, async (_event, pluginName, config) => {
  const safeName = parsePluginName(pluginName);
  savePluginConfig(safeName, config);
});

ipc.handle(IPC.plugin.getConfig, async (_event, pluginName) => {
  const safeName = parsePluginName(pluginName);
  return getPluginConfig(safeName);
});

// 保存插件启用状态
ipc.handle(IPC.plugin.saveDisabled, async (_event, disabledPlugins) => {
  saveDisabledPlugins(disabledPlugins);
});

// 获取插件启用状态
ipc.handle(IPC.plugin.getDisabled, async (_event) => {
  return await getDisabledPlugins();
});

//-=========================== apply ===========================
ipc.handle(
  IPC.mod.apply,
  async (_event, mods, modSourcePath, modTargetPath) => {
    const safeSrc = parseModSourcePath(modSourcePath);
    const safeDest = parseModTargetPath(modTargetPath);

    fs.readdirSync(safeDest).forEach((file) => {
      if (
        !mods.includes(file) &&
        fs.existsSync(path.join(safeSrc, file))
      ) {
        // 删除文件夹,包括文件夹内的文件，使用异步方法
        fs.rm(
          path.join(safeDest, file),
          { recursive: true, force: true },
          (err) => {
            if (err) {
              console.log(`failed to delete ${file}: ${err}`);
              snack(`failed to delete ${file}: ${err}`);
            }
          },
        );
      }
    });

    // 为选中的mod创建链接
    mods.forEach((mod) => {
      const src = path.join(safeSrc, mod);
      const dest = path.join(safeDest, mod);
      if (!fs.existsSync(dest)) {
        fs.symlinkSync(src, dest, "junction", (err) => {
          if (err) console.log(err);
        });
      }
    });
  },
);

ipc.handle(IPC.mod.saveInfo, async (_event, modSourcePath, jsonModInfo) => {
  const safeSource = parseModSourcePath(modSourcePath);
  saveModInfo(safeSource, jsonModInfo);
});

function saveModInfo(modSourcePath, jsonModInfo) {
  const modInfo = JSON.parse(jsonModInfo);

  const saveInfo = {
    character: modInfo.character,
    preview: path.basename(modInfo.preview),
    description: modInfo.description,
    url: modInfo.url,
    hotkeys: modInfo.hotkeys,
  };

  //debug
  // 打印所有的属性
  printModInfo(saveInfo);

  //debug
  console.log(modSourcePath);
  const modConfigPath = path.join(modSourcePath, modInfo.name, "mod.json");
  fs.writeFileSync(modConfigPath, JSON.stringify(saveInfo, null, 4), "utf-8");
}

function printModInfo(modInfo) {
  console.log(`--------------save-mod-info --------------`);
  for (const key in modInfo) {
    console.log(`${key}:${modInfo[key]}`);
  }
  // hotkeys 为 [{},{}],将其 每个键值对打印出来
  console.log("hotkeys:");
  modInfo.hotkeys.forEach((hotkey, index) => {
    console.log(`-->${index}:`);
    for (const key in hotkey) {
      console.log(`    ${key}:${hotkey[key]}`);
    }
  });
}

function moveAllFiles(srcDir, destDir) {
  // 将 srcDir 下的所有文件移动到 destDir
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir);
  files.forEach((file) => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    fs.copyFileSync(srcFile, destFile);
    fs.unlinkSync(srcFile);
  });
}

ipc.handle(IPC.mod.moveAllFiles, async (_event, srcDir, destDir) => {
  const safeSrc = parseDirPath(srcDir);
  const safeDest = parseDirPath(destDir);
  moveAllFiles(safeSrc, safeDest);
});

//-========================== 初始化所有数据 ==========================
// init-all-data
ipc.handle(IPC.app.initAllData, async (_event) => {
  // 获取 配置路径
  const dataPath = app.getPath("userData");
  const configPath = path.join(dataPath, "config.json");
  // 获取 预设路径，在config.json中
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const presetPath = config.presetPath;

  // 删除 presetPath 下的所有文件
  if (fs.existsSync(presetPath)) {
    fs.readdirSync(presetPath).forEach((file) => {
      fs.unlinkSync(path.join(presetPath, file));
    });
  }

  // 删除 config.json
  fs.unlinkSync(configPath);
});

//-========================== fsProxy ==========================
// fsProxy 用于渲染进程调用主进程的文件系统功能

ipc.handle(IPC.fs.readFile, async (_event, pathStr) => {
  const safe = parseFilePath(pathStr);
  return fs.readFileSync(safe, "utf-8");
});
ipc.handle(IPC.fs.writeFile, async (_event, pathStr, data) => {
  const safe = parseFilePath(pathStr);
  fs.writeFileSync(safe, data, "utf-8");
});
ipc.handle(IPC.fs.createFile, async (_event, pathStr) => {
  const safe = parseFilePath(pathStr);
  fs.writeFileSync(safe, "", "utf-8");
});
ipc.handle(IPC.fs.readDir, async (_event, pathStr) => {
  const safe = parseDirPath(pathStr);
  return fs.readdirSync(safe);
});
ipc.handle(IPC.fs.isDir, async (_event, pathStr) => {
  const safe = parseDirPath(pathStr);
  return fs.statSync(safe).isDirectory();
});
// exists
ipc.handle(IPC.fs.exists, async (_event, pathStr) => {
  const safe = parseFilePath(pathStr);
  return fs.existsSync(safe);
});
// mkdir (recursive)
ipc.handle(IPC.fs.mkdir, async (_event, pathStr) => {
  const safe = parseDirPath(pathStr);
  fs.mkdirSync(safe, { recursive: true });
});
// remove (recursive, force)
ipc.handle(IPC.fs.remove, async (_event, pathStr) => {
  const safe = parseFilePath(pathStr);
  fs.rmSync(safe, { recursive: true, force: true });
});
// symlink
ipc.handle(IPC.fs.symlink, async (_event, srcStr, destStr, type) => {
  const safeSrc = parseFilePath(srcStr);
  const safeDest = parseFilePath(destStr);
  const symlinkType = type ?? "junction";
  fs.symlinkSync(safeSrc, safeDest, symlinkType);
});
// 打开文件夹路径
ipc.handle(IPC.fs.openDir, async (_event, pathStr) => {
  const safe = parseDirPath(pathStr);
  //debug
  console.log(`fs-open-dir:${safe}`);
  const { shell } = require("electron");
  shell.openPath(safe);
});

// 在外部打开链接
ipc.handle(IPC.app.openUrl, async (_event, url) => {
  const { shell } = require("electron");
  shell.openExternal(url);
});

//-=============================导出=============================
function setMainWindow(mainWindow) {
  currentMainWindow = mainWindow;
}
function setCustomConfigFolder(path) {
  ifCustomConfig = true;
  customConfigFolder = path;
}

ipc.handle(IPC.config.setCustomFolder, async (_event, folder) => {
  const safe = parseCustomConfigFolder(folder);
  setCustomConfigFolder(safe);
});

module.exports = {
  setMainWindow,
  setCustomConfigFolder,
};
