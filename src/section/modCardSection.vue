<template>
    <div class="main-container">
        <leftMenu :tabs="presets" @tabChange="handlePresetChange" ref="presetSelectorRef">
            <template #up-button>
                <s-icon type="arrow_drop_up"></s-icon>
            </template>
            <template #down-button>
                <s-tooltip style="margin-right: calc(100% - 40px);">
                    <s-icon-button slot="trigger" @click="handlePresetManageButtonClicked">
                        <s-icon type="menu"></s-icon>
                    </s-icon-button>

                    <p> {{ $t('buttons.managePreset') }} </p>
                </s-tooltip>

                <s-tooltip>
                    <s-icon-button slot="trigger" @click="handlePresetAddButtonClicked">
                        <s-icon type="add"></s-icon>
                    </s-icon-button>
                    <p> {{ $t('buttons.addPreset') }} </p>
                </s-tooltip>
            </template>
        </leftMenu>
        <modCardManager id="mod-card-manager" :compactMode="compactMode" ref="modCardManagerRef">
        </modCardManager>
        <modInfo :mod="displayModRef"></modInfo>
    </div>

    <div class="bottom">
        <div class="bottom-left">
            <s-tooltip>
                <!-- -刷新按钮 -->
                <s-icon-button @click="handleRefreshButtonClicked" slot="trigger" class="OO-button"
                    style="color: var(--s-color-on-surface);margin: 0 10px 0 0;transform: scale(0.95);">
                    <s-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path
                                d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z">
                            </path>
                        </svg></s-icon>
                </s-icon-button>
                <p> {{ $t('buttons.refresh') }} </p>
            </s-tooltip>
            <s-tooltip>
                <s-switch class="OO-color-gradient-word" v-model="compactMode" @change="handleCompactButtonClicked"
                    slot="trigger" />
                <p> {{ $t('buttons.compactMode') }} </p>
            </s-tooltip>
        </div>
        <div class="bottom-right">
            <!-- <s-button @click="handleApplyButtonClicked" /> -->
            <s-button @click="handleApplyButtonClicked" id="apply-button"
                class="OO-color-gradient font-hongmeng OO-button" style="color: var(--s-color-surface);">
                {{ $t('buttons.apply') }}
            </s-button>
        </div>
    </div>


    <svg width="0" height="0">
        <defs>
            <clipPath id="svgCircle">
                <circle cx="100" cy="100" r="100" />
            </clipPath>
        </defs>
    </svg>
</template>

<script setup>
import modCardManager from '../components/modCardManager.vue'
import leftMenu from '../components/leftMenu.vue';
import modInfo from '../components/modInfo.vue';
import { ref, onMounted, useTemplateRef,watch, computed } from 'vue';
import IManager from '../../electron/IManager';
import { g_temp_vue } from '../../electron/IManager';
import fsProxy from '../../electron/fsProxy';
const iManager = new IManager();
const fsproxy = new fsProxy();
import { EventType, EventSystem } from '../../helper/EventSystem';

const displayModRef = g_temp_vue.currentMod;

//-============================== 事件处理 ==============================

function handlePresetManageButtonClicked() {
    console.log('preset manage button clicked');
    fsproxy.openDir(iManager.config.presetPath);
    iManager.showDialog('dialog-need-refresh');
}

function handlePresetAddButtonClicked() {
    console.log('preset add button clicked');
    // const addPresetDialog = document.getElementById('add-preset-dialog');
    // addPresetDialog.show();
    iManager.showDialog('add-preset-dialog');
}

function handleRefreshButtonClicked() {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('refresh-main-window');
}

//-============================== Compact Mode ==============================
//#region Compact Mode
const compactMode = ref(false);

function handleCompactButtonClicked() {
    console.log('compact button clicked');
    compactMode.value = !compactMode.value;
    //切换compactMode
    return;
}
//#endregion

//-============================= presets ==============================
//#region presets
const presets = ref([]);
const currentPreset = ref('default');

function loadPresetList() {
    let list = iManager.data.presetList;
    //debug
    console.log('loadPresetList', iManager.data.presetList);
    list.unshift('default');
    //debug
    presets.value = list;
}

EventSystem.on('addPreset', (preset) => {
    //debug
    console.log('addPreset', preset);
    loadPresetList();
});

function handlePresetChange(tab) {
    currentPreset.value = tab;
    console.log('tab changed to', tab);

    iManager.setCurrentPreset(tab);
}

const selectedMods = () => Array.from(document.querySelectorAll('.mod-item')).filter(item => item.getAttribute('clicked') == 'true').map(item => item.id);

function savePreset() {
    if (currentPreset.value == 'default') return;
    //debug
    console.log('save preset', currentPreset.value, selectedMods());
    iManager.savePreset(currentPreset.value, selectedMods());
}

const presetSelectorRef = useTemplateRef('presetSelectorRef');

//#endregion

//-=========================== apply button ===========================
function handleApplyButtonClicked() {
    // debug
    const mods = Array.from(document.querySelectorAll('.mod-item'));
    iManager.applyMods(selectedMods()).then(() => {
        console.log('apply success');

    });
}

// EventSystem.on(EventType.initDone, (iManager) => {

//     loadPresetList();
// });

EventSystem.on('toggledMod', (mod) => {
    //debug
    console.log('toggled mod', mod.name);
    savePreset();
});

EventSystem.on('currentPresetChanged', (preset) => {
    // debug
    console.log('111111111111111111current preset changed to', preset,presets.value);
    presetSelectorRef.value.selectTabByName(preset);
});

onMounted(() => {
    iManager.waitInit().then(() => {
        loadPresetList();
    });
});
</script>


<style scoped>
#mod-card-manager {
    height: calc(100% - 20px);
}

#test {
    background-color: red;
    cursor: pointer;
    margin: 10px;
    /* border-radius: 0 80px 20px 0px;
    transform: skew(-20deg); */
}

.main-container {
    position: relative;
    display: flex;
    height: calc(100% - 60px);
    width: 100%;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
}

.bottom {
    position: absolute;
    height: 60px;
    width: 100vw;
    bottom: -10px;
    /* background-color: var(--s-color-primary); */
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#apply-button {
    padding: 0 60px;
    margin: 0 40px;
    font-size: 20px;

    color: var(--s-color-dark-surface);
}
</style>
