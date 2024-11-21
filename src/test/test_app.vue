<template>
    <div class="head">
        <backbutton></backbutton>
    </div>

    <div class="section-container">

    </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, computed } from 'vue';
const { ipcRenderer } = require('electron');

import modCardSection from '../section/modCardSection.vue';
import backbutton from '../components/backButton.vue';


</script>