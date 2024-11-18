const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('fs')
const { ipcMain } = require('electron')
const { preview } = require('vite')

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

ipcMain.handle('getCurrentConfig', async (event) => {
    const dataPath = app.getPath('userData');
    const filePath = path.join(dataPath, 'config.json');

    if (fs.existsSync(filePath)) {
        return await readFile(filePath)
    }
    else {
        fs.writeFileSync(filePath, JSON.stringify({}), 'utf-8');
        return '{}'
    }
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
    const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
    //如果没有图片文件，则使用默认图片,之后直接跳出程序
    if (imageFiles.length <= 0) {
        return {
            previewPath: path.join(__dirname, '../assets/default.jpg'),
            previewName: 'default.jpg',
            state: 0,
            snack: 'No image file found in mod folder, use default image instead'
        }
    }

    modPreviewPath = imageFiles[0];
    //debug
    //console.log(`modImageName:${modImageName}`);
    return {
        previewPath: path.join(modPath, modPreviewPath),
        previewName: modPreviewPath,
        state: 1,
        snack: ''
    }

}
function creatMod(modPath){
    const mod = {
        name: path.basename(modPath),
        character: '',
        preview : '',
        description: '',
        url: '',
        hotkeys: []
    }

    const modConfigPath = path.join(modPath, 'mod.json');
    if (fs.existsSync(modConfigPath)) {
        const modConfig = JSON.parse(fs.readFileSync(modConfigPath, 'utf-8'));
        mod.character = modConfig.character;
        mod.preview = modConfig.preview;
        mod.description = modConfig.description;
        mod.url = modConfig.url;
        mod.hotkeys = modConfig.hotkeys;
    }
        
}
function getMods(modSourcePath) {
}


ipcMain.handle('get-mods', async (modSourcePath) => {

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