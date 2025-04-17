<template>
    <div class="main-container">

        <leftMenu :tabs="presets" :translatedTabs="translatedPresets" @tabChange="handlePresetChange"
            ref="presetSelectorRef">
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
            <s-popup align="top">
                <s-tooltip slot="trigger" style="position: relative;left: 15px;">
                    <s-icon-button icon="image" class="OO-button"
                        style="border: 5px solid var(--s-color-surface-container-high);transform: scale(1);"
                        slot="trigger">
                        <s-icon type="chevron_down"></s-icon>
                    </s-icon-button>

                    <p style="line-height: 1.2;">
                        {{ $t('editDialog.batch-operation') }} </p>
                </s-tooltip>
                <div style="width: 600px;height: max-content;">
                    <div class="OO-setting-bar" style="width: 600px;">
                    <h3>{{ $t('editDialog.batch-set-character') }}</h3>
                    <div class="OO-s-text-field-container" >
                        <s-text-field v-model="targetCharacter">
                        </s-text-field>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            @click="handleBatchSetCharacterButtonClicked">
                            <s-icon type="add"></s-icon>
                        </s-icon-button>
                    </div>
                </div>
            </div>
                
            </s-popup>
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
import modCardManager from '../components/modCardManager.vue';
import modCardManager2 from '../components/modCardManager2.vue';
import leftMenu from '../components/leftMenu.vue';
import modInfo from '../components/modInfo.vue';
import { ref, onMounted, useTemplateRef, watch, computed } from 'vue';
import IManager from '../../electron/IManager';
import { g_temp_vue, g_config_vue, g_data_vue } from '../../electron/IManager';
import fsProxy from '../../electron/fsProxy';
const iManager = new IManager();
import settingBar from '../components/settingBar.vue';
import { EventType, EventSystem } from '../../helper/EventSystem';
import { SnackType, t_snack } from '../../helper/SnackHelper';

const displayModRef = g_temp_vue.currentMod;

//-============================== 事件处理 ==============================

function handlePresetManageButtonClicked() {
    console.log('preset manage button clicked');
    fsProxy.openDir(iManager.config.presetPath);
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

const targetCharacter = ref('');
function handleBatchSetCharacterButtonClicked(){
    console.log('batch set character button clicked', targetCharacter.value);
    const ModIds = selectedModIds();

    if (!targetCharacter.value) {
        t_snack({
            zh_cn: '请输入角色名',
            en: 'Please enter the character name',
        },SnackType.error);
        console.error('targetCharacter is empty');
        return;
    }
    if (ModIds.length == 0) {
        t_snack({
            zh_cn: '请至少选择一个mod',
            en: 'Please select at least one mod',
        },SnackType.error);
        console.error('selectedModIds is empty');
        return;
    }
    ModIds.forEach(async modId => {
        const ModData = await iManager.getModInfoById(modId);
        //debug
        console.log('ModData', ModData, targetCharacter.value);
        console.log('TargetCharacter', targetCharacter.value);
        if (ModData && targetCharacter.value) {
            ModData.character = targetCharacter.value;
            ModData.saveModInfo();
            ModData.triggerChanged();
        }
    });
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
// const presets = ref([]);
const language = g_config_vue.language;
const presets = computed(() => {
    return ['default', ...g_data_vue.presetList.value];
});
const translatedPresets = computed(() => {
    // 根据语言翻译 default
    //debug
    console.log('presets changed', language.value);
    if (language.value === 'zh_cn') {
        return ['默认预设', ...g_data_vue.presetList.value];
    } else {
        return ['default', ...g_data_vue.presetList.value];
    }
});

// 这里只做显示切换，真正的功能通过 eventsystem.on('currentPresetChanged') 来实现
const currentPreset = g_temp_vue.currentPreset;
watch(currentPreset, (newVal, oldVal) => {
    presetSelectorRef.value.selectTabByName(newVal);
});

function handlePresetChange(tab) {
    iManager.setCurrentPreset(tab);
}

const selectedModIds = () => Array.from(document.querySelectorAll('.mod-item')).filter(item => item.getAttribute('clicked') == 'true').map(item => item.id);
const selectedModNames = () => Array.from(document.querySelectorAll('.mod-item')).filter(item => item.getAttribute('clicked') == 'true').map(item => item.name);


function savePreset() {
    if (currentPreset.value == 'default') return;
    //debug
    console.log('save preset', currentPreset.value, selectedModIds());
    iManager.savePresetByModIds(currentPreset.value, selectedModIds());
}

const presetSelectorRef = useTemplateRef('presetSelectorRef');

//#endregion

//-=========================== apply button ===========================
function handleApplyButtonClicked() {
    // debug
    const mods = Array.from(document.querySelectorAll('.mod-item'));

    iManager.applyMods(selectedModIds()).then(() => {
        console.log('apply success', selectedModIds());
    });
}

EventSystem.on('toggledMod', (mod) => {
    //debug
    console.log('toggled mod', mod.name);
    savePreset();
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

.bottom-right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

#apply-button {
    padding: 0 60px;
    margin: 0 40px;
    font-size: 20px;

    color: var(--s-color-dark-surface);
}
</style>
