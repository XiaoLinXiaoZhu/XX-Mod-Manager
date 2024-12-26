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
        <modInfo :mod="lastClickedMod"></modInfo>
    </div>

    <div class="bottom">
        <div class="bottom-left">
            <s-tooltip>
                <s-switch class="OO-color-gradient-word" v-model="compactMode" @change="handleCompactButtonClicked" slot="trigger" />
                <p> {{ $t('buttons.compactMode') }} </p>
            </s-tooltip>
        </div>
        <div class="bottom-right">
            <!-- <s-button @click="handleApplyButtonClicked" /> -->
            <s-button @click="handleApplyButtonClicked" id="apply-button" class="OO-color-gradient font-hongmeng OO-button">
                {{ $t('buttons.apply') }}
            </s-button>
            <!-- <s-button @click="handleClick" id="apply-button" class="OO-color-gradient font-hongmeng">
                Open Tape Page
            </s-button> -->
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
import { ref, watch, onMounted, useTemplateRef } from 'vue';
import IManager from '../../electron/IManager';
import fsProxy from '../../electron/fsProxy';
const iManager = new IManager();
const fs = new fsProxy();

//-============================== 事件处理 ==============================
const lastClickedMod = ref(null);

function handlePresetManageButtonClicked() {
    console.log('preset manage button clicked');
    fs.openDir(iManager.config.presetPath);
    iManager.showDialog('dialog-need-refresh');
}

function handlePresetAddButtonClicked() {
    console.log('preset add button clicked');
    // const addPresetDialog = document.getElementById('add-preset-dialog');
    // addPresetDialog.show();
    iManager.showDialog('add-preset-dialog');
}

//-============================== Compact Mode ==============================
//#region Compact Mode
const compactMode = ref(false);
const enterCompactMode = (item) => {
    item.animate([
        { height: '350px' },
        { height: '150px' }
    ], {
        duration: 300,
        easing: 'ease-in-out',
        iterations: 1
    });

    //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓上移
    //获取这些元素
    //遍历子元素，匹配slot属性
    item.childNodes.forEach(child => {
        if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
            child.animate([
                { transform: 'translateY(200px)' },
                { transform: 'translateY(0px)' }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                iterations: 1
            });
        }
        if (child.slot == 'image') {
            //获取slot下的img元素
            const img = child.querySelector('img');
            img.animate([
                { opacity: 1, filter: 'blur(0px)' },
                { opacity: 0.2, filter: 'blur(5px)' }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                iterations: 1
            });
        }
    });
};
const exitCompactMod = (item) => {
    item.animate([
        { height: '150px' },
        { height: '350px' }
    ], {
        duration: 300,
        easing: 'ease-in-out',
        iterations: 1
    });

    //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓下移
    //获取这些元素
    //遍历子元素，匹配slot属性
    item.childNodes.forEach(child => {
        if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
            child.animate([
                { transform: 'translateY(-200px)' },
                { transform: 'translateY(0px)' }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                iterations: 1
            });
        }
        if (child.slot == 'image') {
            //获取slot下的img元素
            const img = child.querySelector('img');
            img.animate([
                { opacity: 0.2, filter: 'blur(5px)' },
                { opacity: 1, filter: 'blur(0px)' }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                iterations: 1
            });
        }
    });
}
function handleCompactButtonClicked() {
    console.log('compact button clicked');
    compactMode.value = !compactMode.value;
    //切换compactMode

    let modItems = Array.from(document.querySelectorAll('.mod-item')).map(item => {
        return {
            item: item,
            animated: false
        };
    });

    console.log(modItems);

    const compact = (Items) => {
        Items.forEach(item => {
            if (!item.item.inWindow) {
                return;
            }
            if (!item.animated) {
                if (compactMode.value) {
                    enterCompactMode(item.item);
                }
                else {
                    exitCompactMod(item.item);
                }
                item.animated = true;
            }
        });
    };

    compact(modItems);
    // 在之后的0.4s内，每0.1s 重新调用compact函数
    const maxTime = 200;
    const dertaTime = 10;
    let currentTime = 0;
    for (let i = 0; i < maxTime; i += dertaTime) {
        setTimeout(() => {
            compact(modItems);
        }, i);
    }

}
//#endregion

//-============================= presets ==============================
//#region presets
const presets = ref([]);
const currentPreset = ref('default');

function loadPresetList() {
    //console.log('-===== loadPresetList ======');
    let list = [...iManager.data.presetList];
    //debug
    console.log('loadPresetList', iManager.data.presetList);
    list.unshift('default');
    //debug
    presets.value = list;
}

iManager.on('addPreset', (preset) => {
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

onMounted(() => {
    iManager.waitInit().then(() => {
        loadPresetList();
        iManager.on("lastClickedModChanged", (mod) => {
            lastClickedMod.value = null;
            setTimeout(() => {
                lastClickedMod.value = mod;
            }, 1);
            //debug
            console.log('set mod info display to', mod.name);
            savePreset();
        });

        iManager.on('currentPresetChanged', (preset) => {
            presetSelectorRef.value.selectTab(preset);
        });
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
