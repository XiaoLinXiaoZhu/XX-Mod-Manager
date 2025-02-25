<template>
        <div class="head">
            <backbutton @click="handleBackButtomClick" />
            <div id="drag-bar" style="flex: 1;height: 100%;"></div>
        </div>

    <div class="main-container">

        
        <div id="head-frame">
            <backButton id="close-btn"></backButton>
            <!-- <InfoBox :title="currentTape.name" :description="currentTape.description" /> -->
        </div>

        <div id="tape-selector" class="OO-color-gradient-svg OO-capering" capering-k="20">
            <svg height="100%" width="100%" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"
                xml:space="preserve" version="1.1" fill="#000000">
                <g fill="white">
                    <path
                        d="m388.07016,240.917l-157.66878,-234.666c-2.68014,-4.011 -6.32108,-6.251 -10.13401,-6.251l-71.66708,0c-5.79096,0 -11.03702,5.184 -13.24416,13.163c-2.22192,7.979 -0.98901,17.152 3.11015,23.253l147.53477,219.584l-147.53477,219.584c-4.09916,6.101 -5.33206,15.275 -3.11015,23.253c2.20714,7.979 7.4532,13.163 13.24416,13.163l71.66775,0c3.81294,0 7.4532,-2.24 10.13401,-6.251l157.66878,-234.667c5.6035,-8.341 5.6035,-21.823 -0.00067,-30.165z">
                    </path>
                </g>
            </svg>

        </div>

        <div class="button button-svg" id="next-btn" style="right: 10px;">
        </div>
        <div class="button button-svg" id="prev-btn" style="left: 10px;transform: rotate(180deg);">
        </div>

        <div id="scene-container">
            <div id="scene-mask">
            </div>
        </div>
        

        <div id="bottom-frame">
        </div>
    </div>
    <CssProxy />
</template>


<script setup lang="ts">
import { ref } from 'vue';

import backButton from '../../src/components/backButton.vue';
import sectionSelector from '../../src/components/sectionSelector.vue';
import infoBox from './components/infoBox.vue';

import CssProxy from '../../src/components/cssProxy.vue';


function handleBackButtomClick() {
    console.log('back button clicked');
}

function handleSectionChange(newSection) {
    console.log('Section changed to:', newSection);
}

</script>



<style>
.control-bar {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 30px;
    background-color: var(--s-color-background);
    -webkit-app-region: drag;
}
</style>