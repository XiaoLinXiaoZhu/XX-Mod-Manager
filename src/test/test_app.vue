<template>
    <div class="main-container">
        <div class="head">
            <backbutton></backbutton>
            <sectionSelector :sections="sections" v-model:currentSection="currentSection"></sectionSelector>
        </div>

        <div class="section-container">
            <modCardSection></modCardSection>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, computed } from 'vue';
const { ipcRenderer } = require('electron');

import modCardSection from '../section/modCardSection.vue';
import backbutton from '../components/backButton.vue';
import sectionSelector from '../components/sectionSelector.vue';
import modCardManager from '../components/modCardManager.vue';


const sections = ref(['Mod', 'Character', 'Tag']);
const currentSection = ref('Mod');

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
    flex: 1;
    overflow: hidden;
    width: calc(100% - 20px);
    padding: 10px;
    bottom: 50px;
    top: 50px;
    overflow:visible;
}



</style>