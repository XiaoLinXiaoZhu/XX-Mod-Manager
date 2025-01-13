<template>
    <div class="main-container" ref="modCardState">
        <div class="head">
            <backbutton @click="handleBackButtomClick" />
            <div id="drag-bar" style="flex: 1;height: 100%;app-region: drag;"></div>
            <sectionSelector :sections="sections" @update:currentSection="handleSectionChange"></sectionSelector>
        </div>

        <div class="section-container">
            <!-- <modCardSection v-if="currentSection === 'mod'" />
            <helpSection v-if="currentSection === 'help'" />
            <settingSection v-if="currentSection === 'settings'" /> -->
            <!-- -使用 v-if 会导致多次重载以及事件绑定 改为使用 左右滑动 -->
            <div class="section-slider" :style="{transform: `translateX(calc(${sections.indexOf(currentSection)} * (10px - 100vw) ))`}">
                <div style="width: calc(100vw - 10px);">
                    <modCardSection />
                </div>
                <div style="width: calc(100vw - 10px);">
                    <helpSection v-if="loaded" />
                </div>
                <div style="width: calc(100vw - 10px);">
                    <settingSection v-if="loaded" />
                </div>
            </div>
            
        </div>
    </div>

    <div class="main-container hide" ref="switchConfigState">
        <div class="head">
            <backbutton @click="closeApp" />
            <div id="drag-bar" style="flex: 1;height: 100%;app-region: drag;"></div>
        </div>

        <div class="OO-box">
            <settingBar :data="changeConfig" />
            <settingBar :data="createShortOfCurrentConfig" />
        </div>
    </div>




    <CssProxy />
    <dialogAddPreset></dialogAddPreset>
    <dialogModInfo2 :mod="lastClickedMod" />
    <dialogLoading />
    <DialogNeedRefresh />
</template>

<script setup>
const fs = require('fs').promises;
import { defineProps, defineEmits, ref, onMounted, computed ,watch, useTemplateRef} from 'vue';

import modCardSection from '../section/modCardSection.vue';
import backbutton from '../components/backButton.vue';
import sectionSelector from '../components/sectionSelector.vue';
import modCardManager from '../components/modCardManager.vue';
import dialogAddPreset from '../dialogs/dialogAddPreset.vue';
import settingSection from '../section/settingSection.vue'; 
import CssProxy from '../components/cssProxy.vue';
import dialogModInfo from '../dialogs/dialogModInfo.vue';
import dialogModInfo2 from '../dialogs/dialogModInfo2.vue';
import helpSection from '../section/helpSection.vue';
import dialogLoading from '../dialogs/dialogLoading.vue';
import settingBar from '../components/settingBar.vue';
import IManager from '../../electron/IManager';
import DialogNeedRefresh from '../dialogs/dialogNeedRefresh.vue';

const loaded = ref(false);

const iManager = new IManager();

//-========================= 状态管理 =========================
const currentSatate = ref('mod-card');

const sections = ref(['mod', 'help', 'settings']);
const currentSection = ref('mod');

const lastClickedMod = ref(null);
const handleSectionChange = (section) => {
    currentSection.value = section;
    //debug
    console.log('handleSectionChange', section);
};

const modCardState = useTemplateRef('modCardState');
const switchConfigState = useTemplateRef('switchConfigState');

const closeApp = () => {
    //关闭当前窗口
    window.close();
};

const handleBackButtomClick = () => {
    // 将main-container的display设置为none
    // document.querySelector('.main-container').style.display = 'none';

    closeApp();
    return;
    // 未来添加返回上一级的功能
    currentSatate.value = 'switch-config';

    // 为 modCardSection 增加淡出效果
    modCardState.value.classList.add('hiding');
    setTimeout(() => {
        modCardState.value.classList.add('hide');
        switchConfigState.value.classList.remove('hide');
    }, 500);
};



//-================== change config ====================
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

const changeConfig = {
    name: 'changeConfig',
    data: null,
    type: 'dir',
    displayName: 'Change Config',
    description: 'Change Config',
    t_displayName: {
        zh_cn: '更改配置',
        en: 'Change Config'
    },
    t_description: {
        zh_cn: '选择配置文件夹',
        en: 'Select Config Folder'
    },
    onChange: (value) => {
        console.log('changeConfig changed:', value);
    }
}

const createShortOfCurrentConfig = {
    name: 'createShortOfCurrentConfig',
    data: null,
    type: 'button',
    displayName: 'Create Short Of Current Config',
    description: 'Create Short Of Current Config',
    buttonName: 'Create Short Of Current Config',
    t_buttonName: {
        zh_cn: '创建快捷方式',
        en: 'Create Short'
    },
    t_displayName: {
        zh_cn: '创建当前配置的快捷方式',
        en: 'Create Short Of Current Config'
    },
    t_description: {
        zh_cn: '创建当前配置的快捷方式',
        en: 'Create Short Of Current Config'
    },
    onChange: (value) => {
        console.log('createShortOfCurrentConfig changed:', changeConfig.data);


        iManager.createAppShortCut(changeConfig.data).then(() => {
            console.log('createShortOfCurrentConfig success');
        }).catch((err) => {
            console.log('createShortOfCurrentConfig failed:', err);
        });
    }
}











iManager.waitInit().then(() => {
    loaded.value = true;
    // iManager.on('lastClickedModChanged', (mod) => {
    //     lastClickedMod.value = mod;
    // });
    iManager.on('currentModChanged', (mod) => {
        lastClickedMod.value = mod;
    });

    iManager.on('modInfoChanged', (mod) => {
        lastClickedMod.value = null;
        setTimeout(() => {
            lastClickedMod.value = mod;
        }, 1);
    });
});
</script>


<style scoped>
.main-container {
    display: flex;
    height: 100%;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
}

.main-container.hiding {
    opacity: 0;

    transition:opacity 0.5s ease-in-out;

    .section-container {
        transform: translateX(40%);
        transition: transform 0.5s ease-in-out;
    }
    .head {
        transform: translateY(-100%);
        transition: transform 0.3s ease-in-out;
    }
}

.main-container.hide {
    display: none;
}

.head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 20px;
    height: 50px;
}

.section-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    width: calc(100% - 20px);
    height: calc(100% - 70px);
    padding: 10px;
    bottom: 50px;
    top: 50px;
    overflow:visible;
}

.section-slider {
    display: flex;
    flex-direction: row;
    flex: 1;
    transition: transform 0.3s;
    overflow: visible;
    position: relative;
    height: calc(100%);
    width: 1300%;
}

</style>