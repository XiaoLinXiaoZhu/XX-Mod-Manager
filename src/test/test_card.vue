<script setup>
import modCard from '../components/modCard.vue'
import modCardManager from '../components/modCardManager.vue'
import chipButton from '../components/chipButton.vue';
import backButton from '../components/backButton.vue';
import sectionSelector from '../components/sectionSelector.vue';
const { ipcRenderer } = require('electron');

function handleClick() {
    //打开新的页面
    console.log('click');
    ipcRenderer.send('open-new-window', 'tapePage/');
}

function handleBackButtonClicked() {
    console.log('back button clicked');
}
</script>

<template>

    <!-- <div id="mod-card-manager">
        <modCardManager />
    </div> -->
    <sectionSelector :section="['section1', 'section2', 'section3']" v-model:currentSection="currentSection" />
    <button @click="handleClick">Click me</button>

    <backButton @backButtonClicked="handleBackButtonClicked" />

    <svg width="0" height="0">
    <defs>
        <clipPath id="svgCircle">
        <circle cx="100" cy="100" r="100" />
        </clipPath>
    </defs>
    </svg>
</template>

<style scoped>
#mod-card-manager[data-v-05fe059d] {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    flex-wrap: nowrap;
}

.svg-circle {
    clip-path: path(
    "m137.66676,9.16668l-108.16543,0a19.08802,19.08802 0 0 0 -16.53659,28.63203l36.73171,63.62672c5.09014,5.72641 17.81548,8.90774 30.54083,8.90774l57.42948,0a31.81336,31.81336 0 0 0 0,-101.16649z"
  );
    width: 512px;
    height: 512px;
    z-index: 10;
}

#test {
    background-color: red;
    cursor: pointer;
    margin: 10px;
    /* border-radius: 0 80px 20px 0px;
    transform: skew(-20deg); */
}
</style>
