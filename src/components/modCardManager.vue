<template>
    <div id="mod-card-manager" class="OO-box" :lastClickedMod="lastClickedMod">
        <mod-filter-container @changeFilter="handleFilterChange" :filterItems="characters" />
        <s-scroll-view> 
            <div id="mod-container">
            <mod-card v-for="mod in mods" :key="mod.name" 
                :mod="mod.name" 
                :character="mod.character"
                :description="mod.description"
                :hotKeys="mod.hotkeys"
                :imagePath="mod.preview"
                @click="click"
            />
            </div>
            <div class="placeholder"></div>
        </s-scroll-view>
    </div>
</template>

<script setup>
import 'sober';

import { ref, onMounted,computed } from 'vue';
import modCard from './modCard.vue';
const { ipcRenderer } = require('electron');
import modFilterContainer from '../components/modFilterContainer.vue';

// 定义 mods 变量
const mods = ref([]);
const characters = ref(['全部', '已选择']);
const currentCharacter = ref('全部');
// 定义 loadMods 方法
const loadMods = async () => {
    const currentConfig = await ipcRenderer.invoke('get-current-config');
    //debug
    console.log(currentConfig);
    const modSourcePath = currentConfig.modSourcePath;
    console.log(`modSourcePath: ${modSourcePath},type: ${typeof modSourcePath}`);
    const loadMods = await ipcRenderer.invoke('get-mods', modSourcePath);
    console.log(loadMods);
    mods.value = loadMods;

    // 加载 character
    loadMods.forEach((mod) => {
        if (!characters.value.includes(mod.character)) {
            characters.value.push(mod.character);
        }
    });
    //debug
    console.log(characters.value);
};


const emit = defineEmits(['click']);
// 定义 lastClickedMod 变量
const lastClickedMod = ref(null);

// 定义 click 方法
const click = (mod) => {
    lastClickedMod.value = mod;
    emit('click', lastClickedMod.value);
};

// 定义 handleFilterChange 方法
const handleFilterChange = (character) => {
    // console.log(character);
    // //debug
    // console.log(mods.value);
    // if (character === '全部') {
    //     mods.value = mods.value;
    // } else {
    //     mods.value = mods.value.filter((mod) => mod.character === character);
    // }
    currentCharacter.value = character;
    //debug
    console.log(currentCharacter.value);

    // 通过设置 card 的 display 属性来实现筛选
    if (character === '全部') {
        mods.value.forEach((mod) => {
            const modItem = document.getElementById(mod.name);
            modItem.style.display = 'block';
        });
    } else if (character === '已选择') {
        mods.value.forEach((mod) => {
            const modItem = document.getElementById(mod.name);
            if (modItem.checked) {
                modItem.style.display = 'block';
            } else {
                modItem.style.display = 'none';
            }
        });
    } else {
        mods.value.forEach((mod) => {
            const modItem = document.getElementById(mod.name);
            if (mod.character === character) {
                modItem.style.display = 'block';
            } else {
                modItem.style.display = 'none';
            }
        });
    }
    
};

// 在组件挂载时调用 loadMods 方法
onMounted(() => {
    loadMods();
});
</script>

<style scoped>
#mod-container {
    width: 100%;
    height: fit-content;
    display: grid;
    /* grid-column: span 4;
    grid-column-start: span 4; */
    grid-column-end: auto;
    grid-template-columns: repeat(auto-fill, 250px);
    grid-row-end: auto;
    grid-auto-rows: 350px;
    gap: 12px;
    /* align-items: center; */
    justify-content: start;
    justify-items: center;
    min-height: 500px;
}
#mod-card-manager {
    margin: 0 10px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: calc(100% - 20px);
    height: 100%;
    flex-wrap: nowrap;
}



.placeholder {
    height: 300px;
    width: 100%;
}
</style>