// pluginConfig 是 data 的 数组

// data 为一个对象，包含了插件的可配置数据，比如说是否启用，是否显示等等
// 它会被 解析 之后 在 设置页面 中显示，并且为 插件提供数据
// 当它发生变化时，会触发 插件的 onChange 方法

// data 的格式为
// {
//     name: 'ifAblePlugin',
//     data: true,
//     type: 'boolean',
//     displayName: 'If Able Plugin',
//     description: 'If true, the plugin will be enabled',
//     t_displayName:{
//         zh_cn:'是否启用插件',
//         en:'Enable Plugin'
//     },
//     t_description:{
//         zh_cn:'如果为真，插件将被启用',
//         en:'If true, the plugin will be enabled'
//     },
//     onChange: (value) => {
//         console.log('ifAblePlugin changed:', value);
//     }
// }

const fs = require('fs');
const path = require('path');
const pluginName = 'deleteModPlugin';
// 这是一个用来在 编辑mod信息页面 增加一个 删除mod 按钮的插件

function removeModFromList(iManager, modName) {
    // 不再需要刷新页面，直接删除mod信息
    // iManager.showDialog('dialog-need-refresh');

    iManager.data.modList = iManager.data.modList.filter((mod) => {
        return mod.name !== modName;
    });

    // 如果currentMod是modName，则清空currentMod
    if (iManager.temp.currentMod.name === modName) {
        iManager.setCurrentMod(iManager.data.modList[0]);
    }

    // 刷新角色列表
    iManager.refreshCharacterList();

    //! 这是不好的做法，应当将事件的调用逻辑单独拎出来
    //! 现在很多地方都直接调用了事件，这样会导致代码的耦合性很高
    iManager.trigger('addMod');

    // 使得编辑mod信息页面消失
    iManager.dismissDialog('edit-mod-dialog');
}
function deleteMod(iManager, modName) {
    iManager.snack('删除mod: '+modName, 'error');

    // 删除mod
    // 删除mod文件夹
    const modPath = path.join(iManager.config.modSourcePath, modName);
    if (fs.existsSync(modPath)) {
        // 判断是否使用回收站
        const ifUseRecycleBin = iManager.getPluginData(pluginName, 'useRecycleBin');

        if (!ifUseRecycleBin) {
            // 直接删除
            fs.rmdir(modPath, {recursive: true}, (err) => {
                if (err) {
                    iManager.snack('删除mod失败: '+modName, 'error');
                    console.error(err);
                } else {
                    iManager.snack('已删除mod: '+modName, 'info');
                    removeModFromList(iManager, modName);
                }
            });
            return;
        }

        // 将其移动到回收站
        const recycleBin = 'recycleBin';
        let recycleBinPath = path.join(iManager.config.modSourcePath, recycleBin, modName);
        // 如果回收站不存在，创建回收站
        if (!fs.existsSync(path.join(iManager.config.modSourcePath, recycleBin))) {
            fs.mkdirSync(path.join(iManager.config.modSourcePath, recycleBin));
        }
        // 如果回收站已经存在，判断是否有同名文件夹
        if (fs.existsSync(recycleBinPath)) {
            iManager.snack('回收站已存在同名mod, 将当前时间加到mod名字后面', 'info');
            // 将当前时间加到mod名字后面
            const now = new Date();
            const nowStr = now.toISOString().replace(/:/g, '-').replace(/\./g, '-');
            recycleBinPath = path.join(iManager.config.modSourcePath, recycleBin, modName+'-'+nowStr);
        }
        //debug
        console.log('modPath:', modPath, 'recycleBinPath:', recycleBinPath);
        fs.rename(modPath, recycleBinPath, (err) => {
            if (err) {
                iManager.snack('删除mod失败: '+modName, 'error');
                console.error(err);
            } else {
                iManager.snack('已将mod移动到回收站: '+modName, 'info');
                removeModFromList(iManager, modName);
            }
        });
    } else {
        iManager.snack('mod文件夹不存在: '+modPath, 'error');
    }
}

