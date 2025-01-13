<template>
    <div :class="['horizontal-scroll-bar', { 'show-scrollbar': showScrollbar }]" ref="scrollBar">
        <slot></slot>
    </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
    showScrollbar: {
        type: Boolean,
        default: false
    },
    scrollSpeed: {
        type: Number,
        default: 1
    },
    dragSpeed: {
        type: Number,
        default: 1
    }
});

const scrollBar = ref(null);

onMounted(() => {
    const scrollBarEl = scrollBar.value;

    let isDown = false;
    let startX;
    let scrollLeft;

    scrollBarEl.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - scrollBarEl.offsetLeft;
        scrollLeft = scrollBarEl.scrollLeft;
    });

    scrollBarEl.addEventListener('mouseleave', () => {
        isDown = false;
    });

    scrollBarEl.addEventListener('mouseup', () => {
        isDown = false;
    });

    scrollBarEl.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scrollBarEl.offsetLeft;
        const walk = (x - startX) * props.dragSpeed;
        scrollBarEl.scrollLeft = scrollLeft - walk;
    });

    scrollBarEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollBarEl.scrollLeft += e.deltaY * props.scrollSpeed;
    });
});
</script>

<style scoped>
.horizontal-scroll-bar {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    cursor: grab;
    user-select: none;
}

.horizontal-scroll-bar::-webkit-scrollbar {
    display: none;
}

.horizontal-scroll-bar.show-scrollbar::-webkit-scrollbar {
    display: block;
}
</style>