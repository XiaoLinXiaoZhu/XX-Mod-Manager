<template>
    <div class="mod-card OO-box">
        <h2>{{ modName }}</h2>
        <img :src="modImage" alt="Mod Image" class="mod-image" />
        <p>{{ modRole }}</p>
        <p>{{ modDescription }}</p>
        <div class="buttons">
            <button @click="editMod" class="edit-button">Edit</button>
            <button @click="openModUrl" class="open-url-button">Open URL</button>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
const { ipcRenderer } = require('electron');

const props = defineProps({
    modName: String,
    modImage: String,
    modRole: String,
    modDescription: String,
    modUrl: String
});

const emit = defineEmits(['clickEditButton']);

const editMod = () => {
    emit('clickEditButton');
};

const openModUrl = () => {
    ipcRenderer.send('open-url', props.modUrl);
};
</script>

<style scoped>
.mod-card {
    width: 300px;
    margin-right: 10px;
    height: calc(100% - 20px);
    text-align: center;
}

.mod-image {
    width: 100%;
    height: auto;
    border-radius: 8px;
}

.buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
}

.edit-button {
    border-radius: 50%;
    padding: 10px;
}

.open-url-button {
    border-radius: 20px;
    padding: 10px 20px;
}
</style>
