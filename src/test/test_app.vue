<template>
    <div class="main-container">
        <div class="head">
            <backbutton></backbutton>
            <sectionSelector :sections="sections" @update:currentSection="handleSectionChange"></sectionSelector>
        </div>

        <div class="section-container">
            <modCardSection v-if="currentSection === 'Mod'" />
        </div>
    </div>

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

const sections = ref(['Mod', 'Help', 'Settings']);
const currentSection = ref('Mod');

const handleSectionChange = (section) => {
    currentSection.value = section;
    //debug
    console.log('handleSectionChange', section);
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