function addDeleteButton(iManager){
    // 在编辑mod信息页面增加一个删除mod的按钮
    // 在 id=edit-mod-info-content 的 div 的 第一个 div 内的 第一个 s-button 内增加一个删除mod的按钮
    const deleteButton = document.createElement('s-icon-button');
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"></path>
</svg>`
    deleteButton.style.marginRight = '10px';
    deleteButton.style.color = 'red';
    deleteButton.style.zIndex = '1'; 
    deleteButton.style.position = 'relative';
    deleteButton.style.left = '23px';
    deleteButton.classList.add('OO-button');

    // 单击时弹出提示
    deleteButton.onclick = () => {
        const modName = document.getElementById('editDialog-mod-info-name').innerHTML;
        iManager.snack('双击以删除mod: '+modName, 'info');
    }

    // 双击时删除mod
    deleteButton.ondblclick = () => {
        const modName = document.getElementById('editDialog-mod-info-name').innerHTML;
        deleteMod(iManager, modName);
    }

    const editModInfoContent = document.getElementById('edit-mod-info-content');
    if (editModInfoContent) {
        const firstDiv = editModInfoContent.querySelector('div');
        console.log('firstDiv:', firstDiv);
        if (firstDiv) {
            const targetElement = firstDiv.querySelector('#edit-mod-name');
            console.log('edit-mod-name:', targetElement);
            if (targetElement) {
                firstDiv.insertBefore(deleteButton, targetElement);
                iManager.snack('add delete button');
                return;
            }
        }
    }

    iManager.snack('add delete button failed', 'error');
    return;
}

module.exports = {
    name: pluginName,
    t_displayName:{
        zh_cn:'删除mod插件',
        en:'Delete Mod Plugin'
    },
    init(iManager){

        iManager.on("pluginLoaded", (iManager) => {
            // debug
            const ifAble = iManager.getPluginData(pluginName, 'ifAblePlugin')
            // iManager.snack('deleteModPlugin Loaded from '+__dirname + ' ifAble:'+ifAble);
            if (ifAble) {
                addDeleteButton(iManager);
            }
        }
        );



        let pluginData = [];

        let markdown = {
            name: 'markdown',
            data: '',
            type: 'markdown',
            displayName: 'Delete Mod',
            description: 'Delete the mod',
            t_displayName:{
                zh_cn:'删除mod',
                en:'Delete Mod'
            },
            t_description:{
                zh_cn:'# 在编辑mod信息页面增加一个删除mod的按钮\n点击按钮后，会删除mod',
                en:'# Add a delete mod button on the edit mod info page\nClick the button, it will delete the mod'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        };
        pluginData.push(markdown);

        let ifAblePlugin = {
            name: 'ifAblePlugin',
            data: true,
            type: 'boolean',
            displayName: 'If Able Plugin',
            t_displayName:{
                zh_cn:'是否启用插件',
                en:'Enable Plugin'
            },
            onChange: (value) => {
                console.log('ifAblePlugin changed:', value);
                ifAblePlugin.data = value;

                if (value) {
                    addDeleteButton(iManager);
                } else {
                    iManager.showDialog("dialog-need-refresh");
                }
            }
        };
        pluginData.push(ifAblePlugin);

        // 是否使用回收站
        let useRecycleBin = {
            name: 'useRecycleBin',
            data: true,
            type: 'boolean',
            displayName: 'Use Recycle Bin',
            t_displayName:{
                zh_cn:'使用回收站',
                en:'Use Recycle Bin'
            },
            description: 'If true, the mod will be moved to a recycle bin under the mod source path',
            t_description:{
                zh_cn:'如果为真，mod将被移动到mod源路径下的回收站',
                en:'If true, the mod will be moved to a recycle bin under the mod source path'
            },
            onChange: (value) => {
                console.log('useRecycleBin changed:', value);
                useRecycleBin.data = value;
            }
        };
        pluginData.push(useRecycleBin);

        iManager.registerPluginConfig(pluginName, pluginData);
    }
}
