<template>
    <div class="main-container">
        <leftMenu :tabs="presets" @tabChange="handleTabChange" >
            <template #up-button>
                <s-icon type="arrow_drop_up"></s-icon>
            </template>
            <template #down-button>
                <s-tooltip style="margin-right: calc(100% - 40px);">
                    <s-icon-button  slot="trigger">
                        <s-icon type="menu" ></s-icon>
                    </s-icon-button>
                    
                    <p> manage presets </p>
                </s-tooltip>

                <s-tooltip>
                    <s-icon-button slot="trigger">
                        <s-icon type="add" ></s-icon>
                    </s-icon-button>
                    <p> add preset </p>
                </s-tooltip>
            </template>
        </leftMenu>
        <modCardManager id="mod-card-manager" @click="handleModCardClick" :compactMode="compactMode" ref="modCardManagerRef">
        </modCardManager>
        <modInfo :mod="lastClickedMod" />
    </div>

    <div class="bottom">
        <div class="bottom-left">
            <s-tooltip>
                <s-switch v-model="compactMode" @change="handleCompactButtonClicked" slot="trigger" />
                <p> Compact Mode </p>
            </s-tooltip>
        </div>
        <div class="bottom-right">
            <!-- <s-button @click="handleAppButtonClicked" /> -->
             <s-button @click="handleClick" />
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
import modCard from '../components/modCard.vue'
import modCardManager from '../components/modCardManager.vue'
import chipButton from '../components/chipButton.vue';
import backButton from '../components/backButton.vue';
import sectionSelector from '../components/sectionSelector.vue';
import leftMenu from '../components/leftMenu.vue';
import modInfo from '../components/modInfo.vue';
import { ref, watch,onMounted,useTemplateRef } from 'vue';
const { ipcRenderer } = require('electron');

//-============================== 事件处理 ==============================
function handleClick() {
    //打开新的页面
    console.log('click');
    ipcRenderer.send('open-new-window', 'tapePage/');
}



const lastClickedMod = ref(null);
function handleModCardClick(mod) {
    console.log('mod card clicked', mod);
    lastClickedMod.value = mod;

    savePreset();
}

function handleAppButtonClicked() {
    console.log('app button clicked');
}


//-============================== Compact Mode ==============================
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

//-============================= presets ==============================
const modCardManagerRef = useTemplateRef('modCardManagerRef');
const presets = ref([]);
const currentPreset = ref('default');
function loadPresetList() {
    return ipcRenderer.invoke('get-preset-list').then((list) => {
        // list 的最前面 添加一个 default 的选项，它不会被保存，在每次加载时重置
        list.unshift('default');
        //debug
        console.log('load presets', list);
        presets.value = list;
    });
}

function loadPreset(preset) {
    return ipcRenderer.invoke('load-preset', preset).then((mods) => {
        modCardManagerRef.value.loadPreset(mods);
    });
}

function handleTabChange(tab) {
    currentPreset.value = tab;
    console.log('tab changed to', tab);
    if (tab == 'default') {
        modCardManagerRef.value.loadPreset([]);
    } else {
        loadPreset(tab);
    }
}

function savePreset() {
    if (currentPreset.value == 'default') return;
    const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.clicked).map(input => input.id);
    // ipcRenderer.invoke('save-preset', currentPreset.value, selectedMods).then(() => {
    //     console.log('preset saved');
    //     //loadPresets();
    // });
}





onMounted(() => {
    loadPresetList();
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
    width: 100%;
    bottom: 0px;
    /* background-color: var(--s-color-primary); */
    display: flex;
    justify-content: space-between;
    align-items: center;
}

</style>
