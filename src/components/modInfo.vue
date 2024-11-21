<template>
    <div class="mod-info-card OO-box" ref="modInfoRef">

        <div class="mod-title">{{ modInfo ? modInfo.name : 'Click mod card to see detail' }}</div>
        <div class="mod-character OO-color-gradient">
            <p> {{ modInfo ? modInfo.character : 'no character' }} </p>
        </div>
        <div class="mod-image"></div>
        
        <s-scroll-view>
            <h4>Hotkeys</h4>
        <div id="hotkey-container" class="OO-colunm-center">
            <div
                v-for="hotkey in modInfo ? modInfo.hotkeys : []"
                class="hotkey OO-setting-bar OO-shade-box">
                <h3>{{ hotkey.description }}</h3>
                <h3>{{ hotkey.key }}</h3>
            </div>
        </div>

        <h4>Description</h4>

          <div class="OO-box OO-shade-box" id="mod-info-description">

              <p id="mod-description" style="white-space: normal;">
                {{ modInfo ? modInfo.description : 'no description' }}
                </p>
         </div>
         <div class="placeholder"></div>
        </s-scroll-view>

        <div class="buttons">
            <s-tooltip>
                <s-button slot="trigger" @click="editMod" class="edit-button OO-color-gradient">
                    <s-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                        <path
                            d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z">
                        </path>
                        </svg>
                    </s-icon>
                </s-button>
                <p>Edit</p>
            </s-tooltip>

            <s-tooltip>
                <s-button slot="trigger" @click="openModUrl" class="open-url-button OO-color-gradient">
                    <s-icon slot="start">
                <svg viewBox="0 0 960 960">
                  <path
                    d="M935.68 140.8a237.44 237.44 0 0 1 0 334.72l-204.16 204.16a237.44 237.44 0 0 1-334.72 0A64 64 0 0 1 486.4 588.8a108.8 108.8 0 0 0 153.6 0l204.8-203.52a108.8 108.8 0 0 0 0-153.6 107.52 107.52 0 0 0-153.6 0A64.256 64.256 0 0 1 600.32 140.8a238.08 238.08 0 0 1 335.36 0zM320 844.8a64 64 0 0 1 91.52 0 64 64 0 0 1 0 90.88 234.88 234.88 0 0 1-167.04 69.12A236.8 236.8 0 0 1 76.8 600.32L280.32 396.8a238.08 238.08 0 0 1 335.36 0A64.256 64.256 0 1 1 524.8 487.68a107.52 107.52 0 0 0-153.6 0L166.4 691.2a108.16 108.16 0 0 0 0 153.6 108.8 108.8 0 0 0 153.6 0z">
                  </path>
                </svg>
              </s-icon>
                    <p>Open URL</p>
                </s-button>
                <p>Open URL</p>
            </s-tooltip>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, useTemplateRef, onMounted,ref,watch} from 'vue';
const { ipcRenderer } = require('electron');

const props = defineProps({
    mod: String
});

const modInfo = ref(null);


const emit = defineEmits(['clickEditButton']);

const editMod = () => {
    emit('clickEditButton');
};

const openModUrl = () => {
    ipcRenderer.send('open-url', props.modUrl);
};

const modInfoRef = useTemplateRef("modInfoRef");

const setDisplayMod = async (mod) => {
    console.log(`set mod: ${mod}`);
    modInfo.value = await ipcRenderer.invoke('get-mod-info', mod);
    //debug
    console.log(`set mod info: ${modInfo.value}`);
    console.log(modInfo.value);
    console.log(modInfo.value.hotkeys);

    //获取图片 base64
    const img = await ipcRenderer.invoke('get-image', modInfo.value.preview);
    // modItemRef.value.querySelector('img').src = "data:image/png;base64," + image;
    modInfoRef.value.querySelector('.mod-image').style.backgroundImage = `url(data:image/png;base64,${img})`;
};

watch(() => props.mod, (newMod) => {
    setDisplayMod(newMod);
});

onMounted(() => {
    //debug
    console.log('modInfo mounted: ' + props.mod);
    if (modInfoRef.value != null && props.mod != null) {
        setDisplayMod(props.mod);
    }
});
</script>

<style scoped>

h4{
    text-align: left;
    font-size: 15px;
    font-weight: bolder;
    margin-bottom: -7px;
    margin-left: 17px;
    color: var(--s-color-on-surface-variant);
}

s-scroll-view{
    height: calc(100% - 195px);
    overflow-y: auto;
    overflow-x: hidden;
}


.mod-info-card {
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
    word-break:break-all;
    width:250px;
   white-space:nowrap;
   overflow:hidden;
   text-overflow:ellipsis;
}

.mod-character {
    font-size: 15px;
    font-weight: 500;
    margin-top: 10px;
    margin-bottom: 16px;
    text-align: left;

    position: relative;
    z-index: 10;
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
    overflow-y:auto;
    overflow-x:hidden;
    color:var(--s-color-on-surface-variant);

    p{
        padding: 10px;
        font-size: 15px;
        text-align: left;
        font-weight: 500;
    }
}

.buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    position: absolute;
    bottom: 0;
    width: calc(100% - 20px);   
    margin-bottom: 10px;
    background-color: black;
}

.edit-button {
    border-radius: 24px;
    height: 48px;
    width: 48px;
    min-width: 48px;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.open-url-button {
    height: 48px;
    border-radius: 24px;
    padding: 10px 20px;
}

.placeholder {
    height: 100px;
}
</style>
