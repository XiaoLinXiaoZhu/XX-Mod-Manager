const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('node:path')
const fs = require('fs')


let currentMainWindow = null;
function setMainWindow(mainWindow) {
    currentMainWindow = mainWindow;
}


function snack(message, type = 'info') {
    const mainWindow = currentMainWindow;
    //console.log(mainWindow);
    console.log(`snack:${message} type:${type}`);
    mainWindow.webContents.send('snack', message, type);
}
// 这里为渲染进程提供 读取文件的功能。

// 核心数据
// 接受 send 的消息，设置 iManager
let iManager = null;
// ipcRenderer.send('set-imanager', this.waitInit());
ipcMain.handle('set-imanager', async (event, iManager) => {
    //debug
    console.log('===============set-imanager');
    console.log(iManager);
    await iManager.waitInit();
    //debug
    console.log('===============set-imanager success');
    console.log(iManager);
});





function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

async function getCurrentConfig() {
    const dataPath = app.getPath('userData');
    const filePath = path.join(dataPath, 'config.json');
    console.log(`get-current-config:${filePath}`);
    if (fs.existsSync(filePath)) {
        const data = await readFile(filePath);
        //debug
        console.log(`file exists:${data}`);
        return JSON.parse(data);
    }
    else {
        const defaultConfig = {
            language: 'zh_cn', // 语言
            theme: 'dark', // 主题
            modSourcePath: null, // mod的源路径
            modTargetPath: null, // mod的目标路径
            presetPath: null // 预设路径
        }
        fs.writeFileSync(filePath, JSON.stringify(defaultConfig), 'utf-8');
        console.log(`file not exists:${filePath}`);
        return null;
    }
}

ipcMain.handle('get-user-data-path', async (event) => {
    return app.getPath('userData');
}
);

ipcMain.handle('get-current-config', async (event) => {
    return await getCurrentConfig();
});

ipcMain.handle('set-current-config', async (event, config) => {
    const dataPath = app.getPath('userData');
    const filePath = path.join(dataPath, 'config.json');
    fs.writeFileSync(filePath, JSON.stringify(config), 'utf-8');
});

ipcMain.handle('getFiles', async (event, dirPath) => {
    if (!fs.existsSync(dirPath)) {
        return {
            state: 0,
            ret: []
        };
    }
    const files = fs.readdirSync(dirPath);
    return {
        state: 1,
        ret: files
    };
});

function tryGetModPreview(modPath, modConfigPreviewName) {
    //图片优先使用modInfo.preview，如果没有则尝试使用 mod文件夹下的preview.png或者preview.jpg或者preview.jpeg，如果没有则使用默认图片
    var modPreviewName = '';
    if (modConfigPreviewName && fs.existsSync(path.join(modPath, modConfigPreviewName))) {
        return {
            previewPath: path.join(modPath, modConfigPreviewName),
            previewName: modConfigPreviewName,
            state: 1,
            snack: ''
        }
    }

    const tryImageNames = ['preview.png', 'preview.jpg', 'preview.jpeg'];
    tryImageNames.forEach(imageName => {
        if (fs.existsSync(path.join(modPath, imageName))) {
            modPreviewName = imageName;
        }
    });

    if (modPreviewName != '') {
        // 如果找到了图片文件，说明mod文件夹下有preview图片，但是没有在modInfo中设置imagePath，所以需要将其保存到modInfo中
        setModInfoFiled(modPath, 'preview', modPreviewName);
        // 使用snack提示用户自动保存了图片
        // snack(`Original image is ${modPreviewName},but not found, find ${modPreviewPath} instead, auto saved to mod.json`);

        return {
            previewPath: path.join(modPath, modPreviewName),
            previewName: modPreviewName,
            state: 1,
            snack: `Original image is ${modConfigPreviewName},but not found, find ${modPreviewName} instead, auto saved to mod.json`
        }
    }

    // 如果都没有的话，尝试寻找mod文件夹下的第一个图片文件
    const files = fs.readdirSync(path.join(modPath));
    const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp'));
    //如果没有图片文件，则使用默认图片,之后直接跳出程序
    if (imageFiles.length <= 0) {
        snack('No image file found in mod folder, use default image instead');
        return {
            previewPath: path.join(__dirname, './src/assets/default.jpg'),
            previewName: 'default.jpg',
        }
    }

    modPreviewPath = imageFiles[0];
    //debug
    //console.log(`modImageName:${modImageName}`);
    setModInfoFiled(modPath, 'preview', modPreviewPath);
    return {
        previewPath: path.join(modPath, modPreviewPath),
        previewName: modPreviewPath,
        state: 1,
        snack: 'No image file found in mod folder, use first image file instead'
    }

}

