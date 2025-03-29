// 导入 ipcRenderer
const { ipcRenderer } = require('electron')

const pluginName = 'pinWindowPlugin'

// 将该配置项 提升到全局，方便其他地方调用
let currentPinState;

// 添加置顶窗口按钮，点击后窗口置顶
const addPinWindowButton = (iManager) => {
    // 创建一个按钮，仿照原有的按钮
    const pinButton = document.createElement('s-icon-button')
    pinButton.setAttribute('slot', 'trigger')
    pinButton.setAttribute('class', 'OO-button')
    pinButton.setAttribute('style', 'color: var(--s-color-on-surface);margin: 0 10px 0 10px;transform: scale(0.95);')
    const pinIcon = document.createElement('s-icon')
    pinIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
  <path d="M240-240v-80h480v80H240Zm240-496 240 240-56 56-184-184-184 184-56-56 240-240Z"></path>
</svg>`
    pinButton.appendChild(pinIcon)
    const pinText = document.createElement('p')
    pinText.innerText = 'Pin'
    const pinTooltip = document.createElement('s-tooltip')
    pinTooltip.appendChild(pinButton)
    pinTooltip.appendChild(pinText)

    // 添加到原有的按钮组中
    const buttons = document.querySelector('.bottom-left')
    if (!buttons) {
        return
    }
    buttons.appendChild(pinTooltip)

    // 添加点击事件
    pinButton.onclick = () => {
        handlePinButtonClicked(iManager)
    }
}

// 点击置顶按钮的回调
const handlePinButtonClicked = (iManager) => {
    // 向主进程发送消息，请求置顶窗口
    let pingState = iManager.getPluginData(pluginName, 'pingState')
    if (!pingState) {
        pingState = false
    }
    iManager.setPluginData(pluginName, 'pingState', !pingState)
}

const setPinState = (iManager, state) => {
    //debug
    currentPinState.data = state

    if (state) {
        iManager.t_snack({
            zh_cn: '置顶窗口',
            en: 'Pin window'
        }, 'info')

        ipcRenderer.invoke('pin-window');
    }
    else {
        iManager.t_snack({
            zh_cn: '取消置顶窗口',
            en: 'Unpin window'
        }, 'info')

        ipcRenderer.invoke('unpin-window');
    }
}


// 导出插件
module.exports = {
    name: pluginName,
    t_displayName: {
        zh_cn: '窗口置顶',
        en: 'Pin Window'
    },
    init(iManager) {
        iManager.on("pluginLoaded", (iManager) => {
            const ifAble = iManager.getPluginData(pluginName, 'ifAblePlugin')
            if (ifAble) {
                addPinWindowButton(iManager)
                // 如果继承上次的状态，则设置当前状态为上次的状态
                const ifInherit = iManager.getPluginData(pluginName, 'ifInherit')
                if (ifInherit) {
                    const lastPinState = iManager.getPluginData(pluginName, 'pingState')
                    setPinState(iManager, lastPinState)
                }
                else {
                    setPinState(iManager, false)
                }
            }
        });

        let pluginData = [];

        let markdown = {
            name: `markdown`,
            data: '',
            type: 'markdown',
            t_displayName: {
                'zh_cn': '窗口置顶',
                'en': 'Pin Window'
            },
            t_description: {
                'zh_cn': '在mod页面添加一个按钮，点击后可以置顶窗口\n# 使用方法\n点击按钮即可置顶窗口\n再次点击取消置顶',
                'en': 'Add a button to the mod page, click to pin the window\n# Usage\nClick the button to pin the window\nClick again to cancel pinning'
            },
            onChange: (value) => {
                // markdown 类型的数据不会触发 onChange,它只作为展示
            }
        }
        pluginData.push(markdown)

        let ifAblePlugin = {
            name: 'ifAblePlugin',
            data: false,
            type: 'boolean',
            displayName: 'ifAblePlugin',
            t_displayName: {
                'zh_cn': '是否启用',
                'en': 'Enable'
            },
            onChange: (value) => {
                console.log('ifAblePlugin changed:', value)
                ifAblePlugin.data = value

                if (value) {
                    addPinWindowButton(iManager)
                } else {
                    const pinButton = document.querySelector('.OO-button')
                    pinButton.remove()
                    setPinState(iManager, false)
                }
            }
        }
        pluginData.push(ifAblePlugin)

        // 是否继承上次的状态
        let ifInherit = {
            name: 'ifInherit',
            data: true,
            type: 'boolean',
            displayName: 'ifInherit',
            t_displayName: {
                'zh_cn': '继承上次状态',
                'en': 'Inherit last state'
            },
            onChange: (value) => {
                console.log('ifInherit changed:', value)
                ifInherit.data = value
            }
        }
        pluginData.push(ifInherit)

        currentPinState = {
            name: 'pingState',
            data: false,
            type: 'boolean',
            displayName: 'pingState',
            t_displayName: {
                'zh_cn': '当前置顶状态',
                'en': 'Current Pin State'
            },
            onChange: (value) => {
                console.log('pingState changed:', value);
                currentPinState.data = value;
                setPinState(iManager, value)
            }
        }
        pluginData.push(currentPinState)

        iManager.registerPluginConfig(pluginName, pluginData)
        
    }
}