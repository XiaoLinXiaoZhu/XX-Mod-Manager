<template>
    <div class="left-menu OO-box">
        <div class="slider OO-color-gradient" :style="sliderStyle"></div>
        <div 
            v-for="(tab, index) in tabs" 
            :key="index" 
            :class="['tab', { active: currentTab === tab }]" 
            @click="selectTab(tab)"
        >
            <p> {{ tab }}</p>
            <s-ripple attached="true"></s-ripple>
        </div>
        
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
    tabs: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['tabChange']);

const currentTab = ref(props.tabs[0]);

const selectTab = (tab) => {
    currentTab.value = tab;
    emit('tabChange', tab);
};

const sliderStyle = computed(() => {
    const index = props.tabs.indexOf(currentTab.value);
    return {
        transform: `translateY(${index * 100}%)`
    };
});

watch(() => props.tabs, (newTabs) => {
    if (!newTabs.includes(currentTab.value)) {
        currentTab.value = newTabs[0];
    }
});
</script>

<style scoped>

.left-menu{
    display: flex;
    flex-direction: column;
    position: relative;
    width: 200px;
    height: calc(100% - 20px)
}

.tab {
    position: relative;
    padding: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    text-align: center;
    z-index: 10;
}

.tab p {
    width: 100%;
    text-align: center;
    font-weight: bolder;
    margin: 0;
    transition: color 0.3s;
}

.tab.active {
    color: var(--s-color-on-primary);
}

.slider {
    position: absolute;
    width: calc(100% - 20px);
    height: 40px;
    background-color: var(--s-color-primary);
    border-radius: 10px;
    transition: transform 0.3s;
}

s-ripple {
    /* --ripple-color: var(--s-color-primary); */
    border-radius: 10px;
}
</style>