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
        default: 1
    },
    dragSpeed: {
        default: 1
    }
});

const scrollBar = ref(null);

onMounted(() => {
    const scrollBarEl = scrollBar.value;

    let isDown = false;
    let startX;
    let scrollLeft;

    let scrollSpeed = 1;
    let dragSpeed = 1;
    // scrollSpeed 和 dragSpeed 因为 html 有可能会被转化为字符串，所以这里检测类型并转换
    if (typeof props.scrollSpeed === 'string') {
        scrollSpeed = parseFloat(props.scrollSpeed);
    }
    if (typeof props.dragSpeed === 'string') {
        dragSpeed = parseFloat(props.dragSpeed);
    }

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
        const walk = (x - startX) * dragSpeed;
        scrollBarEl.scrollLeft = scrollLeft - walk;
    });

    scrollBarEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollBarEl.scrollLeft += e.deltaY * scrollSpeed;
    }, { passive: false });
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
    padding: 0 10px;
}

.horizontal-scroll-bar::-webkit-scrollbar {
    display: none;
}

.horizontal-scroll-bar.show-scrollbar::-webkit-scrollbar {
    display: block;
}
</style>