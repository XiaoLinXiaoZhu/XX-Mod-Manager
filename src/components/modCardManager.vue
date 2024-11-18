<template>
    <div>
        <mod-card v-for="mod in mods" :key="mod.name" :mod="mod" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import modCard from './modCard.vue';
const { ipcRenderer } = require('electron');

// 定义 mods 变量
const mods = ref([]);

// 定义 loadMods 方法
const loadMods = () => {
    const config = ipcRenderer.invoke('getConfig');
    const modResourcePath = config.modResourcePath;

    const files = ipcRenderer.invoke('getFiles', modResourcePath);
    if (files.state == 0){
        console.error('Error reading mod resource path:', files.error);
        return;
    }

    files.value.forEach(file => {
        mods.value.push({
            name: file,
    // fs.readdir(modResourcePath, (err, files) => {
    //     if (err) {
    //         console.error('Error reading mod resource path:', err);
    //         return;
    //     }
    //     mods.value = files.map(file => ({
    //         name: file,
    //         path: path.join(modResourcePath, file)
    //     }));
    // });
};

// 在组件挂载时调用 loadMods 方法
onMounted(() => {
    loadMods();
});
</script>

<style scoped>
/* Add your styles here */
</style>