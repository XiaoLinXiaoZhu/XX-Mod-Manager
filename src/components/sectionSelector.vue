<template>
    <div class="slider-container ">
        <div class="slider OO-color-gradient OO-pumping" :style="sliderStyle"></div>
        <div class="section-selector">
            <div 
                v-for="(sec, index) in sections" 
                :key="index" 
                class="section-item" 
                :class="{ active: sec === currentSection }" 
                @click="selectSection(sec)"
            >
                <p> {{ $t('element.section.' + sec) }} </p>
            </div>
    
        </div>
        
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    sections: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['update:currentSection']);
const currentSection = ref(props.sections[0]);

const selectSection = (sec) => {
    //debug
    console.log('selectSection', sec);
    currentSection.value = sec;
    emit('update:currentSection', sec);
};

const sliderStyle = computed(() => {
    const index = props.sections.indexOf(currentSection.value);
    return {
        width: `${100 / props.sections.length}%`,
        transform: `translateX(${index * 95 - 22}%) skew(-20deg)`
    };
});

watch(() => props.sections, (newSection) => {
    if (!newSection.includes(currentSection.value)) {
        currentSection.value = newSection[0];
    }
});
</script>

<style scoped>
.section-selector {
    display: flex;
    align-items:center;
    position: relative;
    background-color: var(--s-color-on-primary);
    border: 5px solid var(--s-color-outline-variant);
    border-radius: 20px;
    box-shadow: 0 0 0px 3px var(--s-color-surface-container-high),inset 1px 1px 1px rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
    overflow: hidden;
    height: 40px;
}

.section-item {
    flex: 1;
    padding: 10px 40px;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.3s;
    pointer-events: auto;
    z-index: 4;
}

.section-item>p{
    transition: color 0.3s;
    font-weight: 900;
}

.section-item.active {
    color: rgb(0, 0, 0);
}

.slider-container{
    position: relative;
    width: fit-content;
    height: 20px;
    display: flex;
    align-items: center;
    pointer-events:none;
    padding: 13px 10px;
    border-radius: 28px;
    overflow: visible;
    background-color: #007bff00;
    overflow: hidden;
    z-index: 1;
}



.slider {
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: var(--s-color-primary);
    transition: transform 0.3s;
    pointer-events:none;
    padding: 0 10px;
    border-radius: 12px;
    box-sizing: content-box;
    transform: skew(-20deg) translateX(-50%);
    z-index: 3;
}
</style>