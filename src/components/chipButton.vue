<template>
    <s-chip @click="handleClick" clickable="true" :type="type" :id="props.id" :checked="checked">
        <p>{{ props.text }}</p>
    </s-chip>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue';

const emit = defineEmits(['chip-clicked']);

const props = defineProps({
    text: String,
    id: String,
    checked: Boolean
});

const type = computed(() => {
    // 如果 class 有 active，则 type 为 outlined，否则为 filled-tonal
    
    //return !props.checked ? 'outlined' : 'filled-tonal';
});

const handleClick = () => {
    emit('chip-clicked');
};
</script>

<style scoped>
s-chip {
    height: 35px;
    transform: skew(-20deg);
    z-index: 1;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    padding: 0px 16px;
    box-sizing: border-box;
    white-space: nowrap;
    font-size: 0.875rem;
    position: relative;
    overflow: hidden;
}

s-chip p {
    display: block;
    transform: skew(20deg);
    width: fit-content;
    height: fit-content;
    white-space: nowrap;
    line-height: 1;
    margin: 10px 0px;
    font-weight: bold;
    transition: all 0.3s ease-in-out 0s;
}

s-chip[type=filled-tonal] {
    border: 1px solid var(--s-color-outline);
    color: var(--s-color-on-primary);
}

s-chip[checked="true"] {
    color: var(--s-color-on-primary);
}
</style>