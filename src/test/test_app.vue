<template>
    <div class="main-container">
        <div class="head">
            <backbutton @click="closeApp" />
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
    <CssProxy />
    <dialogAddPreset></dialogAddPreset>
    <dialogModInfo2 :mod="lastClickedMod" />
    <dialogLoading />
    <DialogNeedRefresh />
</template>

<script setup>
const fs = require('fs').promises;
import { defineProps, defineEmits, ref, onMounted, computed ,watch} from 'vue';

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

import IManager from '../../electron/IManager';
import DialogNeedRefresh from '../dialogs/dialogNeedRefresh.vue';

const loaded = ref(false);

const iManager = new IManager();

const sections = ref(['mod', 'help', 'settings']);
const currentSection = ref('mod');
const lastClickedMod = ref(null);
const handleSectionChange = (section) => {
    currentSection.value = section;
    //debug
    console.log('handleSectionChange', section);
};

const closeApp = () => {
    //关闭当前窗口
    window.close();
};

iManager.waitInit().then(() => {
    loaded.value = true;
    iManager.on('lastClickedModChanged', (mod) => {
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