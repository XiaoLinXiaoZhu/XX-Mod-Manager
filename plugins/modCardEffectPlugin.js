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

//- 这是一个用于控制 卡片 特殊效果的插件
//-1. 卡片淡入淡出 效果的插件
//-2. 当卡片被 hover 时，切换 currentCard 的效果



const pluginName = 'modCardEffect';

const fadeOutCss = (animationSpeed) => `
.mod-item.hidden {
    display: block !important;

    width: 0px !important;
    height: 0px !important;
    padding: 0px !important;
    margin: 0px !important;
    border: 0px !important;
    opacity: 0;
    transform: scale(0.2) !important;

    transition: all ${animationSpeed}s, height ${animationSpeed / 2}s ease-in-out ${animationSpeed / 2}s, width ${animationSpeed / 2}s ease-in-out ${animationSpeed / 2}s !important;
}
`;

// .mod-item.hidden {
//     width: 0px;
//     height: 0px;
//     padding: 0px !important;
//     margin: 0px !important;
//     border: 0px !important;
//     opacity: 0;
//     transform: scale(0.2) !important;

//     transition: all 0.2s, height 0.1s ease-in-out 0.1s, width 0.1s ease-in-out 0.1s;
// }

const modCardCss = (animationSpeed) => `
.mod-item {
    float: left;
    margin: 6px;
    opacity: 1;
    transition: x, y 0.5s cubic-bezier(.36, -0.64, .34, 1.76), height ${animationSpeed}s ease-in-out ${animationSpeed / 2}s, width ${animationSpeed}s ease-in-out ${animationSpeed / 2}s,opacity ${animationSpeed}s ease-in-out ${animationSpeed / 2}s,border ${animationSpeed}s ease-in-out ,transform ${animationSpeed}s ease-in-out ${animationSpeed / 2}s !important;
}
`;



const modContainerCss = `
#mod-container {
    display: block !important;
    height: fit-content;
}
`;


function addHoverEffect (document, iManager) {
    document.querySelectorAll('.mod-item').forEach((item) => {
        item.addEventListener('mouseover', () => {
            const modName = item.getAttribute('id');
            //debug
            console.log('hoverSwitchCurrentCard:', modName);
            // iManager.setLastClickedMod_ByName(modName);
            iManager.setCurrentModByName(modName);
        });
    });
};
function removeHoverEffect(document, iManager) {
    document.querySelectorAll('.mod-item').forEach((item) => {
        item.removeEventListener('mouseover', () => {
            const modName = item.getAttribute('id');
            //debug
            console.log('hoverSwitchCurrentCard:', modName);
            // iManager.setLastClickedMod_ByName(modName);
            iManager.setCurrentModByName(modName);
        });
    });
};



