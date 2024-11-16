const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { shell } = require("electron");

const openFolder = (pathName) => {
    shell.openPath(path.join(pathName, "/"))
}

async function getRootDirFromSystemDialog() {
    const rootdir = await ipcRenderer.invoke('get-rootdir');
    //debug
    console.log(rootdir);
    return rootdir;
}

function snack(message, type = 'basic', duration = 4000) {
    //使用自定义的snackbar组件来显示消息
    customElements.get('s-snackbar').show({
        text: message,
        type: type,
        duration: duration
    });
}

async function getFilePathsFromSystemDialog(fileName, fileType) {
    const result = await ipcRenderer.invoke('get-file-path', fileName, fileType);
    if (!result) {
        snack('Invalid file path');
        return '';
    }
    //debug
    console.log(result);
    return result;
}

function translatePage(lang) {
    //获取所有需要翻译的元素
    const elements = document.querySelectorAll('[data-translate-key]');
    //获取翻译文件
    const translationPath = path.join(__dirname, 'locales', `${lang}.json`);
    //读取翻译文件
    const translation = JSON.parse(fs.readFileSync(translationPath));

    let needTranslate = "";
    //遍历所有需要翻译的元素，将其翻译
    elements.forEach(async element => {
        const key = element.getAttribute('data-translate-key');
        if (key in translation) {
            element.textContent = translation[key];
            //debug
            //console.log(`Translate ${key} to ${translation[key]}`);
        }
        else {
            console.log(`Translation for ${key} not found`);
            needTranslate += `"${key}"\n`;
        }
    });
    if (needTranslate != "") {
        console.log(`Translation for the following keys not found:\n${needTranslate}`);
    }
}

//-=======================页面加载完成后的事件=======================

