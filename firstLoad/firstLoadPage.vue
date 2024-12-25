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
                        <h2 style="margin: 5px 0 10px 0;"> {{ $t('firstLoad.huan-ying-shi-yong-xxmodmanagerxxmm') }} </h2>
                        <p> {{ $t('firstLoad.selectLanguageAndTheme') }}</p>
                    </div>
                    <!-- -语言设置 -->
                    <settingBar :data=languageData />
                    <!-- -主题设置 -->
                    <s-divider></s-divider>
                    <settingBar :data=themeData />
                    <p>
                        {{ $t('firstLoad.themeRecommand') }} </p>

                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.whatIsThis') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> {{ $t('firstLoad.Introduction') }}
                        </p>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.whatCanIt') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <ol>
                            <li> {{ $t('firstLoad.whatCanIt-1') }}
                            </li>
                            <li>
                                {{ $t('firstLoad.whatCanIt-2') }} </li>
                            <li>
                                {{ $t('firstLoad.whatCanIt-3') }} </li>
                            <li>
                                {{ $t('firstLoad.whatCanIt-4') }} </li>
                        </ol>
                    </div>
                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>


            <!-- -基础设置 -->
            <div class="OO-box section" v-if="currentSection === 'basic'">
                <div class="section-box">
                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.prerequisites') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> {{ $t('firstLoad.prerequisites-1') }} </p>
                        <br>
                        <p> {{ $t('firstLoad.prerequisites-2') }} </p>
                    </div>
                    <s-divider></s-divider>
                    <!-- -简单介绍 -->

                    <div class="OO-box OO-shade-box">
                        <h2 style="margin: 5px 0 10px 0;"> {{ $t('firstLoad.explanation') }} </h2>
                    </div>
                    <s-divider></s-divider>
                    <p class="alert"> {{ $t('firstLoad.alertFolder') }} </p>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.modTargetPath') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> {{ $t('firstLoad.modTargetPathInfo-1') }} </p>
                        <p class="alert" style="margin-top: 10px;">
                            {{ $t('firstLoad.modTargetPathInfo-2') }} </p>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.modSourcePath') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> {{ $t('firstLoad.modSourcePathInfo') }}</p>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.presetPath') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p> {{ $t('firstLoad.modPresetPathInfo') }} </p>
                    </div>
                    <h3> {{ $t('firstLoad.aboutProgram') }} </h3>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.aboutProgramPrinciple') }} </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p>
                            {{ $t('firstLoad.aboutProgramPrincipleInfo') }} </p>
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
                        <h2 style="margin: 5px 0 10px 0;"> {{ $t('firstLoad.advancedIntro') }} </h2>
                        <p> {{ $t('firstLoad.advancedIntro-1') }} </p>
                        <p> {{ $t('firstLoad.advancedIntro-2') }} </p>
                    </div>
                    <!-- <settingBar :data=modTargetPathData /> -->
                    <div class="OO-setting-bar">
                        <h3> {{ $t('setting.modTargetPath') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="modTargetPath" @input="modTargetPath = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('modTargetPath', 'directory').then((res) => { modTargetPath = res })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>
                    </div>
                    <p> {{ $t('setting.modTargetPath-info') }} <br></p>

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
                    </p>

                    <!-- <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.autoMove') }} </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="handleMoveAllFiles">
                            <s-icon type="add"></s-icon>
                        </s-icon-button>
                    </div> -->
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
                    <p class="alert"> {{ $t('firstLoad.alertPreset') }} </p>
                    <p> {{ $t('setting.presetPath-info') }} </p>
                    <s-divider></s-divider>
                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>

            <!-- -自动化设置 -->
            <div class="OO-box section" v-if="currentSection === 'auto'">
                <div class="section-box">
                    <div class="OO-box OO-shade-box">
                        <h2 style="margin: 5px 0 10px 0;"> {{ $t('firstLoad.autoSetting') }} </h2>
                        <p> {{ $t('firstLoad.autoInfo-1') }} </p>
                        <br>
                        <p> {{ $t('firstLoad.autoInfo-2') }} </p>
                    </div>

                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>

            <!-- -更多的说明 -->
            <div class="OO-box section" v-if="currentSection === 'more'">
                <div class="section-box">
                    <!-- -恭喜设置完毕 -->
                    <div class="OO-box OO-shade-box">
                        <h2> {{ $t('firstLoad.congratulate') }} </h2>
                        <p> {{ $t('firstLoad.congratulate-1') }} </p>
                        <br>
                        <s-button class="OO-color-gradient font-hongmeng" @click="closeSettingPage"> {{ $t('buttons.clickToClose') }} </s-button>
                    </div>

                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.aboutProgram') }} </h3>
                    </div>

                    <div class="OO-box OO-shade-box">
                        <p> {{ $t('firstLoad.aboutProgramInfo') }} </p>
                    </div>
                    <div class="OO-setting-bar">
                        <p> {{ $t('firstLoad.aboutProgramInfo-1') }} </p>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('author') }} </h3>
                        <p> XLXZ </p>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('firstLoad.thanks') }} </h3>
                        <s-button class="OO-button-box" @click="iManager.openUrl('https://github.com/soliddanii')">
                            soliddanii
                        </s-button>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('github') }} </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="iManager.openUrl('https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto')">
                            <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                                </svg></s-icon>
                        </s-icon-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('gamebanana') }} </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                            @click="iManager.openUrl('https://gamebanana.com/tools/17889')">
                            <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                                </svg></s-icon>
                        </s-icon-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> {{ $t('caimogu') }} </h3>
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
            <s-button type="text" @click="prev" id="prev" class="OO-button-box">{{ $t('buttons.nextPage') }}</s-button>
            <s-button type="text" @click="next" id="next" class="OO-button-box">{{ $t('buttons.forePage') }}</s-button>
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
        alert(t('message.alert.emptyModSourceOrTarget'));
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

    // 不论用户是否看完了 都 取消首次加载
    iManager.config.firstLoad = false;
    iManager.saveConfig();
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