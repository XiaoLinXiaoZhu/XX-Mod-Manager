<template>
    <div class="control-bar">
        <div id="rectangle"
            style="width: 73%; height: 8px; background-color:var(--s-color-outline-variant); border-radius: 10px;align-self: center;">
        </div>
    </div>

    <div class="main-container">
        <div class="head">
            <sectionSelector :sections="sections" @update:currentSection="handleSectionChange" id="section-selector"
                ref="section-selector">
            </sectionSelector>
        </div>

        <div class="section-container">
            <!-- -简单介绍 -->
            <div class="section OO-box" v-if="currentSection === 'intro'">
                <div class="section-box">
                    <div class="OO-box OO-shade-box">
                        <h2 style="margin: 5px 0 10px 0;"> 欢迎使用 XX-mod-manager(XXMM) </h2>
                        <p> 在下方先选择你的语言和主题</p>
                    </div>
                    <!-- -语言设置 -->
                    <settingBar :data=languageData />
                    <!-- -主题设置 -->
                    <s-divider></s-divider>
                    <settingBar :data=themeData />
                    <p>
                        主题推荐使用黑暗主题，在设计时，我更多的考虑了黑暗主题的美观性，它模仿了ZZZ的设计风格
                    </p>

                    <div class="OO-setting-bar">
                        <h3> 这是什么？ </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> 这是一个mod管理器，用于管理基于3dmigoto的mod。它拥有强大的功能和美观的界面，让你更方便的管理mod。
                        </p>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> 它拥有什么功能？ </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <ol>
                            <li> 通过可视化的卡片 直观地管理mod
                            </li>
                            <li>
                                通过设置 保存mod的各种信息
                            </li>
                            <li>
                                通过设置 一组预设 来快速切换 不同的mod组合
                            </li>
                            <li>
                                通过设置 自动化功能 来 实现从打开3dmigoto到启动游戏再到自动刷新应用的mod 的 全自动化 (ZZMM中已有的功能，但是还没迁移到XXMM，代码需要重构)
                            </li>
                        </ol>
                    </div>
                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>


            <!-- -基础设置 -->
            <div class="OO-box section" v-if="currentSection === 'basic'">
                <div class="section-box">
                    <div class="OO-setting-bar">
                        <h3> 先决条件 </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> 请确保你已经安装了3dmigoto
                            或者其他的mod加载器，并且已经成功运行过。如果你还没有安装3dmigoto，请先安装3dmigoto。如果你不明白3dmigoto是什么，请自行搜索。 </p>
                        <br>
                        <p> 请注意，本程序只是mod管理器，不是mod加载器，它需要依赖3dmigoto或者其他的mod加载器来加载mod </p>
                    </div>
                    <s-divider></s-divider>
                    <!-- -简单介绍 -->

                    <div class="OO-box OO-shade-box">
                        <h2 style="margin: 5px 0 10px 0;"> 在使用之前，让我们进行一些名词解释 </h2>
                    </div>
                    <s-divider></s-divider>
                    <p class="alert"> 请注意，下述三个文件夹不能相同，否则会导致程序无法正常运行 </p>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.modTargetPath') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> 【{{ $t('setting.modTargetPath') }}】 是你的 模组加载器
                            实际加载的文件夹，对于ZZMI来说，就是ZZMI的Mods文件夹；对于XXMI来说，就是XXMI内部文件夹/zzz/Mods </p>
                        <p class="alert" style="margin-top: 10px;">
                            本程序通过代理Mods文件夹的方式来实现mod的加载，通过动态调整mod文件夹内部的文件来实现mod的加载，
                            所以请不要在mod目标文件夹内添加任何文件！将你的mod添加到mod源文件夹中即可。
                        </p>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.modSourcePath') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> 【{{ $t('setting.modSourcePath') }}】 是 本程序
                            读取mod的文件夹，也是你应当用来存放mod的文件夹。它应该被设置为任意位置的一个空文件夹，之后你需要将你的mod添加到这个文件夹中</p>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.presetPath') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> 【{{ $t('setting.presetPath') }}】 是
                            用于存放mod预设的文件夹，程序将在这里存放一组mod的配置，在配置之后，你将通过预设功能快速切换不同的mod组合。它应该被设置为任意位置的一个空文件夹 </p>
                    </div>
                    <h3> 关于本程序 </h3>
                    <div class="OO-setting-bar">
                        <h3> 运行原理 </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p>
                            本程序通过代理Mods文件夹的方式来实现mod的加载，通过动态调整mod文件夹内部的文件来实现mod的加载。
                        </p>
                        <img src="../src/assets/description.png" alt="description" style="width: 50%;height: auto;">
                    </div>

                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>



            </div>

            <!-- -高级设置 -->
            <div class="OO-box section" v-if="currentSection === 'advanced'">
                <div class="section-box">
                    <!-- -简单介绍 -->
                    <div class="OO-box OO-shade-box">
                        <h2 style="margin: 5px 0 10px 0;"> 就快要好了，再进行一些设置，让XXMM代理 你的 Mods 文件夹 </h2>
                        <p> 请设置 mod目标文件夹 和 mod源文件夹 以及 预设文件夹 </p>
                        <p> 如果你不清楚这些是什么，请回到上一页查看 </p>
                    </div>
                    <settingBar :data=modTargetPathData />
                    <p> {{ $t('setting.modTargetPath-info') }} <br>当前文件夹为: {{
                        modTargetPath }}</p>

                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.modSourcePath') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="modSourcePath" @input="modSourcePath = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('modSourcePath', 'directory').then((res) => { modSourcePath = res })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>
                    </div>
                    <p> {{ $t('setting.modSourcePath-info') }}
                        <br>当前文件夹为: {{ modSourcePath }}
                    </p>

                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> 将 mod目标 下的所有文件移动到 mod源 </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="handleMoveAllFiles">
                            <s-icon type="add"></s-icon>
                        </s-icon-button>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.presetPath') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="presetPath" @input="presetPath = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('presetPath', 'directory').then((res) => { presetPath = res })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>
                    </div>
                    <p class="alert"> 该文件夹路径也为必填项，如果不设置，程序将无法正常运行 </p>
                    <p> {{ $t('setting.presetPath-info') }} <br>当前文件夹为: {{
                        presetPath }}</p>

                    <s-divider></s-divider>
                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>

            <!-- -自动化设置 -->
            <div class="OO-box section" v-if="currentSection === 'auto'">
                <div class="section-box">
                    <div class="OO-box OO-shade-box">
                        <h2 style="margin: 5px 0 10px 0;"> 自动化设置 </h2>
                        <p> 本程序支持自动启动游戏，自动应用mod，自动刷新应用的mod等功能，你可以在设置里面进行设置 </p>
                        <br>
                        <p> 你也可以为程序安装插件，来实现更多的功能 </p>
                    </div>

                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>

            <!-- -更多的说明 -->
            <div class="OO-box section" v-if="currentSection === 'more'">
                <div class="section-box">
                    <!-- -恭喜设置完毕 -->
                    <div class="OO-box OO-shade-box">
                        <h2> 恭喜设置完毕 </h2>
                        <p> 你已经完成了所有设置，现在可以开始使用本程序了,请关闭本页面 </p>
                        <br>
                        <s-button class="OO-color-gradient font-hongmeng" @click="closeSettingPage"> 点击关闭 </s-button>
                    </div>

                    <div class="OO-setting-bar">
                        <h3> 关于本程序 </h3>
                    </div>

                    <div class="OO-box OO-shade-box">
                        <p> 本程序由 XLXZ 开发,开源免费,遵循GNU General Public License
                            v3.0。用于管理基于3dmigoto的mod
                            ,理论上来说也可以管理其他游戏的mod(只要是基于3dmigoto的) </p>
                    </div>
                    <div class="OO-setting-bar">
                        <p> 最新版本在gamebanana上发布，如果你有任何问题或者建议，欢迎在github上提出 </p>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> 作者 </h3>
                        <p> XLXZ </p>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> 特别感谢 </h3>
                        <s-button class="OO-button-box" @click="iManager.openUrl('https://github.com/soliddanii')">
                            soliddanii
                        </s-button>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> Github </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="iManager.openUrl('https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto')">
                            <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                                </svg></s-icon>
                        </s-icon-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> Gamebanana </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="iManager.openUrl('https://gamebanana.com/tools/17889')">
                            <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                                </svg></s-icon>
                        </s-icon-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> Caimogu </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="iManager.openUrl('https://www.caimogu.cc/post/1408504.html')">
                            <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                                </svg></s-icon>
                        </s-icon-button>
                    </div>
                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>

            </div>

        </div>
        <div class="buttons">
            <s-button type="text" @click="prev" id="prev" class="OO-button-box">上一页</s-button>
            <s-button type="text" @click="next" id="next" class="OO-button-box">下一页</s-button>
        </div>

    </div>
    <CssProxy />
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, computed, watch, useTemplateRef } from 'vue';

