<template>
    <button @click="handleClick">
        <div id="backButtonImage"></div>
        <div class="flash OO-color-gradient" :isFlashing="isFlashing"></div>
    </button>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue';
const emit = defineEmits(['backButtonClicked']);

const isFlashing = ref(false);
const flashingSpeed = 140;
const handleClick = () => {
    isFlashing.value = true;
    setTimeout(() => {
        isFlashing.value = false;
        setTimeout(() => {
            isFlashing.value = true;
            emit('backButtonClicked');
            setTimeout(() => {
                isFlashing.value = false;
            }, flashingSpeed);
        }, flashingSpeed);
    }, flashingSpeed);
};
</script>

<style scoped>
button {
    width: 100px;
    height: 100px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.5s;
    position: relative;
    overflow: hidden;
    background-color: #00000000;
    margin: -22px -10px;
}

.flash {
    position: absolute;
    top: -10px;
    left: -51px;
    width: 200px;
    height: 120px;
    background-color: var(--s-color-primary);
    clip-path: path(
        "m137.66676,9.16668l-108.16543,0a19.08802,19.08802 0 0 0 -16.53659,28.63203l36.73171,63.62672c5.09014,5.72641 17.81548,8.90774 30.54083,8.90774l57.42948,0a31.81336,31.81336 0 0 0 0,-101.16649z"
    );
    transform: scale(0.38, 0.43);

}

.flash[isFlashing="true"] {
    transition: opacity 0.2s ;
    z-index: 0;
}

.flash[isFlashing="false"] {
    z-index: 0;
    opacity: 0;
}

#backButtonImage {
    position: relative;
    width: 100%;
    height: 100%;
    background-image: url(./src/assets/backButton.png);
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 1;
}
</style>