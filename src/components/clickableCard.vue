<template>
    <div class="clickable-card" @click="_handleClick" ref="cardRef" :class="{ clicked: clicked }">
        <slot>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { defineProps, ref, useTemplateRef } from 'vue';

const props = defineProps({
    useDefaultClickEvent: {
        type: Boolean,
        default: true
    }
})

const cardRef = useTemplateRef("cardRef");
const clicked = ref(false);

const _handleClick = (event: MouseEvent) => {
    if (props.useDefaultClickEvent) {
        handleClick(event);
    }
}

const handleClick = (event: MouseEvent, ifToggle: boolean = true) => {
    const cardElement = cardRef.value as HTMLElement;

    if (ifToggle) {
        clicked.value = !clicked.value;
    }
    else {
        playFlipAnim(cardElement, event, cardElement.getBoundingClientRect());
        return;
    }

    console.log('clicked:', clicked.value, cardElement.getBoundingClientRect());

    if (clicked.value) {
        playSelectedAnim(cardElement, event, cardElement.getBoundingClientRect());
    } else {
        playUnselectedAnim(cardElement, event, cardElement.getBoundingClientRect());
    }
}


function playFlipAnim(cardElement: HTMLElement, event: MouseEvent | null = null, rect: DOMRect | null = null) {
    // 当前卡片被选中时的动画
    // 获取鼠标相对于卡片的位置（百分比）
    let x, y, rotateX, rotateY;
    let rotateLevel = -20;

    if (event != null && rect != null) {
        // 如果传入了event，则使用event的位置
        // 获取鼠标相对于卡片的位置（百分比）
        x = (event.clientX - rect.left) / rect.width;
        y = (event.clientY - rect.top) / rect.height;
    }
    else {
        // 如果没有传入event，且modItem.clicked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
        x = !clicked.value ? 0 : Math.random() / 5 + 0.7;
        y = !clicked.value ? 0.7 : Math.random() / 5;
    }
    // 根据鼠标相对于卡片的位置设置反转程度
    rotateX = 2 * (y - 0.5);
    rotateY = -2 * (x - 0.5);

    // 添加动画
    cardElement.animate([
        { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` },
        { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1.05)` },
        { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1)` },
        { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` }
    ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        iterations: 1
    });
}

function playSelectedAnim(cardElement: HTMLElement, event: MouseEvent | null = null, rect: DOMRect | null = null) {
    // 当前卡片被选中时的动画
    // 获取鼠标相对于卡片的位置（百分比）
    let x, y, rotateX, rotateY;
    let rotateLevel = -20;

    if (event != null && rect != null) {
        // 如果传入了event，则使用event的位置
        // 获取鼠标相对于卡片的位置（百分比）
        x = (event.clientX - rect.left) / rect.width;
        y = (event.clientY - rect.top) / rect.height;
    }
    else {
        // 如果没有传入event，且modItem.clicked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
        x = !clicked.value ? 0 : Math.random() / 5 + 0.7;
        y = !clicked.value ? 0.7 : Math.random() / 5;
    }
    // 根据鼠标相对于卡片的位置设置反转程度
    rotateX = 2 * (y - 0.5);
    rotateY = -2 * (x - 0.5);

    // 添加动画
    cardElement.animate([
        { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` },
        { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1.05)` },
        //缩小一点
        { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1)` },
        { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` }
    ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        iterations: 1
    });
}

function playUnselectedAnim(cardElement: HTMLElement, event: MouseEvent | null = null, rect: DOMRect | null = null) {
    // 获取鼠标相对于卡片的位置（百分比）
    let x, y, rotateX, rotateY;
    let rotateLevel = -20;

    if (event != null && rect != null) {
        // 如果传入了event，则使用event的位置
        // 获取鼠标相对于卡片的位置（百分比）
        x = (event.clientX - rect.left) / rect.width;
        y = (event.clientY - rect.top) / rect.height;
    }
    else {
        // 如果没有传入event，且modItem.clicked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
        x = Math.random() / 5 + 0.7;
        y = Math.random() / 5;
    }
    // 根据鼠标相对于卡片的位置设置反转程度
    rotateX = 2 * (y - 0.5);
    rotateY = -2 * (x - 0.5);

    // 当前卡片未被选中时的动画
    cardElement.animate([
        { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` },

        { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(0.88)` },
        //缩小一点
        { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(1)` },
        { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` }
    ], {
        duration: 800,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        iterations: 1
    });
}

defineExpose({
    clicked: clicked,
    getClickedRef: () => clicked,
    click: handleClick,
    playSelectedAnim,
    playUnselectedAnim,
    playFlipAnim
})
</script>

<style scoped>
.clickable-card {
    width: 250px;
    height: 350px;
    background-color: #f0f0f000;
    cursor: pointer;
    transition: transform 0.5s;
}

.clickable-card.clicked {
    transform: scale(0.95);
    transition: transform 0.5s;
}
</style>