<!-- 这是一个水平滚动条，支持使用滚轮左右滚动以及使用鼠标拖动滚动 -->
<template>
    <div class="horizontal-scroll-bar" ref="scrollBar">
        <slot></slot>
    </div>
</template>

<script setup>
import { ref, onMounted,useTemplateRef } from 'vue';

const scrollBar = useTemplateRef('scrollBar');  

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
        const walk = (x - startX) ;
        scrollBarEl.scrollLeft = scrollLeft - walk;
    });

    scrollBarEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollBarEl.scrollLeft += e.deltaY;
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

</style>