module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '卡片效果',
        en: 'Mod Card Effect'
    },
    init(iManager) {

        iManager.on("initDone", () => {
            let useModCardFadeInOut = iManager.getPluginData(pluginName, 'useModCardFadeInOut');
            if (useModCardFadeInOut) {
                const fadeInSpeed = iManager.getPluginData(pluginName, 'fadeInSpeed');
                const fadeOutSpeed = iManager.getPluginData(pluginName, 'fadeOutSpeed');
                iManager.addCssWithHash(fadeOutCss(fadeOutSpeed));
                iManager.addCssWithHash(modCardCss(fadeInSpeed));
                iManager.addCssWithHash(modContainerCss);
            }

            let hoverSwitchCurrentCard = iManager.getPluginData(pluginName, 'hoverSwitchCurrentCard');
            if (hoverSwitchCurrentCard) {
                addHoverEffect(document, iManager);
            }
        });


        let pluginData = [];
        //-是否启用
        let useModCardFadeInOut = {
            name: 'useModCardFadeInOut',
            data: false,
            type: 'boolean',
            displayName: 'Use Mod Card Fade In Out',
            description: 'If true, the mod card will fade in and out',
            t_displayName: {
                zh_cn: '使用卡片淡入淡出',
                en: 'Use Mod Card Fade In Out'
            },
            t_description: {
                zh_cn: '开启后,mod卡片在显示和隐藏时会有淡入淡出效果，但是会有一定的性能消耗',
                en: 'If true, the mod card will fade in and out, but it will consume some performance'
            },
            onChange: (value) => {
                useModCardFadeInOut.data = value;
                const fadeInSpeed = iManager.getPluginData(pluginName, 'fadeInSpeed');
                const fadeOutSpeed = iManager.getPluginData(pluginName, 'fadeOutSpeed');

                console.log(`useModCardFadeInOut changed: ${value}`, fadeInSpeed, fadeOutSpeed);
                if (value) {
                    iManager.addCssWithHash(fadeOutCss(fadeOutSpeed));
                    iManager.addCssWithHash(modCardCss(fadeInSpeed));
                    iManager.addCssWithHash(modContainerCss);
                } else {
                    iManager.removeCssWithHash(fadeOutCss(fadeOutSpeed));
                    iManager.removeCssWithHash(modCardCss(fadeInSpeed));
                    iManager.removeCssWithHash(modContainerCss);
                }
            }
        };
        pluginData.push(useModCardFadeInOut);

        //- 动画速度,分为fade in 和 fade out 两个部分
        let fadeInSpeed = {
            name: 'fadeInSpeed',
            data: 0.5,
            type: 'number',
            displayName: 'Fade In Speed',
            description: 'The speed of the fade in animation',
            t_displayName: {
                zh_cn: '淡入速度',
                en: 'Fade In Speed'
            },
            t_description: {
                zh_cn: '淡入动画的速度,单位为秒',
                en: 'The speed of the fade in animation, in seconds'
            },
            onChange: (value) => {
                console.log('fadeInSpeed changed:', value);
                const fadeOutSpeed = iManager.getPluginData(pluginName, 'fadeOutSpeed');
                const ifUse = iManager.getPluginData(pluginName, 'useModCardFadeInOut');

                if (ifUse) {
                    iManager.removeCssWithHash(fadeOutCss(fadeOutSpeed));
                    iManager.removeCssWithHash(modCardCss(fadeInSpeed.data));
                    iManager.addCssWithHash(fadeOutCss(fadeOutSpeed));
                    iManager.addCssWithHash(modCardCss(value));
                }

                fadeInSpeed.data = value;
            }
        };
        pluginData.push(fadeInSpeed);

        let fadeOutSpeed = {
            name: 'fadeOutSpeed',
            data: 0.2,
            type: 'number',
            displayName: 'Fade Out Speed',
            description: 'The speed of the fade out animation',
            t_displayName: {
                zh_cn: '淡出速度',
                en: 'Fade Out Speed'
            },
            t_description: {
                zh_cn: '淡出动画的速度,单位为秒',
                en: 'The speed of the fade out animation, in seconds'
            },
            onChange: (value) => {
                console.log('fadeOutSpeed changed:', value);
                fadeOutSpeed.data = value;
                const fadeInSpeed = iManager.getPluginData(pluginName, 'fadeInSpeed');
                const ifUse = iManager.getPluginData(pluginName, 'useModCardFadeInOut');

                if (ifUse) {
                    iManager.removeCssWithHash(fadeOutCss(fadeOutSpeed.data));
                    iManager.removeCssWithHash(modCardCss(fadeInSpeed));
                    iManager.addCssWithHash(fadeOutCss(value));
                    iManager.addCssWithHash(modCardCss(fadeInSpeed));
                }

                fadeOutSpeed.data = value;
            }
        };
        pluginData.push(fadeOutSpeed);

        let divider = {
            name: 'divider',
            data: '',
            type: 'markdown',
            displayName: 'markdown divider',
            description: 'markdown divider',
            t_displayName: {
                zh_cn: 'markdown divider',
                en: 'markdown divider'
            },
            t_description: {
                zh_cn: '---',
                en: '---'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        };
        pluginData.push(divider);

        //- 当卡片被 hover 时，切换 currentCard 的效果
        let hoverSwitchCurrentCard = {
            name: 'hoverSwitchCurrentCard',
            data: false,
            type: 'boolean',
            displayName: 'Hover Switch Current Card',
            description: 'If true, the current card will be switched when hover on the mod card',
            t_displayName: {
                zh_cn: '鼠标悬停切换当前卡片',
                en: 'Hover Switch Current Card'
            },
            t_description: {
                zh_cn: '当鼠标悬停在mod卡片上时，右侧的卡片详情会切换到当前卡片',
                en: 'If true, the details of the current card will be switched when hover on the mod card'
            },
            onChange: (value) => {
                console.log('hoverSwitchCurrentCard changed:', value);
                if (value) {
                    addHoverEffect(document, iManager);
                }
                else {
                    removeHoverEffect(document, iManager);
                }

                hoverSwitchCurrentCard.data = value;
            }
        };
        pluginData.push(hoverSwitchCurrentCard);

        //- 隐藏卡片下的快捷键提示
        let hideModCardSwapKey = {
            name: 'hideModCardSwapKey',
            data: false,
            type: 'boolean',
            displayName: 'Hide Mod Card Swap Key',
            description: 'If true, the swap key of the mod card will be hidden',
            t_displayName: {
                zh_cn: '隐藏卡片切换快捷键',
                en: 'Hide Mod Card Swap Key'
            },
            t_description: {
                zh_cn: '隐藏卡片下的快捷键提示',
                en: 'If true, the swap key of the mod card will be hidden'
            },
            onChange: (value) => {
                console.log('hideModCardSwapKey changed:', value);
                hideModCardSwapKey.data = value;
                if (value) {
                    iManager.addCssWithHash(`
                    .mod-item .hotkey-container {
                        display: none !important;
                    }
                    `);
                } else {
                    iManager.removeCssWithHash(`
                    .mod-item .hotkey-container {
                        display: none !important;
                    }
                    `);
                }
            }
        };
        pluginData.push(hideModCardSwapKey);


        iManager.registerPluginConfig(pluginName, pluginData);
    }
};


