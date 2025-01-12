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

//- 这是一个用来 将 mod的状态 也一并保存到预设中的插件
//- 1. 切换预设后，将前一个预设的mod状态保存，并且将新的预设的mod状态加载

const pluginName = 'rememberModState';
const fs = require('fs');
const path = require('path');

let lastPreset = null;

const saveModStateToPreset = (iManager, preset) => {
    let modStatePath = iManager.getPluginData(pluginName, 'modStatePath');
    let presetPath = iManager.config.presetPath;
    let modState = fs.readFileSync(modStatePath, 'utf-8');
    let presetFile = path.join(presetPath, `${preset}.ini`);
    //debug
    console.log('saveModStateToPreset:', presetFile, modState);
    fs.writeFileSync(presetFile, modState);
    console.log('saveModStateToPreset:', presetFile);
}

const loadModStateFromPreset = (iManager, preset) => {
    let modStatePath = iManager.getPluginData(pluginName, 'modStatePath').data;
    let presetPath = iManager.config.presetPath;
    let presetFile = path.join(presetPath, `${preset}.ini`);
    if (!fs.existsSync(presetFile)) {
        console.log('presetFile not exist:', presetFile);
        const snackMessage = {
            zh_cn: '预设文件不存在',
            en: 'Preset file not exist'
        };
        iManager.t_snack(snackMessage, 'error');
        return;
    }
    let modState = fs.readFileSync(presetFile, 'utf-8');
    fs.writeFileSync(modStatePath, modState);
    console.log('loadModStateFromPreset:', presetFile, modState);
}




module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '记住mod状态',
        en: 'Remember Mod State'
    },
    init(iManager) {
        iManager.on('currentPresetChanged', async (preset) => {
            if (!iManager.getPluginData(pluginName, 'ifRememberModState')) {
                return;
            }

            // 保存 上一次的预设 对应的mod状态
            if (lastPreset && lastPreset !== 'default') {
                saveModStateToPreset(iManager, lastPreset);
            }
            
            // 加载 新的预设 对应的mod状态
            // 如果是default预设，不加载mod状态
            if (!preset) return;
            if (preset === lastPreset) return;
            if (preset === 'default') return;

            loadModStateFromPreset(iManager, preset);
            lastPreset = preset;
        });

        // return;
        let pluginData = [];

        //- markdown 介绍
        let markdown = {
            name: 'markdown',
            data: '',
            type: 'markdown',
            displayName: 'Introduction',
            description: 'Introduction of the plugin',
            t_displayName: {
                zh_cn: '介绍',
                en: 'Introduction'
            },
            t_description: {
                zh_cn: '本插件会将mod的切换状态和预设一起保存，切换预设的时候，mod的状态也会被保存\n\n' +
                    '注意：如果记住mod状态的话，需要设置mod状态文件路径。\n其一般位于3dmigoto的同目录下，或者core文件夹内，名称为d3dx_user.ini',
                en: 'This plugin will save the mod switch state with the preset, and the mod state will be saved when switching the preset\n\n' +
                    'Note: If you want to remember the mod state, you need to set the mod state file path, which is generally located in the same directory as 3dmigoto, or in the core folder, named d3dx_user.ini'
            }
        };
        pluginData.push(markdown);

        //- 3dmigoto 保存 mod状态的 文件路径
        let modStatePath = {
            name: 'modStatePath',
            data: '',
            type: 'ini',
            displayName: 'Mod State Path',
            description: 'The path of the file to save mod state',
            t_displayName: {
                zh_cn: 'mod状态文件路径',
                en: 'Mod State Path'
            },
            t_description: {
                zh_cn: '保存mod状态的文件路径',
                en: 'The path of the file to save mod state'
            },
            onChange: (value) => {
                console.log('modStatePath changed:', value);
                modStatePath.data = value;
            }
        };
        pluginData.push(modStatePath);

        //- 是否记住mod状态
        let ifRememberModState = {
            name: 'ifRememberModState',
            data: true,
            type: 'boolean',
            displayName: 'Remember Mod State',
            description: 'If true, the mod state will be remembered',
            t_displayName: {
                zh_cn: '记住mod状态',
                en: 'Remember Mod State'
            },
            t_description: {
                zh_cn: '如果为真，mod状态将被记住',
                en: 'If true, the mod state will be remembered'
            },
            onChange: (value) => {
                console.log('ifRememberModState changed:', value);
                // 确保 modStatePath 是一个合法的路径
                if (value) {
                    let path = iManager.getPluginData(pluginName, 'modStatePath');
                    // 1. 检查路径不为空
                    if (!path) {
                        console.log('modStatePath is empty');
                        const snackMessage = {
                            zh_cn: 'mod状态文件路径为空',
                            en: 'Mod state file path is empty'
                        };
                        iManager.t_snack(snackMessage, 'error');
                        ifRememberModState.data = false;
                        return false;
                    }
                    // 2. 检查路径是否存在
                    if (!fs.existsSync(path)) {
                        console.log('modStatePath not exist:', path);
                        const snackMessage = {
                            zh_cn: 'mod状态文件路径不存在',
                            en: 'Mod state file path not exist'
                        };
                        iManager.t_snack(snackMessage, 'error');
                        ifRememberModState.data = false;
                        return false;
                    }
                }
                // 检查 预设文件夹是否存在
                let presetPath = iManager.config.presetPath;
                if (!presetPath) {
                    console.log('presetPath is empty');
                    const snackMessage = {
                        zh_cn: '预设文件夹为空',
                        en: 'Preset folder is empty'
                    };
                    iManager.t_snack(snackMessage, 'error');
                    ifRememberModState.data = false;
                    return false;
                }
                if (!fs.existsSync(presetPath)) {
                    console.log('presetPath not exist:', presetPath);
                    const snackMessage = {
                        zh_cn: '预设文件夹不存在',
                        en: 'Preset folder not exist'
                    };
                    iManager.t_snack(snackMessage, 'error');
                    ifRememberModState.data = false;
                    return false;
                }

                ifRememberModState.data = value;
            }
        };
        pluginData.push(ifRememberModState);

        


        iManager.registerPluginConfig(pluginName, pluginData);
    }
}

