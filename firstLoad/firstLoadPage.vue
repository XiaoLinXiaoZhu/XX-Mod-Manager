<template>
    <div id="control-bar">
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

            <!-- -基础设置 -->
            <div class="section" v-if="currentSection === 'basic'">
                <div class="OO-box font-hongmeng section-box">

                    <!-- -语言设置 -->
                    <div class="OO-setting-bar" id="setting-get-language">
                        <h3 data-translate-key="language"> {{ $t('setting.language') }} </h3>
                        <div id="language-picker">
                            <input type="radio" name="language" id="zh_cn" checked value="zh_cn" v-model="language">
                            <label for="zh_cn">
                                <s-chip selectable="true" type="default" id="zh_cn">
                                    <p>简体中文</p>
                                </s-chip>
                            </label>
                            <input type="radio" name="language" id="en" value="en" v-model="language">
                            <label for="en">
                                <s-chip selectable="true" type="default" id="en">
                                    <p>English</p>
                                </s-chip>
                            </label>
                        </div>
                    </div>

                    <!-- -主题设置 -->
                    <s-divider></s-divider>
                    <div class="OO-setting-bar" id="setting-get-theme">
                        <h3 data-translate-key="theme"> {{ $t('setting.theme') + ": " + theme }} </h3>
                        <div id="theme-picker">
                            <input type="radio" name="theme" id="auto" checked value="auto" v-model="theme">
                            <label for="auto"> <s-chip selectable="true" type="default" id="auto">
                                    <p data-translate-key="auto"> {{ $t('setting.auto') }} </p>
                                </s-chip> </label>
                            <input type="radio" name="theme" id="dark" value="dark" v-model="theme">
                            <label for="dark"> <s-chip selectable="true" type="default" id="dark">
                                    <p data-translate-key="dark"> {{ $t('setting.dark') }} </p>
                                </s-chip> </label>
                            <input type="radio" name="theme" id="light" value="light" v-model="theme">
                            <label for="light"> <s-chip selectable="true" type="default" id="light">
                                    <p data-translate-key="light"> {{ $t('setting.light') }} </p>
                                </s-chip> </label>
                        </div>
                    </div>
                    <s-divider></s-divider>
                </div>



            </div>

            <!-- -高级设置 -->
            <div class="section" v-if="currentSection === 'advanced'">
                <div class="OO-box font-hongmeng section-box">
                    <div class="OO-setting-bar">
                        <h3 data-translate-key="modTargetPath"> {{ $t('setting.modTargetPath') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="modTargetPath" @input="modTargetPath = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('modTargetPath', 'directory').then((res) => { modTargetPath = res; console.log('modTargetPath', res) })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>

                    </div>
                    <p> {{ $t('setting.modTargetPath-info') }} <br>当前目录为: {{
                        modTargetPath }}</p>

                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="modSourcePath"> {{ $t('setting.modSourcePath') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="modSourcePath" @input="modSourcePath = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('modSourcePath', 'directory').then((res) => { modSourcePath = res })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>
                    </div>
                    <p data-translate-key="modSourcePath-info"> {{ $t('setting.modSourcePath-info') }}
                        <br>当前目录为: {{ modSourcePath }}
                    </p>

                    <s-divider></s-divider>
                    <div class="OO-setting-bar">
                        <h3> 将 mod目标 下的所有文件移动到 mod源 </h3>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button" style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
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
                    <p data-translate-key="presetPath-info"> {{ $t('setting.presetPath-info') }} <br>当前目录为: {{
                        presetPath }}</p>

                    <s-divider></s-divider>



                    <h3 data-translate-key="about-program"> 关于本程序 </h3>
                    <div class="OO-setting-bar">
                        <h3 data-translate-key="about-principle-info"> 运行原理 </h3>
                    </div>
                    <div class="OO-box OO-shade-box">
                        <p data-translate-key="dialog-about-principle">
                            本程序通过代理Mods文件夹的方式来实现mod的加载，通过动态调整mod文件夹内部的文件来实现mod的加载，
                            所以请不要在mod文件夹内添加任何文件！将你的mod添加到modSource文件夹中即可。
                        </p>
                        <img src="../src/assets/description.png" alt="description" style="width: 50%;height: auto;">
                    </div>

                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>

            <!-- -自动化设置 -->
            <div class="section" v-if="currentSection === 'auto'">
                <div class="OO-box font-hongmeng section-box">
                    <h3>
                        {{ $t('setting.unavailable') }}
                    </h3>
                    <div class="OO-setting-bar">
                        <h3 data-translate-key="autoStartGame"> {{ $t('setting.autoStartGame') }} </h3>
                        <s-switch v-model="autoStartGame"></s-switch>
                    </div>
                    <p data-translate-key="autoStartGame-info"> {{ $t('setting.autoStartGame-info') }} </p>
                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="modLoaderDir"> {{ $t('setting.modLoaderDir') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="modLoaderDir" @input="modLoaderDir = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('modLoaderDir', 'file').then((res) => { modLoaderDir = res })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>
                    </div>
                    <p data-translate-key="modLoaderDir-info"> {{ $t('setting.modLoaderDir-info') }} </p>
                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="gameDir"> {{ $t('setting.gameDir') }} </h3>
                        <div class="OO-s-text-field-container">
                            <s-text-field :value="gameDir" @input="gameDir = $event.target.value">
                            </s-text-field>
                            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                @click="iManager.setConfigFromDialog('gameDir', 'file').then((res) => { gameDir = res })">
                                <s-icon type="add"></s-icon>
                            </s-icon-button>
                        </div>
                    </div>
                    <p data-translate-key="gameDir-info"> {{ $t('setting.gameDir-info') }} </p>
                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="autoApply"> {{ $t('setting.autoApply') }} </h3>
                        <s-switch v-model="ifAutoApply"></s-switch>
                    </div>
                    <p data-translate-key="autoApply-info"> {{ $t('setting.autoApply-info') }} </p>
                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="autoRefreshInZZZ"> {{ $t('setting.autoRefreshInZZZ') }} </h3>
                        <s-switch v-model="ifAutoRefreshInZZZ"></s-switch>
                    </div>
                    <p data-translate-key="autoRefreshInZZZ-info"> {{ $t('setting.autoRefreshInZZZ-info') }} </p>
                    <s-divider></s-divider>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="useAdmin"> {{ $t('setting.useAdmin') }} </h3>
                        <s-switch v-model="ifUseAdmin"></s-switch>
                    </div>
                    <p data-translate-key="useAdmin-info"> {{ $t('setting.useAdmin-info') }} </p>

                    <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
                </div>
            </div>

            <!-- -更多的说明 -->
            <div class="section" v-if="currentSection === 'more'">
                <div class="OO-box font-hongmeng section-box">
                    <h3 data-translate-key="about-program"> 关于本程序 </h3>
                    <div class="OO-setting-bar" style="height: fit-content;">
                        <p data-translate-key="about-content"> 本程序由 XLXZ 开发,开源免费,遵循GNU General Public License
                            v3.0。用于管理基于3dmigoto的mod
                            ,理论上来说也可以管理其他游戏的mod(只要是基于3dmigoto的) </p>
                    </div>
                    <div class="OO-setting-bar">
                        <p data-translate-key="about-version"> 最新版本在gamebanana上发布，如果你有任何问题或者建议，欢迎在github上提出 </p>
                    </div>
                    <div class="OO-setting-bar">
                        <p data-translate-key="about-author"> 作者：XLXZ </p>
                    </div>
                    <s-divider></s-divider>
                    <div class="OO-setting-bar" style="height: 100px;">
                        <h3 data-translate-key="about-thanks"> 感谢 soliddanii <br>提供的帮助 </h3>
                        <s-button class="link-button" type="text" link="https://github.com/soliddanii"
                            data-translate-key="click-to-jump"> 点击跳转 </s-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> Github </h3>
                        <s-button class="link-button" type="text"
                            link="https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto/"
                            data-translate-key="click-to-jump"> 点击跳转 </s-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> Gamebanana </h3>
                        <s-button class="link-button" type="text" link='https://gamebanana.com/tools/17889'
                            data-translate-key="click-to-jump"> 点击跳转 </s-button>
                    </div>
                    <div class="OO-setting-bar">
                        <h3> Caimogu </h3>
                        <s-button class="link-button" type="text" link='https://www.caimogu.cc/post/1408504.html'
                            data-translate-key="click-to-jump"> 点击跳转 </s-button>
                    </div>

                    <div class="OO-setting-bar">
                        <h3 data-translate-key="about-principle-info"> 运行原理 </h3>

                    </div>
                    <div class="OO-box OO-shade-box">
                        <p data-translate-key="dialog-about-principle">
                            本程序通过代理Mods文件夹的方式来实现mod的加载，通过动态调整mod文件夹内部的文件来实现mod的加载，
                            所以请不要在mod文件夹内添加任何文件！将你的mod添加到modSource文件夹中即可。
                        </p>
                        <img src="../src/assets/description.png" alt="description" style="width: 50%;height: auto;">
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

const ipcRenderer = require('electron').ipcRenderer;
const iManager = new IManager();


const sections = ref(['basic', 'advanced', 'auto', 'more']);
const sectionSelectorRef = useTemplateRef('section-selector');
const currentSection = ref('basic');

const language = ref('zh_cn');
const theme = ref('auto');
const modTargetPath = ref('');
const modSourcePath = ref('');
const presetPath = ref('');
const autoStartGame = ref(false);
const modLoaderDir = ref('');
const gameDir = ref('');
const ifAutoApply = ref(false);
const ifAutoRefreshInZZZ = ref(false);
const ifUseAdmin = ref(false);


watch(language, (newVal) => {
    // iManager.config.language = newVal;
    //变量命名不能包含-，所以这里需要转换
    console.log('language change', newVal);
    iManager.setLanguage(newVal);
    iManager.saveConfig();
});
watch(theme, (newVal) => {
    iManager.config.theme = newVal;
    //现在暂时是手动调用 事件 激活
    iManager.trigger('theme-change', newVal);

    iManager.saveConfig();
});
watch(modTargetPath, (newVal) => {
    //debug
    console.log('modTargetPath change', newVal);
    iManager.config.modTargetPath = newVal;
    iManager.saveConfig();
});
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
        alert('mod目标路径或mod源路径为空');
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

onMounted(async () => {
    await iManager.waitInit();
    language.value = iManager.config.language;
    theme.value = iManager.config.theme;
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
    width: 100%;
    height: calc(100% - 50px);
    bottom: 0px;
}

.section-box {
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
</style>