document.addEventListener('DOMContentLoaded', () => {
    //默认切换为英文
    translatePage('en');

    //控制配置文件的创建
    const configPath = path.join(__dirname, 'configs', 'user-config.json');

    //配置属性
    // modRootDir: mod的根目录, 用于存放 需要应用的mod
    // modLoaderDir: modLoader的路径，用于启动modLoader
    // modSourceDIr: modBackpack的路径，是mod的备份目录，位于和modRootDir同级目录下
    // gameDir: 游戏的根目录，用于启动游戏
    // lang: 语言设置

    // rootdir: rootdir 是 不明确的描述，因此将会逐渐被废弃
    let userConfig = {
        lang: localStorage.getItem('lang') || 'en',
        rootdir: localStorage.getItem('rootdir') || '',
        modLoaderDir: localStorage.getItem('modLoaderDir') || '',
        modSourceDIr: localStorage.getItem('modSourceDIr') || '',
        modRootDir: localStorage.getItem('modRootDir') || '',
        gameDir: localStorage.getItem('gameDir') || '',
        ifUseAdmin: localStorage.getItem('ifUseAdmin') || false,
        ifAutoStartGame: localStorage.getItem('ifAutoStartGame') || false,
        ifAutoApply: localStorage.getItem('ifAutoApply') || false,
        ifAutoRefreshInZZZ: localStorage.getItem('ifAutoRefreshInZZZ') || false,
        theme: localStorage.getItem('theme') || 'dark'
    };

    //依次打开 s-dialog 组件，s-dialog 组件会询问用户的默认设置
    //如果用户点击了确认按钮，则保存用户的设置,并且切换到下一个 s-dialog 组件
    //如果用户点击了取消按钮，则不保存用户的设置，并且切换到下一个 s-dialog 组件
    //如果用户点击了关闭按钮，则不保存用户的设置，并且关闭所有的 s-dialog 组件
    const sDialogs = document.querySelectorAll('.s-dialog');

    //各个 s-dialog 组件的引用
    const languagePicker = document.querySelector('#language-picker');
    const selectRootDir = document.querySelector('#select-rootdir');


    //自动移动和手动移动的按钮
    const autoMove = document.querySelector('#auto-move-mod');
    const manualMove = document.querySelector('#manual-move-mod');

    //close按钮
    const closeBtns = document.querySelector('#close-window');

    //debug
    console.log(sDialogs);




    //延时1s打开第一个 s-dialog 组件

    //- 内部函数
    const showDialog = (index) => {
        //debug
        console.log(`showDialog(${index})`);
        if (index < sDialogs.length) {
            sDialogs[index].show();
            sDialogs[index].addEventListener('dismissed', () => {
                showDialog(index + 1);
                saveUserConfig();
            });
        }
    }

    function saveLocalStorage() {
                //将用户设置保存到localStorage中
                localStorage.setItem('lang', userConfig.lang);
                localStorage.setItem('modRootDir', userConfig.modRootDir);
                localStorage.setItem('modLoaderDir', userConfig.modLoaderDir);
                localStorage.setItem('modSourceDIr', userConfig.modSourceDIr);
                localStorage.setItem('gameDir', userConfig.gameDir);
                localStorage.setItem('ifAutoApply', userConfig.ifAutoApply);
                localStorage.setItem('ifAutoRefreshInZZZ', userConfig.ifAutoRefreshInZZZ);
                localStorage.setItem('ifAutoStartGame', userConfig.ifAutoStartGame);
                localStorage.setItem('ifUseAdmin', userConfig.ifUseAdmin);
                localStorage.setItem('theme', userConfig.theme);
    }

    function saveUserConfig() {
        saveLocalStorage();
    }

    function setLang(newLang) {
        //设置语言
        userConfig.lang = newLang;
        //保存用户的设置
        saveUserConfig();
        //debug
        console.log(`lang:${newLang}`);

        //翻译页面
        translatePage(newLang);

        //设置页面同步修改显示情况

        languagePicker.value = newLang;
    }

    //- 监听事件

    //-==================语言选择器的事件监听==================
    languagePicker.addEventListener('click', (event) => {
        //langPicker的子元素是input的radio，所以不需要判断到底点击的是哪个元素，直接切换checked的值即可
        //获取目前的checked的值
        const checked = languagePicker.querySelector('input:checked');

        //如果点击的是当前的语言，则不进行任何操作
        if (!checked) {
            console.log("checked is null");
            return;
        }
        if (checked.id == localStorage.getItem('lang')) {
            return;
        }

        //debug
        console.log(`checked:${checked.id}`);

        //根据checked的id来切换语言
        setLang(checked.id);
    });

    //-==================设置Mod目录的事件监听==================
    const selectModRootDir = document.querySelector('#select-mod-root-dir');
    const selectModRootDirInput = document.querySelector('#select-mod-root-dir-input');
    selectModRootDirInput.addEventListener('click', async () => {
        const modRootDir = await getFilePathsFromSystemDialog('Mods', 'directory');
        //让 select-mod-root-dir-input 的 value属性 为 用户选择的路径
        if (modRootDir !== '') {
            selectModRootDirInput.value = modRootDir;
            userConfig.modRootDir = modRootDir;

            //创建modSource文件夹
            const modSourceDIr = path.join(path.dirname(modRootDir), 'modSource');
            userConfig.modSourceDIr = modSourceDIr;
            if (!fs.existsSync(modSourceDIr)) {
                fs.mkdirSync(modSourceDIr);
            }
            saveUserConfig();
        }
        else {
            snack('Please select your mod root directory');
        }
        //debug
        console.log(modRootDir);
    });

    //-==================展示 modSource 目录的事件监听==================
    const openmodSource = document.querySelector('#open-modSource');
    openmodSource?.addEventListener('click', async () => {
        //增加故障处理
        if (userConfig.modSourceDIr === '' || !fs.existsSync(userConfig.modSourceDIr)) {
            snack('please select Mods root directory first');
            return;
        }
        openFolder(userConfig.modSourceDIr);
    });

    //autoMove按钮的事件监听
    autoMove.addEventListener('click', async () => {
        let ret = await ipcRenderer.invoke('auto-move-mod');
        alert(ret);
    }
    );

    //manualMove按钮的事件监听
    manualMove.addEventListener('click', () => {
        const modSourceDIr = userConfig.modSourceDIr;
        if (fs.existsSync(modSourceDIr)) {
            openFolder(modSourceDIr);
        }
    }
    );

    //-==================设置 auto-start-game ==================
    const autoStartGameSwitch = document.querySelector('#auto-start-game-switch');
    autoStartGameSwitch.addEventListener('change', () => {
        const checked = autoStartGameSwitch.checked;
        // 检查modLoaderDir和gameDir是否存在
        console.log(`modLoaderDir:${userConfig.modLoaderDir},gameDir:${userConfig.gameDir}`);
        if (checked) {
            if (userConfig.modLoaderDir === '' && userConfig.gameDir === '') {
                //debug
                snack('Both modLoaderDir and gameDir are not set, please set them first');
                //恢复原来的ifAutoStartGame
                autoStartGameSwitch.checked = false;
                return;
            }
            if (userConfig.modLoaderDir != '' &&!fs.existsSync(userConfig.modLoaderDir) )
            {
                snack('modLoaderDir is not exist, please set it first');
                autoStartGameSwitch.checked = false;
                return;
            }
            if (userConfig.gameDir != '' && !fs.existsSync(userConfig.gameDir)) {
                snack('gameDir is not exist, please set it first');
                autoStartGameSwitch.checked = false;
                return;
            }
        }
        userConfig.autoRefreshInZZZ = checked;
        saveUserConfig();
        //snack(`Auto Start Game is now ${autoStartGameSwitch.checked ? 'enabled' : 'disabled'}`);
    });

    //-==================设置 modLoader 目录的事件监听==================
    const selectModLoaderDir = document.querySelector('#select-mod-loader-dir');
    const selectModLoaderDirInput = document.querySelector('#select-mod-loader-dir-input');
    selectModLoaderDirInput.addEventListener('click', async () => {
        const modLoaderDir = await getFilePathsFromSystemDialog('3dmigoto.exe', 'exe');
        //让 select-mod-loader-dir-input 的 value属性 为 用户选择的路径
        if (modLoaderDir !== '') {
            selectModLoaderDirInput.value = modLoaderDir;
            userConfig.modLoaderDir = modLoaderDir;
            saveUserConfig();
        }
        else {
            snack('Please select your modLoader.exe');
        }
        //debug
        console.log(modLoaderDir);
    });

    //-==================设置 游戏文件 的事件监听==================
    const selectGameDir = document.querySelector('#select-game-dir');
    const selectGameDirInput = document.querySelector('#select-game-dir-input');
    selectGameDirInput.addEventListener('click', async () => {
        const gameDir = await getFilePathsFromSystemDialog('zzz.exe', 'exe');
        //让 select-game-dir-input 的 value属性 为 用户选择的路径
        if (gameDir !== '') {
            selectGameDirInput.value = gameDir;
            userConfig.gameDir = gameDir;
            saveUserConfig();
        }
        else {
            snack('Please select your game root directory');
        }
        //debug
        console.log(gameDir);
    });


    //-==================设置 auto-apply,auto-refresh-in-zzz 的事件监听==================
    const autoApplySwitch = document.querySelector('#auto-apply-switch');
    autoApplySwitch.addEventListener('change', () => {
        userConfig.ifAutoApply = autoApplySwitch.checked;
        saveUserConfig();
        //snack(`Auto Apply is now ${autoApplySwitch.checked ? 'enabled' : 'disabled'}`);
    });

    const autoRefreshInZZZSwitch = document.querySelector('#auto-refresh-in-zzz-switch');
    autoRefreshInZZZSwitch.addEventListener('change', () => {
        const checked = autoRefreshInZZZSwitch.checked;
        userConfig.ifAutoRefreshInZZZ = checked;
        saveUserConfig();
        //snack(`Auto Refresh in ZZZ is now ${autoRefreshInZZZSwitch.checked ? 'enabled' : 'disabled'}`);
    });

    //-==================设置 use-admin 的事件监听==================
    const useAdminSwitch = document.querySelector('#use-admin-switch');
    useAdminSwitch.addEventListener('change', () => {
        userConfig.ifUseAdmin = useAdminSwitch.checked;
        saveUserConfig();
        //snack(`Use Admin is now ${useAdminSwitch.checked ? 'enabled' : 'disabled'}`);
    });


    //最后一个 s-dialog 组件的事件监听
    sDialogs[sDialogs.length - 1].addEventListener('dismissed', () => {
        saveUserConfig();
        //控制显隐，将标题显示的正在加载变为已完成
        const loading = document.querySelector('#loading');
        loading.style.display = 'none';
        const loaded = document.querySelector('#loaded');
        loaded.style.display = 'block';

        // debug
        // 输出当前的所有配置
        console.log(userConfig);

        // 输出当前的 localStorage
        console.log(localStorage);

    }
    );

    //close按钮的事件监听
    closeBtns.addEventListener('click', () => {
        window.close();
    }
    );


    //- 默认触发
    setTimeout(() => {
        showDialog(0);
    }, 500);
}
);

