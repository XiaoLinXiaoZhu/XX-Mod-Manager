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

//- 这是一个用于批量修改mod信息的插件
//-1. 批量修改mod的 character



const pluginName = 'changeCharacterPlugin';



module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '修改角色插件',
        en: 'Change Character Plugin'
    },
    init(iManager) {

        let pluginData = [];
        // - 开关，清空所有mod的hotkeys 的二次确认开关，用于二次确认
        // let ifClearAllModHotkeys = {
        //     name: 'ifClearAllModHotkeys',
        //     data: false,
        //     type: 'boolean',
        //     displayName: 'If Clear All Mod Hotkeys',
        //     description: 'If true, clear all mod hotkeys',
        //     t_displayName: {
        //         zh_cn: '清空所有mod的热键 - 二次确认',
        //         en: 'Clear All Mod Hotkeys - Confirm'
        //     },
        //     t_description: {
        //         zh_cn: '你需要先将此开关打开才能清空所有mod的热键',
        //         en: 'You need to set this option to true first to clear all mod hotkeys'
        //     },
        //     onChange: (value) => {
        //         console.log('ifClearAllModHotkeys changed:', value);
        //         ifClearAllModHotkeys.data = value;

        //         const snackMessage = {
        //             zh_cn: '清空全部的mod的热键可能会需要一些时间，这取决于你的mod数量，请坐和放宽，不要关闭程序',
        //             en: 'Clearing all mod hotkeys may take some time, depending on the number of mods you have, please be patient and do not close the program'
        //         }
        //         iManager.t_snack(snackMessage);

        //         //需要刷新，将value返回
        //         return value;
        //     }
        // }
        // pluginData.push(ifClearAllModHotkeys);

        // //- 按钮，清空所有mod的hotkeys
        // let clearAllModHotkeys = {
        //     name: 'clearAllModHotkeys',
        //     data: '',
        //     type: 'iconbutton',
        //     displayName: 'Clear All Mod Hotkeys',
        //     description: 'Clear all mod hotkeys',
        //     t_displayName: {
        //         zh_cn: '清空所有mod的热键',
        //         en: 'Clear All Mod Hotkeys'
        //     },
        //     t_description: {
        //         zh_cn: '清空所有mod的热键',
        //         en: 'Clear all mod hotkeys'
        //     },
        //     buttonName: 'clear',
        //     t_buttonName: {
        //         zh_cn: '清空',
        //         en: 'Clear'
        //     },
        //     onChange: () => {
        //         console.log('clearAllModHotkeys clicked');

        //         if (iManager.getPluginData(pluginName, "ifClearAllModHotkeys")) {
        //             // 将 二次确认 开关关闭
        //             iManager.setPluginData(pluginName, "ifClearAllModHotkeys", false);

        //             iManager.showDialog('loading-dialog');
        //             const snackMessage = {
        //                 en: "clear all mod hotkeys",
        //                 zh_cn: "清空所有mod的热键"
        //             }
        //             iManager.t_snack(snackMessage);
        //             iManager.data.modList.forEach(async (mod) => {
        //                 mod.hotkeys = [];
        //                 const modFilePath = path.join(iManager.config.modSourcePath, mod.name, 'mod.json');
        //                 fs.writeFileSync(modFilePath, JSON.stringify(mod, null, 4));
        //             });
        //             iManager.dismissDialog('loading-dialog');

        //             iManager.showDialog('dialog-need-refresh');
        //         }
        //         else {
        //             const snackMessage = {
        //                 en: "You need to set 'If Clear All Mod Hotkeys' to true first",
        //                 zh_cn: "你需要先将 '清空所有mod的热键 - 二次确认' 保持为开启状态"
        //             }
        //             iManager.t_snack(snackMessage, 'error');
        //         }
        //     }
        // }
        // pluginData.push(clearAllModHotkeys);
        //- markdown
        const markdown_cn = `# 批量修改mod的角色
        将角色为 源角色 的mod的角色修改为 目标角色`;
        const markdown_en = `# Change character of mods in batch
        Change the character of mods with source character to target character`;
        let markdown = {
            name: 'markdown',
            data: '',
            type: 'markdown',
            displayName: 'markdown',
            description: 'markdown',
            t_displayName: {
                zh_cn: 'markdown',
                en: 'markdown'
            },
            t_description: {
                zh_cn: markdown_cn,
                en: markdown_en
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        }
        pluginData.push(markdown);

        //- 源角色
        let sourceCharacter = {
            name: 'sourceCharacter',
            data: '',
            type: 'select',
            displayName: 'Source Character',
            description: 'The character you want to change',
            t_displayName: {
                zh_cn: '源角色',
                en: 'Source Character'
            },
            t_description: {
                zh_cn: '你想要修改的角色',
                en: 'The character you want to change'
            },
            options: iManager.data.characterList.map((character) => {
                return {
                    value: character,
                    label: character
                }
            }),
            onChange: (value) => {
                console.log('sourceCharacter changed:', value);
            }
        }

        pluginData.push(sourceCharacter);

        //- 目标角色
        let targetCharacter = {
            name: 'targetCharacter',
            data: '',
            type: 'string',
            displayName: 'Target Character',
            description: 'The character you want to change to',
            t_displayName: {
                zh_cn: '目标角色',
                en: 'Target Character'
            },
            t_description: {
                zh_cn: '你想要修改为的角色',
                en: 'The character you want to change to'
            },
            onChange: (value) => {
                console.log('targetCharacter changed:', value);
                targetCharacter.data = value;
            }
        }
        pluginData.push(targetCharacter);

        //- 按钮，二次确认修改
        let ifChangeCharacter = {
            name: 'ifChangeCharacter',
            data: false,
            type: 'boolean',
            displayName: 'If Change Character',
            description: 'If true, change character',
            t_displayName: {
                zh_cn: '确认修改',
                en: 'Confirm Change'
            },
            t_description: {
                zh_cn: '如果为真，修改角色',
                en: 'If true, change character'
            },
            onChange: (value) => {
                console.log('ifChangeCharacter changed:', value);
                ifChangeCharacter.data = value;

                const snackMessage = {
                    zh_cn: '你需要先将此开关打开才能修改角色',
                    en: 'You need to set this option to true first to change character'
                }
                if (value) {
                    iManager.t_snack(snackMessage);
                }
                //需要刷新，将value返回
                // return value;
            }
        }
        pluginData.push(ifChangeCharacter);

        //- 按钮，修改角色
        let changeCharacter = {
            name: 'changeCharacter',
            data: '',
            type: 'iconbutton',
            displayName: 'Change Character',
            description: 'Change character',
            t_displayName: {
                zh_cn: '修改角色',
                en: 'Change Character'
            },
            t_description: {
                zh_cn: '修改角色',
                en: 'Change character'
            },
            buttonName: 'change',
            t_buttonName: {
                zh_cn: '修改',
                en: 'Change'
            },
            onChange: () => {
                console.log('changeCharacter clicked');

                if (iManager.getPluginData(pluginName, "ifChangeCharacter")) {
                    // 将 二次确认 开关关闭
                    iManager.setPluginData(pluginName, "ifChangeCharacter", false);

                    iManager.showDialog('loading-dialog');
                    const snackMessage = {
                        en: "change character",
                        zh_cn: "修改角色"
                    }
                    iManager.t_snack(snackMessage);

                    const sourceCharacter = iManager.getPluginData(pluginName, "sourceCharacter");
                    const targetCharacter = iManager.getPluginData(pluginName, "targetCharacter");
                    
                    // 检查数据
                    if (sourceCharacter === '' || targetCharacter === '') {
                        const snackMessage = {
                            en: "Please set source character and target character",
                            zh_cn: "请设置源角色和目标角色"
                        }
                        iManager.t_snack(snackMessage, 'error');
                        iManager.dismissDialog('loading-dialog');
                        return;
                    }

                    // 修改mod的character,当所有mod的character都修改完成后，关闭loading-dialog
                    // 使用Promise.all来等待所有的promise完成
                    Promise.all(iManager.data.modList.map(async (mod) => {
                        if (mod.character === sourceCharacter) {
                            mod.character = targetCharacter;
                            // debug
                            console.log('mod:', mod.name, 'character changed to:', mod.character);
                            await mod.saveModInfo();
                        }
                    })).then(() => {
                        iManager.dismissDialog('loading-dialog');
                        iManager.showDialog('dialog-need-refresh');
                    });
                }
                else {
                    const snackMessage = {
                        en: "You need to set 'If Change Character' to true first",
                        zh_cn: "你需要先将 '确认修改' 保持为开启状态"
                    }
                    iManager.t_snack(snackMessage, 'error');
                }
            }
        }
        pluginData.push(changeCharacter);


        iManager.registerPluginConfig(pluginName, pluginData);
    }
};


