<script setup>
import modCard from '../components/modCard.vue'
import modCardManager from '../components/modCardManager.vue'
import chipButton from '../components/chipButton.vue';
import modFilterContainer from '../components/modFilterContainer.vue';
</script>

<template>
    <modFilterContainer />
    <chipButton text="Test" id="test"></chipButton>
    <chipButton text="中文" id="test"></chipButton>
    <modCardManager />
</template>

<style scoped>
</style>