function creatMod(modPath) {
    const mod = {
        name: path.basename(modPath),
        character: 'Unknown',
        preview: '',
        description: '',
        url: '',
        hotkeys: [],
        state: 1,
        snack: ''
    }

    const modConfigPath = path.join(modPath, 'mod.json');

    if (fs.existsSync(modConfigPath)) {
        const modConfig = JSON.parse(fs.readFileSync(modConfigPath, 'utf-8'));
        mod.character = modConfig.character;
        mod.preview = modConfig.preview;
        mod.description = modConfig.description;
        mod.url = modConfig.url;
        mod.hotkeys = modConfig.hotkeys;

        const modPreview = tryGetModPreview(modPath, modConfig.preview);
        mod.preview = modPreview.previewPath;
        mod.state = modPreview.state;
        mod.snack = modPreview.snack;
    }

    return mod;
}
function getMods(modSourcePath) {
    const mods = [];
    if (!fs.existsSync(modSourcePath)) {
        return mods;
    }
    const modFolders = fs.readdirSync(modSourcePath);
    modFolders.forEach(modFolder => {
        const modPath = path.join(modSourcePath, modFolder);
        if (fs.statSync(modPath).isDirectory()) {
            mods.push(creatMod(modPath));
        }
    });
    return mods;
}


ipcMain.handle('get-mods', async (event, modSourcePath) => {
    const mods = getMods(modSourcePath);
    snack('get-mods');
    return mods;
});

// 因为 渲染进程 无法获取 本地文件，所以需要通过 主进程 来获取图片文件
ipcMain.handle('get-image', async (event, imagePath) => {
    // 传递一个 buffer 对象给渲染进程
    return fs.readFileSync(imagePath).toString('base64');
});

// 这里应该解构设计，渲染进程不再需要操心 当前的配置，mod的img等等
ipcMain.handle('get-mods-from-current-config', async (event) => {
    const currentConfig = await getCurrentConfig();
    const modSourcePath = currentConfig.modSourcePath;

    return fs.existsSync(modSourcePath) ? getMods(modSourcePath) : [];
});

ipcMain.handle('get-mod-info', async (event, modName) => {
    const currentConfig = await getCurrentConfig();
    const modSourcePath = currentConfig.modSourcePath;
    const modPath = path.join(modSourcePath, modName);
    return fs.existsSync(modPath) ? creatMod(modPath) : null;
});


//-==========================设置mod信息==========================
function setModInfoFiled(modPath, field, value) {
    const modConfigPath = path.join(modPath, 'mod.json');
    if (fs.existsSync(modConfigPath)) {
        const modConfig = JSON.parse(fs.readFileSync(modConfigPath, 'utf-8'));
        modConfig[field] = value;
        fs.writeFileSync(modConfigPath, JSON.stringify(modConfig), 'utf-8');
    }
}
ipcMain.handle('set-mod-info', async (modPath, field, value) => {
    setModInfoFiled(modPath, field, value);
});


//-===========================预设===========================
function getPresetList(presetPath) {
    const presets = [];
    // preset 以单个json文件存储，里面包含了该 preset 所启用的 mod
    // 这个函数只需要返回 preset 的名称即可
    const presetFiles = fs.readdirSync(presetPath);
    presetFiles.forEach(presetFile => {
        const presetFilePath = path.join(presetPath, presetFile);
        if (fs.statSync(presetFilePath).isFile() && presetFile.endsWith('.json')) {
            // 这里的名称不需要后缀
            presets.push(presetFile.slice(0, -5));
        }
    });
    return presets;
}

function loadPreset(presetPath, presetName) {
    const presetFilePath = path.join(presetPath, `${presetName}.json`);
    if (fs.existsSync(presetFilePath)) {
        return JSON.parse(fs.readFileSync(presetFilePath, 'utf-8'));
    }
    snack(`Preset ${presetName} not found`);
    return null;
}

async function savePreset(presetPath, presetName, mods) {
    const presetFilePath = path.join(presetPath, `${presetName}.json`);
    if (!fs.existsSync(presetPath)) {
        fs.mkdirSync(presetPath);
    }
    fs.writeFileSync(presetFilePath, JSON.stringify(mods));
    snack(`Preset ${presetName} saved`);
}

ipcMain.handle('get-preset-list', async (event) => {
    const modConfig = await getCurrentConfig();
    const presetPath = modConfig.presetPath;

    // 增加 排障代码
    if (presetPath == undefined) {
        snack('presetPath is undefined');
        return [];
    }
    if (!fs.existsSync(presetPath)) {
        snack('presetPath not exists');
        return [];
    }
    return getPresetList(presetPath);
});

