<template>
    <div id="mod-card-manager" class="OO-box">
        <mod-filter-container />
        <s-scroll-view id="mod-container"> 
            <mod-card v-for="mod in mods" :key="mod.name" 
                :mod="mod.name" 
                :character="mod.character"
                :description="mod.description"
                :hotKeys="mod.hotKeys"
                :imagePath="mod.preview"
            />
            <div class="placeholder"></div>
        </s-scroll-view>
    </div>
</template>

<script setup>
import 'sober';

import { ref, onMounted } from 'vue';
import modCard from './modCard.vue';
const { ipcRenderer } = require('electron');
import modFilterContainer from '../components/modFilterContainer.vue';


// 定义 mods 变量
const mods = ref([]);

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
};

// 在组件挂载时调用 loadMods 方法
onMounted(() => {
    loadMods();
});
</script>

<style scoped>
#mod-container {
    width: 100%;
    height: 100%;
    display: grid;
    grid-column: span 4;
    grid-column-start: span 4;
    grid-column-end: auto;
    grid-template-columns: repeat(auto-fill, 250px);
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
    height: 200px;
    width: 100%;
}
</style>