const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('fs')
const { ipcMain } = require('electron')

let currentMainWindow = null;
function setMainWindow(mainWindow) {
    currentMainWindow = mainWindow;
}


function snack (message,type = 'info') {
    const mainWindow = currentMainWindow;
    //console.log(mainWindow);
    console.log(`snack:${message} type:${type}`);
    mainWindow.webContents.send('snack', message,type);
}
// 这里为渲染进程提供 读取文件的功能。

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
    else{
        fs.writeFileSync(filePath, JSON.stringify({}), 'utf-8');
        console.log(`file not exists:${filePath}`);
        return {};
    }
}

ipcMain.handle('get-current-config', async (event) => {
    return await getCurrentConfig();
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

function tryGetModPreview(modPath,modConfigPreviewName){
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

function creatMod(modPath){
    const mod = {
        name: path.basename(modPath),
        character: 'Unknown',
        preview : '',
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

        const modPreview = tryGetModPreview(modPath,modConfig.preview);
        mod.preview = modPreview.previewPath;
        mod.state = modPreview.state;
        mod.snack = modPreview.snack;
    }

    return mod;
}
function getMods(modSourcePath) {
    const mods = [];
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
ipcMain.handle('set-mod-info', async (modPath,field,value) => {
    setModInfoFiled(modPath, field, value);
});








//-=============================导出=============================
module.exports = {
    setMainWindow
}