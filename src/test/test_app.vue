<template>
    <div class="main-container">
        <div class="head">
            <backbutton @click="closeApp" />
            <div id="drag-bar" style="flex: 1;height: 100%;app-region: drag;"></div>
            <sectionSelector :sections="sections" @update:currentSection="handleSectionChange"></sectionSelector>
        </div>

        <div class="section-container">
            <modCardSection v-if="currentSection === 'mod'" />
            <settingSection v-if="currentSection === 'settings'" />
        </div>
    </div>
    <CssProxy />
    <dialogAddPreset></dialogAddPreset>
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

const sections = ref(['mod', 'help', 'settings']);
const currentSection = ref('mod');

const handleSectionChange = (section) => {
    currentSection.value = section;
    //debug
    console.log('handleSectionChange', section);
};

const closeApp = () => {
    //关闭当前窗口
    window.close();
};
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
</style>