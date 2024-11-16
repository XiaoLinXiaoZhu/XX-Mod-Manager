const { ipcRenderer, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { shell } = require('electron');

//HMC 尽量不要在渲染进程中使用
const HMC = require("hmc-win32");
const { get } = require('http');
const { loadEnvFile } = require('process');


document.addEventListener('DOMContentLoaded', async () => {

    //------------user-config----------------
    let lang = localStorage.getItem('lang') || 'en';
    let theme = localStorage.getItem('theme') || 'dark';
    let isFullScreen = localStorage.getItem('fullscreen') === 'true';
    const bounds = localStorage.getItem('bounds');

    // modRootDir: modLoader用于加载mod的根目录
    let modRootDir = localStorage.getItem('modRootDir') || __dirname;
    // modSourceDir: mod的存储目录
    let modSourceDir = localStorage.getItem('modSourceDir') || '';

    //是否自动应用,自动在zzz中刷新，使用管理员权限
    let ifAutoApply = localStorage.getItem('ifAutoApply') || false;
    let ifAutoRefreshInZZZ = localStorage.getItem('ifAutoRefreshInZZZ') || false;
    let ifUseAdmin = localStorage.getItem('ifUseAdmin') || false;

    //是否自动启动游戏
    let ifAutoStartGame = localStorage.getItem('ifAutoStartGame') || false;
    let gameDir = localStorage.getItem('gameDir') || '';
    let modLoaderDir = localStorage.getItem('modLoaderDir') || '';

    //配置切换选项
    let ifAskSwitchConfig = localStorage.getItem('ifAskSwitchConfig') || false;
    let configRootDir = localStorage.getItem('configRootDir') || '';

    //--------------状态变量----------------
    let currentPreset = '';
    let editMode = false;
    let mods = [];
    let modCharacters = [];
    let modFilterCharacter = 'All';
    let compactMode = false;
    let currentMod = '';
    let ifAskedSwitchConfig = false;
    let currentConfig = '';


    //--------------Intersect Observer----------------
    // 创建 Intersection Observer
    // 用于检测modItem是否在视窗内,如果在视窗内则使其inWindow属性为true,否则为false
    // 用来代替 getBoundingClientRect() 来判断元素是否在视窗内,getBoundingClientRect()会导致页面重绘
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const modItem = entry.target;
            // 如果元素在视口内，则使其inWindow属性为true
            modItem.inWindow = entry.isIntersecting ? true : false;
            //debug
            //console.log(`modItem ${modItem.id} inWindow:${modItem.inWindow}`);
        });
    }, {
        root: null, // 使用视口作为根
        rootMargin: '250px 100px', // 扩展视口边界
        threshold: 0 // 只要元素进入视口就触发回调
    });



    //----------------------页面元素----------------------
    const drawerPage = document.getElementById('drawer-page');
    const settingsDialog = document.getElementById('settings-dialog');

    //设置页面
    const settingsMenu = document.getElementById('settings-menu');
    const settingsDialogTabs = document.querySelectorAll('.settings-dialog-tab');

    //帮助页面
    const helpDialog = document.getElementById('help-dialog-cn');
    const helpDialogEn = document.getElementById('help-dialog-en');

    //预设列表相关
    const presetContainer = document.getElementById('preset-container');
    const presetListDisplayButton = document.getElementById('preset-list-button');
    const presetAddButton = document.getElementById('preset-item-add');
    const presetNameInput = document.getElementById('add-preset-name');

    const presetAddConfirmButton = document.getElementById('preset-add-confirm');
    const presetEditButton = document.getElementById('preset-item-edit');

    const addPresetDialog = document.getElementById('add-preset-dialog');

    //控制按钮
    const settingsShowButton = document.getElementById('settings-show-button');
    const fullScreenButton = document.getElementById('fullscreen-button');
    const fullScreenSvgpath = document.getElementById('fullscreen-button-svgpath');

    //mod筛选相关
    const modFilterScroll = document.getElementById('mod-filter-scroll');
    const modFilterSelected = document.getElementById('mod-filter-selected');
    const modFilter = document.getElementById('mod-filter');
    const modFilterAll = document.getElementById('mod-filter-all');
    const modFilterBg = document.getElementById('mod-filter-bg');

    //mod列表相关
    const modContainer = document.getElementById('mod-container');
    const applyBtn = document.getElementById('apply-btn');
    const unknownModDialog = document.getElementById('unknown-mod-dialog');

    const compactModeButton = document.getElementById('compact-mode-button');

    //mod info 相关
    const modInfoName = document.getElementById('mod-info-name');
    const modInfoCharacter = document.getElementById('mod-info-character');
    const modInfoDescription = document.getElementById('mod-info-description');
    const modInfoImage = document.getElementById('mod-info-image');

    const infoShowButton = document.getElementById('info-show-button');

    //mod info 页面的按钮：
    //打开mod链接
    const openModUrlButton = document.getElementById('open-mod-url');
    //打开mod文件夹
    const openModFolderButton = document.getElementById('open-mod-dir');

    //编辑mod.json文件
    const editModInfoButton = document.getElementById('edit-mod-info');
    const editModInfoDialog = document.getElementById('edit-mod-info-dialog');
    const ifSaveChangeDialog = document.getElementById('save-change-dialog');

    //设置初始化按钮
    const initConfigButton = document.getElementById('init-config-button');
    const refreshDialog = document.getElementById('refresh-dialog');

    // help 页面
    const helpMenu = document.querySelector('#help-dialog-cn #help-menu');
    const helpMenuEn = document.querySelector('#help-dialog-en #help-menu');
    const helpDialogTabs = document.querySelectorAll('#help-dialog-cn .help-dialog-tab');
    const helpDialogTabsEn = document.querySelectorAll('#help-dialog-en .help-dialog-tab');


    // 选择配置文件
    const switchConfigDialog = document.getElementById('switch-config-dialog');

    //-=================检测是否是第一次打开=================
    // 检测是否是第一次打开
    const firstOpen = localStorage.getItem('firstOpen');
    //  debug
    // console.log(localStorage);
    if (!firstOpen) {
        firstLoad();
    }
    else {
        init();
    }

    //-==============事件监听================
    //重新排序modItem
    async function sortMods(hideItem) {
        // 获取所有显示的modItem
        const modItems = document.querySelectorAll('.mod-item:not([style*="display: none"])');

        // 卡片的宽高
        const cardHeight = compactMode ? 150 : 350;
        const cardWidth = 250;

        // 计算每行的modItem数量
        const modItemPerRow = Math.floor(modContainer.offsetWidth / 250);

        // 通过每个modItem的编号，我们可以计算出它的行和列
        // 通过行和列，我们可以计算出它的位置
        // 之后，我们可以计算删除 hideItem 后，其他 modItem 的位置
        // 再次计算每个 modItem 的位置
        // 之后，为视窗内的 modItem 添加动画，使其移动到新的位置
        // 最后，实际隐藏 hideItem，其他的 modItem 会自动填补空缺
        // 如果计算无误，中间不会发生闪烁

        // 获取 hideItem 的 编号
        const hideItemIndex = Array.from(modItems).indexOf(hideItem);

        // 获取 hideItem 的行和列
        const modItemRow = Math.floor(hideItemIndex / modItemPerRow);
        const modItemColumn = hideItemIndex % modItemPerRow;

        // 下面的方法效率较低，这里将其重构
        // 不需要计算每个mod的row和column，只需要计算hideItem的row和column，之后可以根据hideItem的row和column计算其他mod的位置

        // debug
        console.log(`modItemLength:${modItems.length} modItemPerRow:${modItemPerRow} modItemsMaxRow:${Math.ceil(modItems.length / modItemPerRow)}`);
        console.log(`hideItemIndex:${hideItemIndex} modItemRow:${modItemRow} modItemColumn:${modItemColumn}`);
        for (let row = modItemRow; row < Math.ceil(modItems.length / modItemPerRow); row++) {
            for (let column = 0; column < modItemPerRow; column++) {
                const currentId = row * modItemPerRow + column;
                // 获取当前 modItem
                const currentModItem = modItems[currentId];
                if (currentId <= hideItemIndex || currentMod.inWindow == false) {
                    continue;
                }
                if (currentId >= modItems.length) {
                    break;
                }
                // 对于这个 位于 row 行 column 列的 modItem，我们需要计算它的位置
                // 获取当前 modItem 的位置
                const currentX = column * (cardWidth + 10);
                const currentY = row * (cardHeight + 10);

                let targetX, targetY;
                // 获取目标 modItem 的位置
                if (column == 0) {
                    // 如果它的列数为 0，那么它会移动到上一行的最后
                    targetX = (modItemPerRow - 1) * (cardWidth + 10);
                    targetY = (row - 1) * (cardHeight + 10);
                }
                else {
                    // 如果它的列数不为 0，那么它会移动到上一个 modItem 的位置，即 column - 1
                    targetX = (column - 1) * (cardWidth + 10);
                    targetY = row * (cardHeight + 10);
                }

                // 添加动画,transform 指定的应该是相对位移，目标位置减去当前位置

                //debug
                console.log(`currentModItem:${currentModItem.id} currentX:${currentX} currentY:${currentY} targetX:${targetX} targetY:${targetY}`);
                currentModItem.animate([
                    { transform: `translate(0px, 0px) scale(0.95)` },
                    { transform: `translate(${(targetX - currentX) / 2}px, ${(targetY - currentY) / 2}px) scale(0.8)` },
                    { transform: `translate(${targetX - currentX}px, ${targetY - currentY}px) scale(0.9)` }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });
            }
        }

        // 在0.3秒内隐藏 hideItem
        hideItem.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease-in-out',
            iterations: 1
        });

        //当动画结束后，将其display设置为none（也就是0.3秒后）
        setTimeout(() => {
            hideItem.style.display = 'none';
        }, 300);
    }

    //使用事件委托处理点击事件，减少事件绑定次数
    modContainer.addEventListener('click', (event) => {
        const modItem = event.target.closest('.mod-item');
        if (!modItem) {
            //snack('Invalid click target');
            return;
        }

        // 切换modItem的显示状态
        clickModItem(modItem, event, modItem.getBoundingClientRect());

        // 展示mod的信息
        currentMod = modItem.id;
        showModInfo(currentMod);

        //一旦点击了modItem，将其保存在currentPreset中
        savePreset(currentPreset);

        // 如果开启了自动应用，则自动应用
        if (ifAutoApply == 'true') {
            applyMods();
        }

        // 如果modFilterCharacter为Selected，则将modItem切换为 clicked = false 的时候
        // 则需要重新排序modItem
        if (modFilterCharacter == 'Selected' && !modItem.checked) {
            sortMods(modItem);
        }
    }
    );

    //如果是右键点击，则显示编辑mod.json的对话框
    modContainer.addEventListener('contextmenu', (event) => {
        const modItem = event.target.closest('.mod-item');
        if (!modItem) {
            return;
        }
        //显示编辑mod.json的对话框
        currentMod = modItem.id;
        showEditModInfoDialog();
    });


    //---------------------处理拖动事件---------------------
    //处理拖动事件，有三种可能：
    //1.拖动文件到modContainer的任意位置，视为添加mod
    //2.拖动图片文件到modItem上，视为更改mod的封面
    //3.拖动zip文件到modItem上，视为添加mod，但是暂时不实现
    function handleDropEvent(event, modItem, mod) {
        const items = event.dataTransfer.items;

        // 只处理第一个文件
        const item = items[0].webkitGetAsEntry();


        // 从网页和本地拖入的文件似乎格式不一样
        // 一个是 File 对象，一个是 Entry 对象
        // 从网页拖入的文件是 File 对象，它没有 webkitGetAsEntry 方法，但是可以通过 type 属性判断文件类型
        // 从本地拖入的文件是 Entry 对象，它有 webkitGetAsEntry 方法，可以通过getAsFile方法获取 File 对象

        try {
            items[0].webkitGetAsEntry();
            // 如果上面的代码没有报错，说明是从本地拖入的文件
            // debug
            console.log(`get entry from drag event ${item.fullPath}`);
            if (item.isDirectory) {
                console.log('Directory:', item.fullPath);
                handleFolderDrop(item);
                return;
            }
            if (item.isFile) {
                // 如果拖入的是文件，则视为用户想要更换mod的封面或者添加mod 压缩包
                const file = items[0].getAsFile();
                if (file.type.startsWith('image/')) {
                    // 交给 handleImageDrop 处理
                    handleImageDrop(file, modItem, mod);
                    return;
                }
                if (file.name.endsWith('.zip')) {
                    // 交给 handleZipDrop 处理
                    handleZipDrop(file, modItem, mod);
                    return;
                }
                console.log('File type:', file.type);
                snack('Invalid file type：' + file.type);
            }
        } catch (error) {
            // webkitGetAsEntry 方法不存在，说明是从网页拖入的文件
            // 从网页拖入的文件是 File 对象。
            try {
                const files = event.dataTransfer.files;
                //debug
                console.log(`get file from drag event ${files[0].name}`);
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                        // 交给 handleImageDrop 处理
                        handleImageDrop(file, modItem, mod);
                        return;
                    }
                    console.log('File type:', file.type);
                    snack('Invalid file type：' + file.type);
                }
            }
            catch (error) {
                console.log('Invalid drag event');
                snack('Invalid drag event');
            }
        }
    }

    function handleFolderDrop(item) {
        // 如果拖入的是文件夹，则视为用户想要添加一个mod
        // 检查是否已经存在同名的mod
        //debug
        console.log(`handle folder drop: ${item.fullPath}`);
        // 这里的 item.fullPath 是一个虚拟路径，以 / 开头，需要去掉
        const modName = item.fullPath.slice(1);
        if (fs.existsSync(path.join(modSourceDir, modName))) {
            snack(`Mod ${modName} already exists`);
            return;
        }
        // 将文件夹拷贝到 modSourceDir 中
        // 但是这里的 item 的 fullPath 是一个虚拟路径，无法直接使用 fs 进行操作
        // 但是我们可以递归读取每一个文件，然后将其拷贝到 modSourceDir 的对应位置
        copyFolder(item, modSourceDir);
        // 复制完成后，刷新 modList
        //debug
        console.log(`Copied folder: ${item.fullPath}`);
        loadModList(() => {
            // 刷新完成后，弹出提示
            snack(`Added mod ${modName}`);

            // 将筛选设置为 unknown
            setFilter('Unknown');

            currentMod = modName;
            showEditModInfoDialog();
        });
    }

    // 递归复制文件夹
    function copyFolder(item, targetDir) {
        // debug
        console.log(`copy folder ${item.fullPath} to ${targetDir}`);
        const relativePath = item.fullPath.slice(1); // 去掉开头的 '/'
        const targetPath = path.join(targetDir, relativePath);

        if (item.isDirectory) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            const reader = item.createReader();
            reader.readEntries((entries) => {
                entries.forEach((entry) => {
                    copyFolder(entry, targetDir);
                });
            });
        } else if (item.isFile) {
            item.file((file) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const buffer = Buffer.from(reader.result);
                    // 如果 targetPath 不存在，则创建文件
                    console.log(`Copied file from ${item.fullPath} to ${targetPath}`);
                    fs.writeFileSync(targetPath, buffer);
                };
                reader.readAsArrayBuffer(file);
            });
        }
    }

    function handleImageDrop(file, modItem, mod) {
        // 再次确认是否是图片文件
        if (!file.type.startsWith('image/')) {
            snack('Invalid image file');
            return;
        }
        // 因为electron的file对象不是标准的file对象，所以需要使用reader来读取文件
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            updateModCardCover(imageUrl, modItem, mod);
        };
        reader.readAsDataURL(file);
    }

    function handleZipDrop(file, modItem, mod) {
        //debug
        console.log(`handle zip drop: ${file.name}`);
        //snack 提示
        snack('Not implemented yet');
    }

    //使用事件委托处理拖放事件：
    // 当拖动文件且悬停在modItem上时，显示拖动的mod的信息
    modContainer.addEventListener('dragover', (event) => {
        event.preventDefault();

        const modItem = event.target.closest('.mod-item'); //获取拖动的modItem
        if (modItem) {
            event.dataTransfer.dropEffect = 'copy';

            currentMod = modItem.id;
            showModInfo(currentMod);

        }
    });

    modContainer.addEventListener('drop', (event) => {
        event.preventDefault();
        const modItem = event.target.closest('.mod-item');

        modItem ? handleDropEvent(event, modItem, modItem.id) : handleDropEvent(event, '', currentMod);
    });

    //同样为edit-mod-info-left添加拖放事件
    const editModInfoLeft = document.getElementById('edit-mod-info-left');
    editModInfoLeft.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    //同样为edit-mod-info-left添加拖放事件
    editModInfoLeft.addEventListener('drop', (event) => {
        event.preventDefault();

        const file = event.dataTransfer.files[0];
        handleImageDrop(file, '', currentMod);

        //这里只显示，保存在点击保存按钮时才会保存
        const imagePath = getModImagePath(currentMod);
        //debug
        console.log(`imagePath:${imagePath}`);
        //显示图片
        imagePath.then((path) => {
            editModInfoDialog.querySelector('#editDialog-mod-info-image').setAttribute('src', path);
            tempImagePath = path;
        });
        //设置 currentInfo 为空
        //拖放结束后，隐藏editModInfoDialog
        //editModInfoDialog.dismiss();
        //因为没有modItem，所以在结束后需要刷新mod
        loadModList(() => {
            // 刷新完成后，弹出提示
            //snack(`Updated cover for ${currentMod}`);

            // 将筛选设置为 当前mod 的 character
            const modInfo = ipcRenderer.invoke('get-mod-info', currentMod);
            modInfo.then((info) => {
                setFilter(info.character);
            });
        });
        showModInfo('');
        setTimeout(() => {
            showModInfo(currentMod);
        }, 500);
    });

    async function updateModCardCover(imageUrl, modItem, mod) {
        // 将图片保存到modSource文件夹中，文件名为preview+后缀名，并且将其保存到mod.json中
        //debug
        console.log(`update mod card cover of ${mod} with ${imageUrl}`);
        const imageExt = imageUrl.split(';')[0].split('/')[1];
        const modImageName = `preview.${imageExt}`;
        const modImageDest = path.join(modSourceDir, mod, modImageName);
        fs.writeFileSync(modImageDest, imageUrl.split(',')[1], 'base64');

        // 更新mod.json
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        //debug
        console.log(`modInfo:`, modInfo);
        modInfo.imagePath = modImageName;
        ipcRenderer.invoke('set-mod-info', mod, modInfo);

        // 更新modItem的图片
        if (modItem != '') {
            modItem.querySelector('img').src = modImageDest;
        }

        // 刷新侧边栏的mod信息
        showModInfo(mod);

        // snack提示
        snack(`Updated cover for ${mod}`);

        // 返回 图片的路径
        return modImageDest;
    }

    async function loadPresets() {
        editMode = false;
        const presets = await ipcRenderer.invoke('get-presets');
        const presetContainerCount = presetContainer.childElementCount;
        const fragment = document.createDocumentFragment();
        presets.forEach((preset, index) => {
            var presetItem;
            if (index < presetContainerCount) {
                presetItem = presetContainer.children[index];
            }
            else {
                presetItem = document.createElement('s-button');
                presetItem.className = 'left-adhesive-button font-hongmeng';
                presetItem.id = 'preset-item';
                presetItem.type = "elevated";
                fragment.appendChild(presetItem);
            }
            presetItem.name = preset;
            presetItem.innerHTML = preset;
            if (fragment.children.length == presets.length - presetContainerCount) {
                presetContainer.appendChild(fragment);
            }
        });

        //删除多余的presetItem
        if (presets.length < presetContainerCount) {
            for (let i = presets.length; i < presetContainerCount; i++) {
                presetContainer.removeChild(presetContainer.children[presets.length]);
            }
        }
    }

    function deletePreset(presetName) {
        //debug
        console.log("🔴delete presetItem" + presetName);

        //禁止删除和currentPreset相同的preset
        if (currentPreset == presetName) {
            snack('Cannot delete current preset');
            return;
        }

        ipcRenderer.invoke('delete-preset', presetName);
        //将自己的父元素删除
        const allpresetItems = document.querySelectorAll('#preset-item');
        allpresetItems.forEach(item => {
            if (item.name == presetName) {
                //删除自己的父元素
                item.parentNode.removeChild(item);
            }
        });
    }

    async function applyPreset(presetName) {
        console.log("🟢load presetItem " + presetName);

        if (currentPreset == presetName) {
            //如果点击的是当前的preset，则不进行任何操作
            return;
        }

        currentPreset = presetName;

        const selectedMods = await ipcRenderer.invoke('load-preset', presetName);
        document.querySelectorAll('.mod-item').forEach(item => {
            //debug
            //console.log(`item.id:${item.id} selectedMods:${selectedMods.includes(item.id)}`);
            if (item.checked && !selectedMods.includes(item.id)) {
                clickModItem(item);
            }
            if (!item.checked && selectedMods.includes(item.id)) {
                clickModItem(item);
            }
        });

        //更改样式
        const allpresetItems = document.querySelectorAll('#preset-item');
        allpresetItems.forEach(item => {
            item.type = 'elevated';
            if (item.name == presetName) {
                item.type = 'filled';
            }
        }
        );


        //刷新筛选
        if (modFilterCharacter == 'Selected') {
            filterMods();
        }
        //如果开启了自动应用，则自动应用
        if (ifAutoApply == true) {
            applyMods();
        }
    }

    //使用事件委托处理点击事件，减少事件绑定次数
    presetContainer.addEventListener('click', async (event) => {
        const presetItem = event.target.closest('#preset-item');
        presetItem ? editMode ? deletePreset(presetItem.name) : applyPreset(presetItem.name) : null;
    });

    function filterMods() {
        //如果modFilterCharacter为All，则将所有的modItem显示
        if (modFilterCharacter == 'All') {
            //将所有的modItem显示
            document.querySelectorAll('.mod-item').forEach(item => {
                item.style.display = 'block';
            });
            return;
        }
        //如果modFilterCharacter为Selected，则将所有checked="true"的modItem显示
        if (modFilterCharacter == 'Selected') {
            //将所有的modItem显示
            document.querySelectorAll('.mod-item').forEach(item => {
                if (item.checked == true && item.style.display == 'none') {
                    //如果不在视窗内，则直接显示
                    if (!item.inWindow) {
                        item.style.display = 'block';
                        return;
                    }
                    //添加出现动画
                    item.style.display = 'block';
                    item.animate([
                        { opacity: 0 },
                        { opacity: 1 }
                    ], {
                        duration: 300,
                        easing: 'ease-in-out',
                        iterations: 1
                    });
                }
                if (item.checked == false && item.style.display != 'none') {
                    //如果不在视窗内，则直接隐藏
                    if (!item.inWindow) {
                        item.style.display = 'none';
                        return;
                    }
                    //添加消失动画
                    item.animate([
                        { opacity: 1 },
                        { opacity: 0 }
                    ], {
                        duration: 300,
                        easing: 'ease-in-out',
                        iterations: 1
                    });
                    //当动画结束后，将其display设置为none（也就是0.3秒后）
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
            return;
        }
        //如果modFilterCharacter为其他，则将所有character=modFilterCharacter的modItem显示
        document.querySelectorAll('.mod-item').forEach(item => {
            if (modFilterCharacter == item.character) {
                item.style.display = 'block';
            }
            else {
                item.style.display = 'none';
            }
        }
        );
    }

    function refreshModFilter() {
        //debug
        console.log(`modCharacters:${modCharacters}`);

        modFilter.innerHTML = '';
        modCharacters.forEach(character => {
            const filterItem = document.createElement('s-chip');
            filterItem.type = 'default';
            filterItem.class = 'font-hongmeng';
            filterItem.id = character;
            filterItem.selectable = true;
            filterItem.innerHTML = `<p>${character}</p>`;
            modFilter.appendChild(filterItem);
        }
        );
    }

    //使用事件委托处理点击事件，减少事件绑定次数
    modFilter.addEventListener('click', (event) => {
        const filterItem = event.target.closest('s-chip');
        if (filterItem) {
            const character = filterItem.id;
            //debug
            console.log("clicked filterItem " + character);
            modFilterCharacter = character;
            modFilterAll.type = 'default';
            modFilterSelected.type = 'default';
            //将自己的type设置为filled，其他的设置为default
            const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
            allfilterItems.forEach(item => {
                item.style.color = 'var(--s-color-on-surface)';
            });
            // 不再需要 type = 'filled' 的效果，因为现在使用bg来代替
            // filterItem.type = 'filled';

            // 更改字体颜色
            filterItem.style.color = 'var(--s-color-on-primary)';

            // 将bg的宽度设置为当前filterItem的宽度，并且设置bg的left为当前filterItem的left

            const filterItemRect = filterItem.getBoundingClientRect();
            //这里获取的left是相对于视窗的，所以需要减去modFilter的left
            const modFilterRect = modFilter.getBoundingClientRect();
            //bg.style.visibility = 'visible';
            //width 还需要减去padding的量
            modFilterBg.style.height = `${filterItemRect.height}px`;
            modFilterBg.style.width = `${filterItemRect.width - 15}px`;
            modFilterBg.style.top = `${filterItemRect.top - modFilterRect.top}px`;
            modFilterBg.style.left = `${filterItemRect.left - modFilterRect.left + 4}px`;
            //0.5s后将bg隐藏
            filterMods();
        }
    }
    );

    function setFilter(character) {
        if (character == 'All') {
            modFilterAll.click();
            return;
        }
        if (character == 'Selected') {
            modFilterSelected.click();
            return;
        }
        // 检查是否存在这个character
        if (!modCharacters.includes(character)) {
            modFilterAll.click();
            return;
        }
        const filterItems = document.querySelectorAll('#mod-filter s-chip');
        filterItems.forEach(item => {
            //debug 
            //console.log(`item.id:${item.id} character:${character}`);
            if (item.id == character) {
                item.click();
            }
        }
        );
    }

    async function savePreset(presetName) {
        if (presetName == '') {
            return;
        }
        // presetName 应该是已经存在的 preset
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            // await loadPresets();
        }
    }

    async function showModInfo(mod) {
        if (mod == '') {
            //将modInfo清空
            modInfoName.textContent = '';
            modInfoCharacter.textContent = '';
            modInfoDescription.textContent = '';
            modInfoImage.style.backgroundImage = '';
            return;
        }
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        //将info显示在 modInfo 中
        modInfoName.textContent = mod;
        modInfoCharacter.textContent = modInfo.character ? modInfo.character : 'Unknown';
        //keyswap 是 一个 列表，用来存储 快捷键信息，将其转换为字符串，之后添加到description中
        let swapInfo = modInfo.keyswap.length >0 ? "keyswap : " + modInfo.keyswap.join(' ') : 'no keyswap';
        modInfoDescription.innerHTML = swapInfo + '<br>' + (modInfo.description ? modInfo.description : 'No description');

        //获取mod的图片
        let modImagePath = await getModImagePath(mod);
        // 替换反斜杠为斜杠
        modImagePath = modImagePath.replace(/\\/g, '/');
        // 设置其backgroundImage
        modInfoImage.style.backgroundImage = `url("${encodeURI(modImagePath)}")`;
        // debug
        //console.log(`show mod image ${modImagePath}`);
    }



    //-----------------------------事件监听--------------------------------


    //-全屏按钮
    fullScreenButton.addEventListener('click', toggleFullscreen);

    async function toggleFullscreen() {
        isFullScreen = await ipcRenderer.invoke('toggle-fullscreen');
        if (!isFullScreen) {
            fullScreenSvgpath.setAttribute('d', 'M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z');
        }
        else {
            fullScreenSvgpath.setAttribute('d', 'M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z');
        }
    }

    //-compactMode按钮
    compactModeButton.addEventListener('click', () => {
        //切换compactMode
        compactMode = !compactMode;
        const icon = compactModeButton.querySelector('path');
        if (compactMode) {
            //设置按钮图标样式
            icon.setAttribute('d', 'M480-80 240-320l57-57 183 183 183-183 57 57L480-80ZM298-584l-58-56 240-240 240 240-58 56-182-182-182 182Z');

            modContainer.setAttribute('compact', 'true');
            //添加折叠动画，modContainer的子物体modItem的高度从350px变为150px
            //动画只对窗口内的modItem进行动画
            const modItems = document.querySelectorAll('.mod-item');
            modItems.forEach(item => {
                if (!item.inWindow) {
                    return;
                }
                item.animate([
                    { height: '350px' },
                    { height: '150px' }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });

                //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓上移
                //获取这些元素
                //遍历子元素，匹配slot属性
                item.childNodes.forEach(child => {
                    if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
                        child.animate([
                            { transform: 'translateY(200px)' },
                            { transform: 'translateY(0px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                    if (child.slot == 'image') {
                        //获取slot下的img元素
                        const img = child.querySelector('img');
                        img.animate([
                            { opacity: 1, filter: 'blur(0px)' },
                            { opacity: 0.2, filter: 'blur(5px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                });
            });
        }
        else {
            //设置按钮图标样式
            icon.setAttribute('d', 'm356-160-56-56 180-180 180 180-56 56-124-124-124 124Zm124-404L300-744l56-56 124 124 124-124 56 56-180 180Z');

            modContainer.setAttribute('compact', 'false');
            //添加展开动画，modContainer的子物体modItem的高度从150px变为350px
            //动画只对窗口内的modItem进行动画
            const modItems = document.querySelectorAll('.mod-item');
            modItems.forEach(item => {
                if (!item.inWindow) {
                    return;
                }
                item.animate([
                    { height: '150px' },
                    { height: '350px' }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });

                //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓下移
                //获取这些元素
                //遍历子元素，匹配slot属性
                item.childNodes.forEach(child => {
                    if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
                        child.animate([
                            { transform: 'translateY(-200px)' },
                            { transform: 'translateY(0px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                    if (child.slot == 'image') {
                        //获取slot下的img元素
                        const img = child.querySelector('img');
                        img.animate([
                            { opacity: 0.2, filter: 'blur(5px)' },
                            { opacity: 1, filter: 'blur(0px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                });

            });
        }
    });


    //-setting-dialog相关

    //-=============================设置页面=============================

    //--------------设置语言----------------
    const langPicker = document.getElementById('language-picker');
    langPicker.addEventListener('click', (event) => {
        //langPicker的子元素是input的radio，所以不需要判断到底点击的是哪个元素，直接切换checked的值即可
        //获取目前的checked的值
        const checked = langPicker.querySelector('input:checked');

        //如果点击的是当前的语言，则不进行任何操作
        if (!checked) {
            console.log("checked is null");
            return;
        }

        if (checked.id == lang) {
            return;
        }

        //根据checked的id来切换语言
        setLang(checked.id);
    });

    //----------------设置theme------------
    const themePicker = document.getElementById('theme-picker');
    themePicker.addEventListener('click', (event) => {
        //themePicker的子元素是input的radio，所以不需要判断到底点击的是哪个元素，直接切换checked的值即可
        //获取目前的checked的值
        const checked = themePicker.querySelector('input:checked');
        //debug
        console.log("checked:" + checked.id);

        //如果点击的是当前的theme，则不进行任何操作
        if (!checked) {
            console.log("checked is null");
            return;
        }
        if (checked.id == localStorage.getItem('theme')) {
            return;
        }

        //根据checked的id来切换theme
        setTheme(checked.id);
    });

    //----------------设置auto-apply----------------
    const autoApplySwitch = document.getElementById('auto-apply-switch');
    autoApplySwitch.addEventListener('change', () => {
        ifAutoApply = autoApplySwitch.checked;
        //保存ifAutoApply
        setLoacalStorage('ifAutoApply', ifAutoApply);
        //debug
        console.log("ifAutoApply: " + ifAutoApply);
    });


    //----------------设置auto-refresh-in-zzz----------------
    const autoRefreshInZZZSwitch = document.getElementById('auto-refresh-in-zzz');
    //是否开启自动刷新
    autoRefreshInZZZSwitch.addEventListener('change', () => {
        ifAutoRefreshInZZZ = autoRefreshInZZZSwitch.checked;
        //保存ifAutoRefreshInZZZ
        setLoacalStorage('ifAutoRefreshInZZZ', ifAutoRefreshInZZZ);
        //debug
        console.log("ifAutoRefreshInZZZ: " + ifAutoRefreshInZZZ);
    });

    //-----------设置 auto-start-game-----------
    const autoStartGameSwitch = document.getElementById('auto-start-game-switch');
    autoStartGameSwitch.addEventListener('change', () => {
        ifAutoStartGame = autoStartGameSwitch.checked;
        //保存ifAutoStartGame
        setLoacalStorage('ifAutoStartGame', ifAutoStartGame);
        //debug
        console.log("ifAutoStartGame: " + ifAutoStartGame);

        if (ifAutoStartGame) {
            //如果开启了自动启动游戏，则检查modLoaderDir和gameDir是否存在
            if (!fs.existsSync(modLoaderDir) || !fs.existsSync(gameDir)) {
                snack('Invalid modLoaderDir or gameDir, please set them in advanced settings');
                //恢复原来的ifAutoStartGame
                ifAutoStartGame = false;
                autoStartGameSwitch.checked = false;
                //保存ifAutoStartGame
                setLoacalStorage('ifAutoStartGame', ifAutoStartGame);
                return;
            }
        }
    });

    //-----------设置 use-admin-----------
    const useAdminSwitch = document.getElementById('use-admin-switch');
    useAdminSwitch.addEventListener('change', () => {
        ifUseAdmin = useAdminSwitch.checked;
        //保存ifUseAdmin
        setLoacalStorage('ifUseAdmin', ifUseAdmin);
        //debug
        console.log("ifUseAdmin: " + ifUseAdmin);
    });

    //-----------设置 modRootDir-----------
    const modRootDirInput = document.getElementById('set-modRootDir-input');
    modRootDirInput.addEventListener('click', async () => {
        const modRootDir = await getFilePathsFromSystemDialog('Mods', 'directory');
        //让 modRootDirInput 的 value属性 为 用户选择的路径
        if (modRootDir !== '') {
            modRootDirInput.value = modRootDir;
            setLoacalStorage('modRootDir', modRootDir);
            syncLocalStorage();
            snack(`Mod root directory set to ${modRootDir}`);
        }
        else {
            snack('Please select your mod root directory');
        }
    });

    //-----------设置 modSourceDir-----------
    const modSourceDirInput = document.getElementById('set-modSourceDir-input');
    modSourceDirInput.addEventListener('click', async () => {
        const modSourceDir = await getFilePathsFromSystemDialog('Mod Resource Backpack', 'directory');
        //让 modSourceDirInput 的 value属性 为 用户选择的路径
        if (modSourceDir !== '') {
            modSourceDirInput.value = modSourceDir;
            setLoacalStorage('modSourceDir', modSourceDir);
            syncLocalStorage();
            snack(`Mod backpack directory set to ${modSourceDir}`);
        }
        else {
            snack('Please select your mod backpack directory');
        }
    }
    );

    //-----------设置 modLoaderDir-----------
    const modLoaderDirInput = document.getElementById('set-modLoaderDir-input');
    modLoaderDirInput.addEventListener('click', async () => {
        const modLoaderDir = await getFilePathsFromSystemDialog('Mod Loader', 'exe');
        //让 modLoaderDirInput 的 value属性 为 用户选择的路径
        if (modLoaderDir !== '') {
            modLoaderDirInput.value = modLoaderDir;
            setLoacalStorage('modLoaderDir', modLoaderDir);
            syncLocalStorage();
            snack(`Mod loader path set to ${modLoaderDir}`);
        }
        else {
            snack('Please select your mod loader path');
        }
    });

    //-----------设置 gameDir-----------
    const gameDirInput = document.getElementById('set-gameDir-input');
    gameDirInput.addEventListener('click', async () => {
        const gameDir = await getFilePathsFromSystemDialog('Game', 'exe');
        //让 gameDirInput 的 value属性 为 用户选择的路径
        if (gameDir !== '') {
            gameDirInput.value = gameDir;
            setLoacalStorage('gameDir', gameDir);
            syncLocalStorage();
            snack(`Game path set to ${gameDir}`);
        }
        else {
            snack('Please select your game path');
        }
    });

    //-----------设置 configRootDir-----------
    const configRootDirInput = document.getElementById('set-configRootDir-input');
    configRootDirInput.addEventListener('click', async () => {
        const inputDir = await getFilePathsFromSystemDialog('Config', 'directory');
        //让 configRootDirInput 的 value属性 为 用户选择的路径
        if (inputDir !== '') {
            configRootDirInput.value = inputDir;
            // 检查 configRootDir 是否为空文件夹，如果里面有文件，则警告用户
            const files = fs.readdirSync(inputDir);
            if (files.length > 0) {
                snack('Config directory is not empty');
            }
            setLoacalStorage('configRootDir', inputDir);
            configRootDir = inputDir;
            snack(`Config path set to ${inputDir}`);
        }
        else {
            snack('Please select your config path');
        }
    });

    //-----------设置 ifAskSwitchConfig-----------
    const ifAskSwitchConfigSwitch = document.getElementById('if-ask-switch-config-switch');
    ifAskSwitchConfigSwitch.addEventListener('change', () => {
        const checked = ifAskSwitchConfigSwitch.checked;
        if (checked && !fs.existsSync(configRootDir)) {
            snack('Config directory does not exist,you need to set it first');
            ifAskSwitchConfigSwitch.checked = false;
            return;
        }

        ifAskSwitchConfig = checked;
        //保存ifAskSwitchConfig
        setLoacalStorage('ifAskSwitchConfig', ifAskSwitchConfig);
        //debug
        console.log("ifAskSwitchConfig: " + ifAskSwitchConfig);
    }
    );

    //-----------刷新 mod-info 中的 swapKey 字段-----------
    const swapKeyButton = document.getElementById('refresh-mod-info-swapkey-button');
    swapKeyButton.addEventListener('click', async () => {
        //刷新所有的mod的swapKey
        ipcRenderer.invoke('refresh-mod-info-swapkey');
        snack('Refreshed all mods swapKey');
    });

    
    //---------更改setting-dialog的样式---------
    //设置页面使用的s-dialog是封装好的，无法通过css修改其样式，所以需要通过js来修改
    const settingsDialogStyle = document.createElement('style');
    settingsDialogStyle.innerHTML = `
        .container {
            width: calc(30% + 400px) !important;
            min-width: calc(800px) !important;
            max-width: 1100px !important;
            height: calc(100% - 100px) !important;
            overflow: hidden !important;
            flex:1;
        }
        .action {
            display: none !important;
        }
        s-scroll-view{
        display: none;
        }    
        `
    settingsDialog.shadowRoot.appendChild(settingsDialogStyle);

    //监听settingsDialog的关闭事件，当settingsDialog关闭时，将其所有的tab设置为display:none
    settingsDialog.addEventListener('close', () => {
        settingsDialogTabs.forEach(item => {
            item.style.display = 'none';
            item.style.opacity = '0';
        });
    });

    //---------设置页面初始化---------
    settingsShowButton.addEventListener('click', async () => {
        // 显示或隐藏settingsDialog
        showDialog(settingsDialog);

        //显示当前 auto-apply 的值
        autoApplySwitch.checked = ifAutoApply;

        //显示当前 auto-refresh-in-zzz 的值
        autoRefreshInZZZSwitch.checked = ifAutoRefreshInZZZ;

        //显示当前 auto-start-game 的值
        autoStartGameSwitch.checked = ifAutoStartGame;

        //显示当前 use-admin 的值
        useAdminSwitch.checked = ifUseAdmin;

        //显示当前 theme 的值
        const theme = localStorage.getItem('theme');
        const themeRadio = themePicker.querySelector(`#${theme}`);
        themeRadio ? themeRadio.checked = true : themePicker.querySelector('#dark').checked = true;

        //显示当前 lang 的值
        const lang = localStorage.getItem('lang');
        const langRadio = langPicker.querySelector(`#${lang}`);
        langRadio ? langRadio.checked = true : langPicker.querySelector('#en').checked = true;

        //显示当前 modRootDir 的值
        modRootDirInput.value = modRootDir;

        //显示当前 modSourceDir 的值
        modSourceDirInput.value = modSourceDir;

        //显示当前 modLoaderDir 的值
        modLoaderDirInput.value = modLoaderDir;

        //显示当前 gameDir 的值
        gameDirInput.value = gameDir;

        //显示当前 configRootDir 的值
        configRootDirInput.value = configRootDir;

        //显示当前 ifAskSwitchConfig 的值
        ifAskSwitchConfigSwitch.checked = ifAskSwitchConfig;



        // 显示当前页面
        settingsDialogTabs.forEach(item => {
            item.style.display = 'none';
        });
        //获取目前的checked的值
        const checked = settingsMenu.querySelector('input:checked');
        //根据checked的id来切换tab,如果checked为null，则默认显示第一个tab
        checked ? settingsDialog.querySelector(`#settings-dialog-${checked.id}`).style.display = 'block' : settingsDialog.querySelector(`#settings-dialog-normal-settings`).style.display = 'block';
    });

    //-----------设置页面tab的切换-----------
    settingsMenu.addEventListener('click', (event) => {
        //因为页面全部都是input的radio，所以说不需要判断到底点击的是哪个元素，直接切换checked的值即可
        //获取目前的checked的值
        const checked = settingsMenu.querySelector('input:checked');

        //根据checked的id来切换tab
        const tab = settingsDialog.querySelector(`#settings-dialog-${checked.id}`);
        //debug
        //console.log("finding tab:" + `#settings-dialog-${checked.id}`);
        if (!tab) {
            console.log("tab is null");
            return;
        }
        //将所有的tab设置为display:none
        settingsDialogTabs.forEach(item => {
            item.style.display = 'none';
        });
        //将当前的tab设置为display:block
        tab.style.display = 'block';
        //debug
        console.log("show tab" + tab.id);
    });


    //-============================ help-dialog ============================
    //---------更改help-dialog的样式---------
    //帮助页面使用的s-dialog是封装好的，无法通过css修改其样式，所以需要通过js来修改
    const helpDialogStyle = document.createElement('style');
    helpDialogStyle.innerHTML = `
        .container {
            width: calc(30% + 400px) !important;
            min-width: calc(800px) !important;
            max-width: 1100px !important;
            height: calc(100% - 100px) !important;
            overflow: hidden !important;
            flex:1;
        }
        .action {
            display: none !important;
        }
        s-scroll-view{
        display: none;
        }    
        `
    helpDialog.shadowRoot.appendChild(helpDialogStyle);

    const helpDialogStyleEn = document.createElement('style');
    helpDialogStyleEn.innerHTML = `
        .container {
            width: calc(30% + 400px) !important;
            min-width: calc(800px) !important;
            max-width: 1100px !important;
            height: calc(100% - 100px) !important;
            overflow: hidden !important;
            flex:1;
        }
        .action {
            display: none !important;
        }
        s-scroll-view{
        display: none;
        }
        `
    helpDialogEn.shadowRoot.appendChild(helpDialogStyleEn);


    //监听helpDialog的关闭事件，当helpDialog关闭时，将其所有的tab设置为display:none
    helpDialog.addEventListener('close', () => {
        helpDialogTabs.forEach(item => {
            item.style.display = 'none';
            item.style.opacity = '0';
        });
    });

    helpDialogEn.addEventListener('close', () => {
        helpDialogTabsEn.forEach(item => {
            item.style.display = 'none';
            item.style.opacity = '0';
        });
    });

    //---------帮助页面tab的切换---------
    helpMenu.addEventListener('click', (event) => {
        //因为页面全部都是input的radio，所以说不需要判断到底点击的是哪个元素，直接切换checked的值即可
        //获取目前的checked的值
        const checked = helpMenu.querySelector('input:checked');

        //根据checked的id来切换tab
        const tab = helpDialog.querySelector(`#help-dialog-${checked.id}`);
        //debug
        //console.log("finding tab:" + `#help-dialog-${checked.id}`);
        if (!tab) {
            console.log("tab is null");
            return;
        }
        //将所有的tab设置为display:none
        helpDialogTabs.forEach(item => {
            item.style.display = 'none';
        });
        //将当前的tab设置为display:block
        tab.style.display = 'block';
        //debug
        console.log("show tab" + tab.id);
    });



    helpMenuEn.addEventListener('click', (event) => {
        //因为页面全部都是input的radio，所以说不需要判断到底点击的是哪个元素，直接切换checked的值即可
        //获取目前的checked的值
        const checked = helpMenuEn.querySelector('input:checked');
        console.log("finding tab:" + `#help-dialog-${checked.id}`);
        //根据checked的id来切换tab
        const tab = helpDialogEn.querySelector(`#help-dialog-${checked.id}`);
        //debug

        if (!tab) {
            console.log("tab is null");
            return;
        }

        //将所有的tab设置为display:none
        helpDialogTabsEn.forEach(item => {
            item.style.display = 'none';
        });
        //将当前的tab设置为display:block
        tab.style.display = 'block';
        //debug
        console.log("show tab" + tab.id);
    });

    //---------显示帮助页面---------
    const helpShowButton = document.getElementById('help-show-button');
    helpShowButton.addEventListener('click', showHelp);

    function showHelp() {
        // 根据当前的语言显示对应的帮助页面
        if (lang == 'en') {
            //debug
            console.log("showing helpDialogEn");
            showDialog(helpDialogEn);

            //检查是否有checked的input，如果有，则将其对应的tab显示，否则隐藏所有的tab
            const checked = helpMenuEn.querySelector('input:checked');
            if (checked) {
                //将当前的tab设置为display:block
                const tab = helpDialogEn.querySelector(`#help-dialog-${checked.id}`);
                tab.style.display = 'block';
            }
            else {
                helpDialogTabsEn.forEach(item => {
                    item.style.display = 'none';
                });
                helpDialogTabsEn[0].style.display = 'block';
            }

            //另外一个帮助页面dismiss   
            helpDialog.style.display = 'none';
        }
        else {
            showDialog(helpDialog);
            //检查是否有checked的input，如果有，则将其对应的tab显示，否则隐藏所有的tab
            const checked = helpMenu.querySelector('input:checked');
            if (checked) {
                //将当前的tab设置为display:block
                const tab = helpDialog.querySelector(`#help-dialog-${checked.id}`);
                tab.style.display = 'block';
            }
            else {
                helpDialogTabs.forEach(item => {
                    item.style.display = 'none';
                });
                helpDialogTabs[0].style.display = 'block';
            }

            //另外一个帮助页面dismiss
            helpDialogEn.style.display = 'none';
        }
    }







    //-mod启用
    applyBtn.addEventListener('click', async () => {
        applyMods();
        //使用s-snackbar显示提示,如果开启了自动在ZZZ中刷新，则显示提示
        if (ifAutoRefreshInZZZ) {
            snack('Mods applied, refreshing in ZZZ');
        }
        else {
            snack('Mods applied');
        }
    })

    const unknownModConfirmButton = document.getElementById('unknown-mod-confirm');
    const unknownModIgnoreButton = document.getElementById('unknown-mod-ignore');
    unknownModConfirmButton.addEventListener('click', async () => {
        //将Mods文件夹里面的文件夹移动到modSource文件夹，跳过已经存在的文件夹
        const unknownDirs = fs.readdirSync(modRootDir).filter(file => !fs.existsSync(path.join(modSourceDir, file)));
        unknownDirs.forEach(dir => {
            //移动文件夹,使用异步函数
            fs.rename(path.join(modRootDir, dir), path.join(modSourceDir, dir), (err) => {
                if (err) {
                    alert(err);
                }
                else {
                    console.log(`move ${dir} to modSource`);
                }
            });
        });
    });

    unknownModIgnoreButton.addEventListener('click', async () => {
        //忽略未知文件夹
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        await ipcRenderer.invoke('apply-mods', selectedMods);
    });

    //-mod筛选相关

    modFilterScroll.addEventListener('wheel', (e) => {
        e.preventDefault();
        modFilterScroll.scrollLeft += e.deltaY;
    }
    );

    //点击All按钮时，将modFilterCharacter设置为All，并且将其他的type设置为default
    modFilterAll.addEventListener('click', () => {
        modFilterCharacter = 'All';
        modFilterAll.type = 'filled-tonal';
        modFilterSelected.type = 'default';
        //将其他的type设置为default
        const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
        allfilterItems.forEach(item => {
            //item.type = 'default';
            item.style.color = 'var(--s-color-on-surface)';
        });
        // 将bf移出视窗，并且隐藏
        modFilterBg.style.left = '-100px';
        modFilterBg.style.width = '0px';

        filterMods();
    }
    );

    //点击selected按钮时，将modFilterCharacter设置为selected，并且将其他的type设置为default
    modFilterSelected.addEventListener('click', () => {
        modFilterCharacter = 'Selected';
        modFilterSelected.type = 'filled-tonal';
        modFilterAll.type = 'default';
        //将其他的type设置为default
        const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
        allfilterItems.forEach(item => {
            //item.type = 'default';
            item.style.color = 'var(--s-color-on-surface)';
        });
        // 将bf移出视窗，并且隐藏
        modFilterBg.style.left = '-100px';
        modFilterBg.style.width = '0px';

        filterMods();
    }
    );


    //-预设列表相关
    presetListDisplayButton.addEventListener('click', async () => {
        // 显示或隐藏presetListDrawer
        drawerPage.toggle();
        //debug
        console.log("clicked presetListButton");
    });

    presetAddConfirmButton.addEventListener('click', async () => {
        //获取 presetName
        const presetName = presetNameInput.value.trim();
        //debug
        console.log("presetName: " + presetName);
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item input:checked')).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            await loadPresets();
        }
        else {
            //debug
            console.log("presetName is empty");
        }
        //清空输入框
        presetNameInput.value = '';
    });

    presetAddButton.addEventListener('click', async () => {
        //显示添加预设对话框
        presetNameInput.value = '';
        showDialog(addPresetDialog);
    }
    );

    // 管理预设 按钮
    presetEditButton.addEventListener('click', async () => {
        //给每个 presetItem 添加删除按钮
        if (editMode) {
            //debug
            console.log("exit edit mode");
            editMode = false;
            document.querySelectorAll('#preset-item').forEach(presetItem => {
                presetItem.removeChild(presetItem.lastChild);
            });
            loadPresets();
        }
        else {
            //debug
            console.log("enter edit mode");
            editMode = true;
            document.querySelectorAll('#preset-item').forEach(presetItem => {
                const deleteButton = document.createElement('s-icon');
                deleteButton.type = 'close';
                //设置 图标 左对齐
                deleteButton.style = 'float:right; margin-left: 10px;';
                presetItem.appendChild(deleteButton);
            });
        }
    });

    //初始化按钮
    initConfigButton.addEventListener('click', async () => {
        //debug
        console.log("clicked initConfigButton");
        localStorage.clear();

        //要求用户手动刷新
        snack('Please refresh the mod list after initializing the configuration');
        showDialog(refreshDialog);
    });

    //-mod info 相关

    infoShowButton.addEventListener('click', async () => {
        //显示或隐藏modInfoDrawer
        //如果当前的type="outlined" 则将其切换为"filled"，并且开启drawer
        //debug
        console.log("clicked infoShowButton");
        if (infoShowButton.type == 'default') {
            infoShowButton.type = 'filled';
            drawerPage.show('end');
        }
        else {
            infoShowButton.type = 'default';
            drawerPage.dismiss('end');
        }
    });

    //打开mod链接
    openModUrlButton.addEventListener('click', async () => {
        //debug
        console.log("clicked openModUrlButton");
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        const modInfo = await ipcRenderer.invoke('get-mod-info', currentMod);
        if (modInfo.url) {
            await ipcRenderer.invoke('open-external-link', modInfo.url);
        }
        else {
            snack('No url found, please edit mod info');
        }
    });

    //打开mod文件夹
    openModFolderButton.addEventListener('click', async () => {
        //debug
        console.log("clicked openModFolderButton");
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        await ipcRenderer.invoke('open-mod-folder', currentMod);
    });

    //用来比较modInfo的内容是否有改变，如果有改变则显示保存按钮
    let currentModInfo;
    let currentImagePath;
    let tempModInfo;
    let tempImagePath;

    //-====================编辑mod信息====================-
    const editModInfoDialogStyle = document.createElement('style');
    editModInfoDialogStyle.innerHTML = `
        .container {
            width: calc(30% + 400px) !important;
            min-width: calc(600px) !important;
            max-width: 900px !important;
            height: fit-content !important;
            min-height: 500px !important;
            overflow: hidden !important;
            flex:1;
            padding-bottom: 30px;
        }
        .action {
            display: none !important;
        }
        s-scroll-view{
        display: none;
        }    
        `
    editModInfoDialog.shadowRoot.appendChild(editModInfoDialogStyle);
    //编辑mod.json文件
    editModInfoButton.addEventListener('click', async () => {
        //debug
        console.log("clicked editModInfoButton");
        showEditModInfoDialog();
    });

    async function showEditModInfoDialog() {
        //改为程序内编辑，而不是打开外部编辑器
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        //打开编辑对话框
        //获取mod的信息，填充到对话框中
        const modInfo = await ipcRenderer.invoke('get-mod-info', currentMod);
        //进行深拷贝，以便比较是否有改变
        currentModInfo = JSON.parse(JSON.stringify(modInfo));
        tempModInfo = JSON.parse(JSON.stringify(modInfo));
        currentImagePath = await getModImagePath(currentMod);
        tempImagePath = await getModImagePath(currentMod);

        //debug
        console.log(`modInfo:${modInfo}`);
        //填充modInfoDialog
        editModInfoDialog.querySelector('#editDialog-mod-info-name').textContent = currentMod;
        editModInfoDialog.querySelector('#editDialog-mod-info-character').textContent = modInfo.character ? modInfo.character : 'Unknown';
        editModInfoDialog.querySelector('#editDialog-mod-info-image').src = await getModImagePath(currentMod);

        editModInfoDialog.querySelector('#edit-mod-name').textContent = currentMod;
        editModInfoDialog.querySelector('#edit-mod-character').value = modInfo.character ? modInfo.character : '';
        editModInfoDialog.querySelector('#edit-mod-url').value = modInfo.url ? modInfo.url : '';
        editModInfoDialog.querySelector('#edit-mod-description').value = modInfo.description ? modInfo.description : '';


        //显示对话框
        showDialog(editModInfoDialog);
    }

    //打开mod文件夹
    const editModInfoOpenFolderButton = document.getElementById('edit-mod-name');
    editModInfoOpenFolderButton.addEventListener('click', async () => {
        //打开mod文件夹
        await ipcRenderer.invoke('open-mod-folder', currentMod);
        //要求用户手动刷新
        snack('Please refresh the mod list after editing the mod');
        showDialog(refreshDialog);
    }
    );


    //获取选择的图片
    const editModInfoImagePreview = document.getElementById('edit-mod-image-select');
    editModInfoImagePreview.addEventListener('click', async () => {
        //debug
        console.log("clicked editModInfoImagePreview");
        //打开文件选择对话框，选择图片
        const imagePath = await getFilePathsFromSystemDialog('Cover', 'image');

        //这里只显示，保存在点击保存按钮时才会保存
        if (imagePath) {
            //debug
            console.log(`imagePath:${imagePath}`);

            //显示图片
            editModInfoDialog.querySelector('#editDialog-mod-info-image').src = imagePath;
            tempImagePath = imagePath;
        }
        else {
            //debug
            console.log("no image selected");
            alert("no image selected");
        }
    });

    //保存当前编辑的mod的信息
    async function saveCurrentModInfo() {
        //debug
        console.log("clicked saveCurrentModInfo");
        //保存当前编辑的mod的信息
        tempModInfo.character = editModInfoDialog.querySelector('#edit-mod-character').value;
        tempModInfo.description = editModInfoDialog.querySelector('#edit-mod-description').value;
        tempModInfo.url = editModInfoDialog.querySelector('#edit-mod-url').value;

        //将图片保存到mod文件夹下，命名为preview + 后缀名
        //如果已经存在则覆盖，并且将文件名保存到mod.json文件中
        const imagePath = tempImagePath;
        const imageExt = path.extname(imagePath);
        const modImageName = 'preview' + imageExt;
        const modImageDest = path.join(modSourceDir, currentMod, modImageName);

        //复制图片
        console.log(`imagePath:${imagePath} \nmodImageDest:${modImageDest}`);
        //如果是默认图片则不复制

        if (imagePath != path.join(__dirname, 'default.png') && imagePath != modImageDest) {
            // 复制图片
            fs.copyFileSync(imagePath, modImageDest);
        }



        //保存到tempModInfo中
        tempModInfo.imagePath = modImageName;

        //debug
        console.log(`tempModInfo:${tempModInfo}`);
        //保存到mod.json文件中
        ipcRenderer.invoke('set-mod-info', currentMod, tempModInfo);

        //更新当前的modInfo
        currentModInfo = tempModInfo;
        currentImagePath = tempImagePath;

        //提示保存成功
        snack('Mod info saved successfully');
        //关闭对话框
        editModInfoDialog.dismiss();
        //刷新mod列表


        loadModList(() => {
            // 切换 filter 为 currentModInfo.character
            setFilter(currentModInfo.character);
            // debug
            console.log("set filter to currentModInfo.character,because of saving mod");
        });
        //debug
        console.log("refresh mod list after saving mod");
    }

    const editModInfoSaveButton = document.getElementById('edit-mod-info-save');
    editModInfoSaveButton.addEventListener('click', async () => {
        //如果当前的modInfo和tempModInfo不一样，则保存
        //保存当前编辑的mod的信息
        tempModInfo.character = editModInfoDialog.querySelector('#edit-mod-character').value;
        tempModInfo.description = editModInfoDialog.querySelector('#edit-mod-description').value;
        tempModInfo.url = editModInfoDialog.querySelector('#edit-mod-url').value;

        if (JSON.stringify(currentModInfo) != JSON.stringify(tempModInfo) || tempImagePath != currentImagePath) {
            saveCurrentModInfo();

        }
        else {
            //debug
            editModInfoDialog.dismiss();
            console.log("modInfo not changed");
            //打印当前的modInfo和tempModInfo的各个属性
            //console.log(`currentModInfo: character:${currentModInfo.character} description:${currentModInfo.description} imagePath:${currentModInfo.imagePath}`);
            //console.log(`tempModInfo: character:${tempModInfo.character} description:${tempModInfo.description} imagePath:${tempModInfo.imagePath}`);
        }
    });

    //如果取消了编辑，但是有修改，提示是否保存
    const editModInfocancelButton = document.getElementById('edit-mod-info-cancel');
    editModInfocancelButton.addEventListener('click', async () => {
        //窗口消失
        editModInfoDialog.dismiss();
    });

    editModInfoDialog.addEventListener('dismiss', async () => {
        //debug
        console.log("editModInfoDialog dismissed");
        tempModInfo.character = editModInfoDialog.querySelector('#edit-mod-character').value;
        tempModInfo.description = editModInfoDialog.querySelector('#edit-mod-description').value;
        tempModInfo.url = editModInfoDialog.querySelector('#edit-mod-url').value

        //打印当前的modInfo和tempModInfo的各个属性
        console.log(`currentModInfo: character:${currentModInfo.character} description:${currentModInfo.description} url:${currentModInfo.url} imagePath:${currentModInfo.imagePath}`);
        console.log(`tempModInfo: character:${tempModInfo.character} description:${tempModInfo.description} url:${tempModInfo.url} imagePath:${tempModInfo.imagePath}`);
        if (JSON.stringify(currentModInfo) != JSON.stringify(tempModInfo) || tempImagePath != currentImagePath) {
            //提示是否保存
            showDialog(ifSaveChangeDialog);
        }
    }
    );

    const saveChangeConfirmButton = document.getElementById('save-change-confirm');
    saveChangeConfirmButton.addEventListener('click', async () => {
        //保存当前的modInfo
        saveCurrentModInfo();
        //关闭对话框
        editModInfoDialog.dismiss();
    });

    window.addEventListener('unload', function (event) {
        setLoacalStorage('fullscreen', isFullScreen);


        if (!isFullScreen) {
            setLoacalStorage('bounds', JSON.stringify({
                x: window.screenX,
                y: window.screenY,
                width: window.outerWidth,
                height: window.innerHeight,
            }));
        }
        syncLocalStorage();
    });


    // link-button
    const linkButton = document.querySelectorAll('.link-button');
    linkButton.forEach(button => {
        button.addEventListener('click', async () => {
            const url = button.getAttribute('link');
            //debug
            console.log(`clicked link-button ${url}`);
            await ipcRenderer.invoke('open-external-link', url);
        });
    });

    //-------------------切换配置文件-------------------
    const switchConfigButton = document.getElementById('switch-config-button');

    switchConfigDialog.addEventListener("show", () => {
        // debug show switchConfigDialog
        const configList = document.getElementById('switch-config-list');
        // 读取 configRootDir 下的所有文件夹，每一个文件夹对应一个配置文件，将其显示在列表中
        const configDirs = fs.readdirSync(configRootDir).filter(file => fs.statSync(path.join(configRootDir, file)).isDirectory());
        configList.innerHTML = '';
        configDirs.forEach(dir => {
            //检查description.txt是否存在，如果不存在则不显示
            const descriptionPath = path.join(configRootDir, dir, 'description.txt');
            let description = '';
            if (fs.existsSync(descriptionPath)) {
                description = fs.readFileSync(descriptionPath, 'utf-8');
            }
            const tape = createTape(dir, description, './src/tape-cover.png');
            configList.appendChild(tape);
        }
        );
    });

    switchConfigDialog.addEventListener('dismiss', () => {
        //debug
        console.log("switchConfigDialog dismissed");
        //读取当前的配置文件
        const configList = document.getElementById('switch-config-list');
        const configTaps = configList.querySelectorAll('.tape-container');
        configTaps.forEach(tap => {
            //debug
            // console.log(`tap:${tap.name} clicked:${tap.clicked}`);
            // 为什么这里又是字符串？
            if (tap.clicked == true) {
                currentConfig = tap.name;
            }
        });

        //debug
        console.log(`currentConfig:${currentConfig}`);

        if (currentConfig != '') {
            //切换配置文件
            loadConfigFromFile(currentConfig);
        }

        init();
    });




    //-===================================内部函数===================================
    //- 内部函数

    async function syncLocalStorage() {
        //获取用户的设置
        const userConfig = {
            lang: lang,
            modRootDir: modRootDir,
            modLoaderDir: modLoaderDir,
            modSourceDir: modSourceDir,
            gameDir: gameDir,
            ifAutoApply: ifAutoApply,
            ifAutoRefreshInZZZ: ifAutoRefreshInZZZ,
            ifAutoStartGame: ifAutoStartGame,
            ifAskSwitchConfig: ifAskSwitchConfig,
            ifUseAdmin: ifUseAdmin,
            theme: theme
        };
        //debug
        console.log(userConfig);

        ipcRenderer.invoke('sync-localStorage', userConfig);
    }
    async function applyMods() {
        //获取选中的mods,mod 元素为 mod-item，当其checked属性为true时，表示选中
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        //debug
        console.log("selectedMods: " + selectedMods);
        //增加纠错
        if (modRootDir == '') {
            snack('Please select modRootDir first');
            return;
        }
        if (modSourceDir == '') {
            snack('Please select modSourceDir first');
            return;
        }

        //检查mods文件夹下是否有modSource文件夹没有的文件夹，如果有则提示用户检测到mod文件夹下有未知文件夹，是否将其移动到modSource文件夹下
        const unknownDirs = fs.readdirSync(modRootDir).filter(file => {
            const filePath = path.join(modRootDir, file);
            return fs.statSync(filePath).isDirectory() && !fs.existsSync(path.join(modSourceDir, file));
        });
        if (unknownDirs.length > 0) {
            //显示未知文件夹对话框
            showDialog(unknownModDialog);
            //显示未知文件夹
            const unknownModList = document.getElementById('unknown-mod-list');
            unknownModList.innerHTML = '';
            unknownDirs.forEach(dir => {
                const listItem = document.createElement('li');
                listItem.textContent = dir;
                unknownModList.appendChild(listItem);
            });
        }

        else await ipcRenderer.invoke('apply-mods', selectedMods);

        //如果启用了 auto-refresh-in-zzz 则使用cmd激活刷新的exe程序
        if (ifAutoRefreshInZZZ) {
            ipcRenderer.invoke('refresh-in-zzz').then(result => {
                // Refresh in ZZZ success flag
                // 0: Failed
                // 1: Success
                // 2: Cannot find the process
                // 3: Cannot find the zenless zone zero window
                // 4: Cannot find the mod manager window

                switch (result) {
                    case 0:
                        snack('Refresh in ZZZ failed');
                        break;
                    case 1:
                        snack('Refresh in ZZZ success');
                        break;
                    case 2:
                        snack('Cannot find the process', 'error');
                        break;
                    case 3:
                        snack('Cannot find the zenless zone zero window');
                        break;
                    case 4:
                        snack('Cannot find the mod manager window');
                        break;
                    default:
                        snack('Unknown error');
                        break;
                }
            });
        }
    }

    function showDialog(dialog) {
        // 将 Dialog 的 display 设置为 block
        if (dialog.style.display != 'block') {
            dialog.style.display = 'block';
            dialog.style.opacity = 1;
        }
        dialog.show();
    }

    function setLang(newLang) {
        //设置语言
        lang = newLang;
        setLoacalStorage('lang', lang);
        //debug
        console.log(`lang:${lang}`);
        //设置页面同步修改显示情况
        const langPicker = document.getElementById('language-picker');
        langPicker.value = lang;
        //翻译页面
        translatePage(lang);
    }

    function setTheme(newTheme) {
        //设置主题
        theme = newTheme;
        setLoacalStorage('theme', newTheme);
        //debug
        console.log(`theme:${newTheme}`);
        //在设置页面同步修改显示情况
        const themePicker = document.getElementById('theme-picker');
        themePicker.value = newTheme;

        //设置页面主题
        const sPages = document.querySelectorAll('s-page');
        sPages.forEach(page => {
            page.theme = newTheme;
        }
        );
        //特殊样式手动更改
        if (newTheme != 'dark') {
            //将背景图片取消显示
            sPages.forEach(page => {
                page.style.backgroundImage = 'none';
            }
            );
        }
        else {
            //将背景图片显示
            sPages.forEach(page => {
                page.style.backgroundImage = 'url(./src/background.png)';
            }
            );
        }
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
                //console.log(`Translation for ${key} not found`);
                needTranslate += `"${key}"\n`;
            }
        });
        if (needTranslate != "") {
            console.log(`Translation for the following keys not found:\n${needTranslate}`);
        }
    }

    function snack(message, type = 'basic', duration = 4000) {
        //使用自定义的snackbar组件来显示消息
        customElements.get('s-snackbar').show({
            text: message,
            type: type,
            duration: duration
        });
    }

    function clickModItem(modItem, event = null, rect = null) {
        //获取鼠标相对于卡片的位置（百分比）
        let x, y, rotateX, rotateY;
        let rotateLevel = -20;
        if (event != null) {
            //如果传入了event，则使用event的位置
            //获取鼠标相对于卡片的位置（百分比）
            x = (event.clientX - rect.left) / rect.width;
            y = (event.clientY - rect.top) / rect.height;
        }
        else {
            //如果没有传入event，且modItem.checked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
            x = modItem.checked ? 0 : Math.random() / 5 + 0.7;
            y = modItem.checked ? 0.7 : Math.random() / 5;
        }
        //根据鼠标相对于卡片的位置设置反转程度
        rotateX = 2 * (y - 0.5);
        rotateY = -2 * (x - 0.5);

        //反转卡片状态
        modItem.checked = !modItem.checked;
        modItem.setAttribute('checked', modItem.checked ? 'true' : 'false');

        if (!modItem.inWindow) {
            //如果modItem不在视窗内，则不进行动画
            console.log(`${modItem.id} is not in window`);
            return;
        }


        //添加动画
        if (modItem.checked == true) {

            modItem.animate([
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` },
                { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1.05)` },
                //缩小一点
                { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1)` },
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                iterations: 1
            });
        }
        else {
            modItem.animate([
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` },

                { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(0.88)` },
                //缩小一点
                { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(1)` },
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                iterations: 1
            });
        }
    }

    //获得mod的显示图片
    async function getModImagePath(mod) {
        //图片优先使用modInfo.imagePath，如果没有则尝试使用 mod文件夹下的preview.png或者preview.jpg或者preview.jpeg，如果没有则使用默认图片
        var modImageName = '';
        const modPath = path.join(modSourceDir, mod);
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        const modInfoImagePath = modInfo.imagePath;

        if (modInfoImagePath && fs.existsSync(path.join(modPath, modInfoImagePath))) {
            modImageName = modInfoImagePath;
            return path.join(modPath, modImageName);
        }

        const tryImageNames = ['preview.png', 'preview.jpg', 'preview.jpeg'];
        tryImageNames.forEach(imageName => {
            if (fs.existsSync(path.join(modPath, imageName))) {
                modImageName = imageName;
            }
        });

        if (modImageName != '') {
            // 如果找到了图片文件，说明mod文件夹下有preview图片，但是没有在modInfo中设置imagePath，所以需要将其保存到modInfo中
            modInfo.imagePath = modImageName;
            ipcRenderer.invoke('set-mod-info', mod, modInfo);

            // 使用snack提示用户自动保存了图片
            snack(`Original image is ${modInfoImagePath},but not found, find ${modImageName} instead, auto saved to mod.json`);
            return path.join(modPath, modImageName);
        }

        // 如果都没有的话，尝试寻找mod文件夹下的第一个图片文件
        const files = fs.readdirSync(path.join(modPath));
        const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
        //如果没有图片文件，则使用默认图片,之后直接跳出程序
        if (imageFiles.length <= 0) {
            return path.join(__dirname, 'default.png');
        }

        modImageName = imageFiles[0];
        //debug
        //console.log(`modImageName:${modImageName}`);
        return path.join(modPath, modImageName);
    }

    //使用替换的方式而不是清空再添加的方式实现loadModList，减少页面重绘次数
    async function loadModList(functionAfterLoad = null) {
        //debug
        console.log("loadModList");
        //加载mod列表
        mods = await ipcRenderer.invoke('get-mods');
        //获取当前modContainer的所有子元素
        const modContainerCount = modContainer.childElementCount;

        //使用fragment来批量添加modItem，减少重绘次数
        const fragment = document.createDocumentFragment();

        //清空modCharacters
        modCharacters = [];
        mods.forEach(async (mod, index) => {
            const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
            var modCharacter = modInfo.character ? modInfo.character : 'Unknown';
            if (!modCharacters.includes(modCharacter)) {
                modCharacters.push(modCharacter);
            }

            var modImagePath = await getModImagePath(mod);
            var modDescription = modInfo.description ? modInfo.description : 'No description';

            var modItem;
            if (index < modContainerCount) {
                modItem = modContainer.children[index];
            }
            else {
                modItem = document.createElement('s-card');
                modItem.innerHTML = `
            <div slot="image" style="height: 200px;">
                    <img src="" alt="" loading="lazy"/>
                </div>
                <div slot="headline" id="mod-item-headline"></div>
                <div slot="subhead" id="mod-item-subhead">
                </div>
                <div slot="text" id="mod-item-text">
                    <s-scroll-view>
                        <p id="mod-item-description"></p>
                        <div class="placeholder"></div>
                    </s-scroll-view>
                </div>
            `
                fragment.appendChild(modItem);
            }

            modItem.className = 'mod-item';
            modItem.checked = false;
            modItem.clickable = true;
            modItem.inWindow = false;
            modItem.id = mod;
            modItem.character = modCharacter;
            modItem.style = '';
            modItem.querySelector('img').src = modImagePath;
            modItem.querySelector('img').alt = mod;
            modItem.querySelector('#mod-item-headline').textContent = mod;
            modItem.querySelector('#mod-item-subhead').textContent = modCharacter
            //keyswap 是 一个 列表，用来存储 快捷键信息，将其转换为字符串，之后添加到description中
            let swapInfo = modInfo.keyswap.length >0 ? "keyswap : " + modInfo.keyswap.join(' ') : 'no keyswap';
            modItem.querySelector('#mod-item-description').innerHTML = swapInfo + '<br>' + modDescription;

            //debug
            //console.log(`load modItem ${mod} , character:${modCharacter} , description:${modDescription}`);
            if (index == mods.length - 1) {
                //如果是最后一个modItem,意味着所有的modItem都已经添加到fragment中，将fragment添加到modContainer中
                //需要加载的前提是数目发生变化，但是如果只是刷新modInfo，item的数目不会发生变化
                //使用上面的方法无法判断是否是最后一个modItem。

                modContainer.appendChild(fragment);

                //如果是compactMode则需要将modContainer添加上compact = true
                if (compactMode) {
                    modContainer.setAttribute('compact', 'true');
                }
                else {
                    modContainer.setAttribute('compact', 'false');
                }

                //将所有的的modItem添加到observer中
                document.querySelectorAll('.mod-item').forEach(item => {
                    observer.observe(item);

                    // 手动触发一次，以便加载当前视窗内的modItem
                    if (item.getBoundingClientRect().top < window.innerHeight) {
                        item.inWindow = true;
                    }
                });

                // 刷新modFilter
                refreshModFilter();
                //如果有functionAfterLoad则执行
                if (functionAfterLoad) {
                    functionAfterLoad();
                    //debug
                    console.log("functionAfterLoad");
                    functionAfterLoad = null;
                }
            }

        });

        //删除多余的modItem
        if (mods.length < modContainerCount) {
            for (let i = mods.length; i < modContainerCount; i++) {
                modContainer.removeChild(modContainer.children[mods.length]);
            }
        }
    }

    async function getFilePathsFromSystemDialog(fileName, fileType) {
        const result = await ipcRenderer.invoke('get-file-path', fileName, fileType);
        if (!result) {
            snack(`No ${fileType} selected`);
            return '';
        }
        //debug
        console.log(result);
        return result;
    }


    async function init() {
        const ifMainProcessReady = await ipcRenderer.invoke('get-main-process-ready');
        if (!ifMainProcessReady) {
            //debug
            console.log(`[${new Date().toLocaleTimeString()}] main process not ready,exit init`);
            return;
        }

        //debug
        console.log(`[${new Date().toLocaleTimeString()}] init`);
        // 测试，将ifAskSwitchConfig改为true
        // ifAskSwitchConfig = 'true';
        //debug
        console.log("ifAskSwitchConfig: " + ifAskSwitchConfig);

        // 检查有没有showedHelp这个localStorage，如果没有则展示help
        const showedHelp = localStorage.getItem('showedHelp');
        if (!showedHelp) {
            //展示help
            showHelp();
            //设置showedHelp为true
            setLoacalStorage('showedHelp', 'true');
        }

        //检查是否是开起了在启动时询问切换配置文件
        // if (ifAskSwitchConfig == 'true' && ifAskedSwitchConfig == false) {
        //     //展示询问切换配置文件对话框
        //     setTimeout(() => {
        //         showDialog(switchConfigDialog);
        //     }, 500);
        //     ifAskedSwitchConfig = true;
        //     return;
        // }
        // else {
        //     //如果不询问，则直接使用localStorage中的配置。
        //     //debug
        //     console.log("not ask config, use localStorage");
        // }

        // 同步用户设置
        //asyncLocalStorage();
        // 设置窗口位置和大小
        await ipcRenderer.invoke('set-bounds', bounds);
        // 设置窗口全屏
        if (isFullScreen) {
            toggleFullscreen();
        }
        // 设置语言
        setLang(lang);
        // 隐藏不支持的功能
        document.querySelectorAll("[data-platform]").forEach(element => {
            const platforms = element.dataset.platform.split(",");

            if (!platforms.includes(window.platform)) {
                element.style.display = "none";
            }
        });


        //debug
        //console.log(localStorage);
        //debug
        console.log("modRootDir: " + modRootDir);
        console.log("gameDir: " + gameDir);
        console.log("modLoaderDir: " + modLoaderDir);
        console.log("modSourceDir: " + modSourceDir);

        console.log("ifAutoRefreshInZZZ: " + ifAutoRefreshInZZZ);
        console.log("ifAutoApply: " + ifAutoApply);
        console.log("theme: " + localStorage.getItem('theme'));
        console.log("lang: " + lang);
        setTheme(localStorage.getItem('theme') || 'dark');


        await loadModList();
        await loadPresets();

        // 如果是管理员模式，似乎还需要再次获取mods
        if (ifUseAdmin == 'true' && HMC.isAdmin) {
            setTimeout(async () => {
                await loadModList();
                await loadPresets();
            }, 500);
        }
    }

    async function firstLoad() {
        setLang(lang);
        //创建 firset-opne-window
        ipcRenderer.invoke('open-first-load-window');

        //展示要求刷新的提示
        showDialog(refreshDialog);

        //设置firstOpen为false
        setLoacalStorage('firstOpen', 'false');
    }

    function saveConfigToFile(configName, configDiscription) {
        const configPath = path.join(configRootDir, configName);
        const configFile = path.join(configPath, 'config.json');

        if (configName == '') {
            snack('Please enter a config name');
            return;
        }
        if (!fs.existsSync(configRootDir)) {
            fs.mkdirSync(configRootDir);
            //debug
            console.log(`configRootDir:${configRootDir} created`);
        }
        if (!fs.existsSync(configPath)) {
            fs.mkdirSync(configPath);
            //debug
            console.log(`configPath:${configPath} created`);
        }
        //保存用户设置到config.json文件中

        const userConfig = {
            lang: lang,
            modRootDir: modRootDir,
            modLoaderDir: modLoaderDir,
            modSourceDir: modSourceDir,
            gameDir: gameDir,
            ifAutoApply: ifAutoApply,
            ifAutoRefreshInZZZ: ifAutoRefreshInZZZ,
            ifAutoStartGame: ifAutoStartGame,
            ifUseAdmin: ifUseAdmin,
            ifAskSwitchConfig: ifAskSwitchConfig,
            theme: theme
        };

        fs.writeFileSync(configFile, JSON.stringify(userConfig));

        if (configDiscription) {
            fs.writeFileSync(path.join(configPath, 'description.txt'), configDiscription);
        }

        //debug
        console.log(`userConfig:${userConfig} saved to ${configFile}`);
    }

    function loadConfigFromFile(configName) {
        const configPath = path.join(configRootDir, configName);
        const configFile = path.join(configPath, 'config.json');
        //const imageFile = path.join(configPath, 'background.png');

        //debug
        console.log(`loadConfigFromFile:${configFile}`);

        if (!fs.existsSync(configFile)) {
            snack('Config not found');
            return;
        }

        //读取用户设置,并且设置到localStorage中
        const userConfig = JSON.parse(fs.readFileSync(configFile));
        //debug
        console.log(`userConfig:${userConfig} loaded from ${configFile}`);
        //设置用户设置
        setLang(userConfig.lang);
        modRootDir = userConfig.modRootDir;
        modLoaderDir = userConfig.modLoaderDir;
        modSourceDir = userConfig.modSourceDir;
        gameDir = userConfig.gameDir;
        ifAutoApply = userConfig.ifAutoApply;
        ifAutoRefreshInZZZ = userConfig.ifAutoRefreshInZZZ;
        ifAutoStartGame = userConfig.ifAutoStartGame;
        ifUseAdmin = userConfig.ifUseAdmin;
        theme = userConfig.theme;

        //save to localStorage
        saveLocalStorage();

        //同步用户设置
        syncLocalStorage();
    }

    function saveLocalStorage() {
        //将用户设置保存到localStorage中
        localStorage.setItem('lang', lang);
        localStorage.setItem('modRootDir', modRootDir);
        localStorage.setItem('modLoaderDir', modLoaderDir);
        localStorage.setItem('modSourceDir', modSourceDir);
        localStorage.setItem('gameDir', gameDir);
        localStorage.setItem('ifAutoApply', ifAutoApply);
        localStorage.setItem('ifAutoRefreshInZZZ', ifAutoRefreshInZZZ);
        localStorage.setItem('ifAutoStartGame', ifAutoStartGame);
        localStorage.setItem('ifUseAdmin', ifUseAdmin);
        localStorage.setItem('theme', theme);
        localStorage.setItem('ifAskSwitchConfig', ifAskSwitchConfig);

        //检测是否选择了配置文件
        if (currentConfig != '') {
            localStorage.setItem('currentConfig', currentConfig);
            // 将当前配置保存在配置文件中
            saveConfigToFile(currentConfig, '');
            //debug
            console.log(`currentConfig:${currentConfig} saved to file`);
        }
    }

    function setLoacalStorage(item, value) {
        localStorage.setItem(item, value);

        //检测是否选择了配置文件
        if (currentConfig != '') {
            localStorage.setItem('currentConfig', currentConfig);
            // 将当前配置保存在配置文件中
            saveConfigToFile(currentConfig, '');
            //debug
            console.log(`currentConfig:${currentConfig} saved to file`);
        }

        //如果该配置不是 lang，theme，ifAutoApply，ifUseAdmin，则意味着不是重要的配置，可以不用 syncLocalStorage
        if (item != 'lang' && item != 'theme' && item != 'ifAutoApply' && item != 'ifUseAdmin') {
            return;
        }
        syncLocalStorage();
    }

    const saveConfigButton = document.getElementById('save-config-button');
    const saveConfigDialog = document.getElementById('save-config-dialog');
    saveConfigButton.addEventListener('click', async () => {
        //debug
        console.log("clicked saveConfigButton");

        //弹出 saveConfigDialog
        showDialog(saveConfigDialog);
    });

    //保存配置文件，监控saveConfigDialog的dismiss事件
    saveConfigDialog.addEventListener('dismiss', async () => {
        //debug
        console.log("saveConfigDialog dismissed");
        //获取用户输入的configName
        const configName = saveConfigDialog.querySelector('#save-config-name').value ? saveConfigDialog.querySelector('#save-config-name').value : 'default';
        const configDiscription = saveConfigDialog.querySelector('#save-config-description').value;
        //保存用户设置到config.json文件中
        saveConfigToFile(configName, configDiscription);
    });


    //-=================================tape display=================================

    function createTape(title, subtitle, imgPath) {
        const tape = document.createElement('div');
        tape.className = 'tape-container';
        tape.name = title;
        tape.innerHTML = `
      <!-- -磁带开始 -->
        <!-- 点击区域 -->
        <div class="tape-click-area">
        </div>
        <!-- -磁带脊柱 -->
        <div class='tape-spine'>
          <div class="tape-spine-cover">
          </div>
          <p class="tape-spine-text font-num">${title}</p>
        </div>
        <!-- -磁带封面 -->
        <!-- 结构为：tape-box > tape-cover-container -->
        <!-- tape-box > tape-body -->
        <div class="tape-box">
          <div class="tape-cover-container">
            <img src="./src/tape-mask.png" alt="tape-mask">
            <div class="tape-cover fit-parent-width" style="background-image: url(${imgPath});">
            </div>
            <!-- 文本 -->
            <p class="tape-cover-title font-num">${title}</p>
            <p class="tape-cover-subtitle font-hongmeng">${subtitle}</p>
          </div>
          <!-- -磁带本体 -->
          <div class="tape-body fit-parent-width"></div>
        </div>
      <!-- -磁带结束 -->
        `;

        //事件绑定
        initTapeEvent(tape);
        return tape;
    }



    //-轮换预设卡片相关
    function initTapeEvent(container) {
        const tapeClickArea = container.querySelector('.tape-click-area');

        //将其初始化为未点击状态
        container.clicked = false;
        container.setAttribute('clicked', 'false');
        //点击时，切换展示 侧面tape-spine 或者 tape-cover。
        tapeClickArea.addEventListener('click', () => {
            //debug
            console.log(`clicked tapeContainer ${container.name},set clicked to ${!container.clicked}`);

            //将自己取反，其他的全部设置为false
            container.clicked = !container.clicked;
            container.setAttribute('clicked', container.clicked);

            const tapeContainers = document.querySelectorAll('.tape-container');
            tapeContainers.forEach(tape => {
                if (tape != container) {
                    tape.clicked = false;
                    tape.setAttribute('clicked', 'false');
                }
            });

            //debug
            console.log(`clicked tapeContainer ${container.name},current clicked is ${container.clicked}`);
        }
        );
    }

    //-===========================主进程消息监听===========================
    ipcRenderer.on('get-localStorage', (event) => {
        //debug
        console.log('main-process get-localStorage');
        //debug
        syncLocalStorage();
    });

    ipcRenderer.on('open-switch-config-dialog', (event) => {
        //debug
        console.log('open-switch-config-dialog');
        showDialog(switchConfigDialog);
    });

    ipcRenderer.on('main-process-inited', (event) => {
        //debug
        console.log('main-process-inited');
        //初始化
        init();
    });

}
);