import sectionSelector from '../src/components/sectionSelector.vue';
import IManager from '../electron/IManager';
import CssProxy from '../src/components/cssProxy.vue';
import settingBar from '../src/components/settingBar.vue';
import getData from '../src/section/settingSectionData.js';

let { languageData, themeData, modTargetPathData, modSourcePathData, presetPathData, initAllDataButton } = getData();



const ipcRenderer = require('electron').ipcRenderer;
const iManager = new IManager();


const sections = ref(['intro', 'basic', 'advanced', 'auto', 'more']);
const sectionSelectorRef = useTemplateRef('section-selector');
const currentSection = ref('intro');

const modTargetPath = ref('');
const modSourcePath = ref('');
const presetPath = ref('');
const autoStartGame = ref(false);
const modLoaderDir = ref('');
const gameDir = ref('');
const ifAutoApply = ref(false);
const ifAutoRefreshInZZZ = ref(false);
const ifUseAdmin = ref(false);


watch(modSourcePath, (newVal) => {
    iManager.config.modSourcePath = newVal;
    iManager.saveConfig();
});
watch(presetPath, (newVal) => {
    iManager.config.presetPath = newVal;
    iManager.saveConfig();
});


const handleSectionChange = (section) => {
    currentSection.value = section;
    //debug
    console.log('handleSectionChange', section);
};