ipcMain.handle('load-preset', async (event, presetName) => {
    const modConfig = await getCurrentConfig();
    const presetPath = modConfig.presetPath;
    return loadPreset(presetPath, presetName);
});

ipcMain.handle('save-preset', async (event, presetName, mods) => {
    const modConfig = await getCurrentConfig();
    const presetPath = modConfig.presetPath;
    savePreset(presetPath, presetName, mods);
});

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
        //debug
        console.log(`get-file-path:${result.filePaths[0]}`);
        return result.filePaths[0];
    }
    return '';
}
);


//-=========================== apply ===========================

// ipcMain.handle('apply-mods', async (event, mods) => {
//     // 删除 未选中的mod 且 存在在modSource文件夹中的mod
//     fs.readdirSync(modRootDir).forEach(file => {
//       if (!mods.includes(file) && fs.existsSync(path.join(modSourceDIr, file))) {
//         // 删除文件夹,包括文件夹内的文件，使用异步方法
//         fs.rm(path.join(modRootDir, file), { recursive: true, force: true }, (err) => {
//           if (err) {
//             //console.log(`failed to delete ${file}: ${err}`);
//           }
//         }
//         );
//         //fs.rmSync(path.join(modsDir, file), { recursive: true, force: true });
//       }
//     });

//     // 复制选中的mod
//     mods.forEach(mod => {
//       const src = path.join(modSourceDIr, mod);
//       const dest = path.join(modRootDir, mod);
//       if (!fs.existsSync(dest)) {
//         fs.symlinkSync(src, dest, 'junction', (err) => {
//           if (err) console.log(err);
//         });
//       }
//     });
//   });

ipcMain.handle('apply-mods', async (event, mods, modSourcePath, modTargetPath) => {
    fs.readdirSync(modTargetPath).forEach(file => {
        if (!mods.includes(file) && fs.existsSync(path.join(modSourcePath, file))) {
            // 删除文件夹,包括文件夹内的文件，使用异步方法
            fs.rm(path.join(modTargetPath, file), { recursive: true, force: true }, (err) => {
                if (err) {
                    console.log(`failed to delete ${file}: ${err}`);
                    snack(`failed to delete ${file}: ${err}`);
                }
            }
            );
        }
    });

    // 复制选中的mod
    mods.forEach(mod => {
        const src = path.join(modSourcePath, mod);
        const dest = path.join(modTargetPath, mod);
        if (!fs.existsSync(dest)) {
            fs.symlinkSync(src, dest, 'junction', (err) => {
                if (err) console.log(err);
            });
        }
    });
});


//-========================== fsProxy ==========================
// fsProxy 用于渲染进程调用主进程的文件系统功能
// class fsProxy {
//     static instance = null;
//     constructor() {
//         if (fsProxy.instance) {
//             return fsProxy.instance;
//         }
//         fsProxy.instance = this;
//     }

//     async readFile(path) {
//         return await ipcRenderer.invoke('fs-read-file', path);
//     }

//     async writeFile(path, data) {
//         return await ipcRenderer.invoke('fs-write-file', path, data);
//     }

//     async createFile(path) {
//         return await ipcRenderer.invoke('fs-create-file', path);
//     }

//     async readDir(path) {
//         return await ipcRenderer.invoke('fs-read-dir', path);
//     }

//     async isDir(path) {
//         return await ipcRenderer.invoke('fs-is-dir', path);
//     }

//     async openDir(path) {
//         return await ipcRenderer.invoke('fs-open-dir', path);
//     }
// }

// 这里需要实现 fsProxy 的功能
ipcMain.handle('fs-read-file', async (event, path) => {
    return fs.readFileSync(path, 'utf-8');
}
);
ipcMain.handle('fs-write-file', async (event, path, data) => {
    fs.writeFileSync(path, data, 'utf-8');
}
);
ipcMain.handle('fs-create-file', async (event, path) => {
    fs.writeFileSync(path, '', 'utf-8');
}
);
ipcMain.handle('fs-read-dir', async (event, path) => {
    return fs.readdirSync(path);
}
);
ipcMain.handle('fs-is-dir', async (event, path) => {
    return fs.statSync(path).isDirectory();
}
);
// 打开文件夹路径
ipcMain.handle('fs-open-dir', async (event, path) => {
    //debug
    console.log(`fs-open-dir:${path}`);
    const { shell } = require('electron');
    shell.openPath(path);
}
);


//-=============================导出=============================
module.exports = {
    setMainWindow
}