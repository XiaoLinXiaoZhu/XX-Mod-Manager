// pluginConfig 是 data 的 数组

const { t_displayName, init } = require("./refreshAfterApplyPlugin");

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

//- 这是一个用于控制 卡片淡入淡出 效果的插件，通过覆盖 mod-card 的 css 样式来实现

const pluginName = 'modCardFadeInOut';

const fadeOutCss = (animationSpeed) => `
.mod-item.hidden {
    display: block !important;

    width: 0px;
    height: 0px;
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

module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '卡片淡入淡出',
        en: 'Card Fade In Out'
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
        });


        let pluginData = [];
        //-是否启用
        let useModCardFadeInOut = {
            name: 'useModCardFadeInOut',
            data: true,
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


        iManager.registerPluginConfig(pluginName, pluginData);
    }
};