const handleMoveAllFiles = () => {
    //debug
    console.log('handleMoveAllFiles', modTargetPath.value.length, modSourcePath.value.length);
    if (modTargetPath.value.length === 0 || modSourcePath.value.length === 0) {
        console.log('modTargetPath or modSourcePath is empty');
        alert('mod目标文件夹或mod源文件夹为空');
        return;
    }
    iManager.moveAllFiles(modTargetPath.value, modSourcePath.value);
};

const next = () => {
    //debug
    console.log(sectionSelectorRef.value);
    sectionSelectorRef.value.nextSection();
};

const prev = () => {
    sectionSelectorRef.value.prevSection();
};

function closeSettingPage() {
    console.log('closeSettingPage');
    iManager.config.firstLoad = false;
    iManager.saveConfig();
    ipcRenderer.send('refresh-main-window');

    //关闭窗口
    window.close();
}

onMounted(async () => {
    await iManager.waitInit();
    modTargetPath.value = iManager.config.modTargetPath;
    modSourcePath.value = iManager.config.modSourcePath;
    presetPath.value = iManager.config.presetPath;
    autoStartGame.value = iManager.config.autoStartGame;
    modLoaderDir.value = iManager.config.modLoaderDir;
    gameDir.value = iManager.config.gameDir;
    ifAutoApply.value = iManager.config.ifAutoApply;
    ifAutoRefreshInZZZ.value = iManager.config.ifAutoRefreshInZZZ;
    ifUseAdmin.value = iManager.config.ifUseAdmin;
});

</script>

<style scoped>
.main-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    align-items: center;
}

.head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 5px 20px;
    height: 50px;
}

#section-selector {
    width: 100%;
}

.section-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    width: calc(100% - 20px);
    height: calc(100% - 90px);
    padding: 10px;
    bottom: 0px;
    overflow: visible;
}

.section {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: calc(100% - 30px);
    height: calc(100% - 60px);
    bottom: 0px;

    >div {
        margin-right: -10px;
        padding-right: 10px;
    }
}

.section-box {
    height: 100%;
    overflow: auto;
}

.buttons {
    position: absolute;
    bottom: 0px;
    display: flex;
    justify-content: space-around;
    width: 100%;
    height: 50px;
}

.OO-button-box {
    width: 30%;
    height: calc(100% - 20px);
}

.alert {
    color: red;
}

.control-bar {
    width: 100%;
    margin: 0 0 10px 0;
    height: 30px;
    display: flex;

    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    background-color: #00000000;
    position: fixed;
    top: 0;
    left: 0;

    -webkit-app-region: drag;
}
</style>