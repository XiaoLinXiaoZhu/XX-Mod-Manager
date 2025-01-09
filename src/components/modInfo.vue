<template>
    <div class="mod-info-card OO-box" ref="modInfoRef">
        <div class="mod-title">{{ modInfo ? modInfo.name : $t('modInfo.emptyTitle') }}</div>
        <div class="mod-character OO-color-gradient">
            <p> {{ modInfo ? modInfo.character : $t('modInfo.emptyCharacter') }}</p>
        </div>
        <div class="mod-image">
            <img style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;"
                alt="t('mod-image')" :src="img? img : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D'" />
        </div>

        <s-scroll-view class="mod-info-content">
            <h4> {{ $t('modInfo.hotkeys') }}</h4>
            <div id="hotkey-container" class="OO-colunm-center">
                <div v-for="hotkey in modInfo ? modInfo.hotkeys : []" class="hotkey OO-setting-bar OO-shade-box a-little-left" style="margin-bottom: 5px;">
                    <h3>{{ hotkey.description }}</h3>
                    <h3>{{ hotkey.key }}</h3>
                </div>
            </div>

            <h4> {{ $t('modInfo.description') }}</h4>

            <div class="OO-box OO-shade-box a-little-left" id="mod-info-description">

                <p id="mod-description" style="white-space: normal;">
                    {{ modInfo ? modInfo.description : $t('modInfo.emptyDescription') }}
                </p>
            </div>
            <div class="placeholder"></div>
        </s-scroll-view>

        <div class="buttons">
            <s-tooltip>
                <s-button slot="trigger" @click="editMod" class="edit-button OO-button">
                    <s-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path
                                d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z">
                            </path>
                        </svg>
                    </s-icon>
                </s-button>
                <p>{{ $t('modInfo.edit') }}</p>
            </s-tooltip>

            <s-tooltip>
                <s-button slot="trigger" @click="openModFolder" class="open-dir-button OO-button font-hongmeng">
                    <s-icon slot="start">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
  <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
</svg>
                    </s-icon>
                    <p>{{ $t('modInfo.openFolder') }}</p>
                </s-button>
                <p>{{ $t('modInfo.openFolder') }}</p>
            </s-tooltip>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, useTemplateRef, onMounted, ref, watch } from 'vue';
import IManager from '../../electron/IManager';
const iManager = new IManager();
import fsProxy from '../../electron/fsProxy';
const fs = new fsProxy();

const { ipcRenderer } = require('electron');

// 导入 i18n 的 t 函数
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps({
    mod: Object,
});

const modInfo = ref(null);
const img = ref(null);

const emit = defineEmits(['clickEditButton']);

const editMod = () => {
    if (props.mod == null) {
        ipcRenderer.send('snack', t('no-mod-selected'), 'error');
        return;
    }

    iManager.showDialog('edit-mod-dialog');
    //emit('clickEditButton');
};

const openModFolder = () => {
    //ipcRenderer.send('open-url', props.mod?.url);
    if (props.mod == null) {
        ipcRenderer.send('snack',t('no-mod-selected'), 'error');
        return;
    }
    fs.openDir(iManager.config.modSourcePath + '/' + props.mod.name);
    

};

const modInfoRef = useTemplateRef("modInfoRef");

const setDisplayMod = async (mod) => {
    if (mod == null) {
        return;
    }
    console.log(`set mod: ${mod.name}`);
    //modInfo.value = await iManager.getModInfo(mod);
    modInfo.value = mod;
    //debug
    console.log(`set mod info: ${modInfo.value}`);
    console.log(modInfo.value);
    console.log(modInfo.value.hotkeys);

    iManager.getImageBase64(modInfo.value.preview).then((imgBase64) => {
        img.value = "data:image/png;base64," + imgBase64;
    });
};

watch(() => props.mod, (newMod) => {
    setDisplayMod(newMod);
});

</script>

<style scoped>
h4 {
    text-align: left;
    font-size: 15px;
    font-weight: bolder;
    margin-bottom: -7px;
    margin-left: 17px;
    color: var(--s-color-on-surface-variant);
}

s-scroll-view {
    height: calc(100% - 240px);
    overflow-y: auto;
    overflow-x: hidden;
}


.mod-info-card {
    position: relative;
    width: 250px;
    margin-right: 10px;
    height: calc(100% - 20px);
    text-align: center;
}

.mod-title {
    font-size: 25px;
    font-weight: bold;
    padding: 10px 0;
    text-align: left;
    word-break: break-all;
    width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mod-character {
    font-size: 15px;
    font-weight: 500;
    margin-top: 10px;
    margin-bottom: 16px;
    text-align: left;

    position: relative;
    z-index: 1;
    width: fit-content;
    padding: 2px 10px;
    background-color: var(--s-color-primary);
    opacity: 0.8;
    backdrop-filter: blur(10px);
    color: var(--s-color-on-primary);
    border-radius: 30px;

}

.mod-image {
    width: calc(100% + 20px);
    height: auto;
    border-radius: 8px;
    background-size: cover;
    height: 200px;

    margin-top: -50px;
    margin-left: -10px;
}

.hotkey {
    height: 40px;
}

#mod-info-description {
    margin-top: 10px;
    margin-bottom: 10px;
    height: fit-content;
    padding: 5px;
    overflow-y: auto;
    overflow-x: hidden;
    color: var(--s-color-on-surface-variant);
    line-break: anywhere;

    p {
        padding: 10px;
        font-size: 15px;
        text-align: left;
        font-weight: 500;
    }
}

.mod-info-content {
    margin: -10px -10px 0px 0px;
    padding-right: 5px;
}

.buttons {
    position: absolute;
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    bottom: 0px;
    left: 8px;
    right: 8px;
    margin-bottom: 26px;
    background-color: #00000000;
    border-radius: 20px;
    height: 30px;
    /* backdrop-filter: blur(2px); */
}

.edit-button {
    border-radius: 25px;
    padding: 0;
    height: 50px;
    width: 50px;
    min-width: 0px;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.open-dir-button {
    height: 50px;
    border-radius: 24px;
    padding: 10px 20px;
}

.placeholder {
    height: 100px;
}

.a-little-left {
    margin-right: 5px;
}
</style>
