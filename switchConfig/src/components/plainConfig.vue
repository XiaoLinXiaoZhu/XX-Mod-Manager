<template>
    <s-card class="plain-config-card" clickable="true" ref="cardRef" @click="handleClick" :class="{selected: clicked}">
        <div slot="image" style="height: 200px;">
            <img id="config-image"
                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;"
                alt="config Image" :src="img || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D'" />
        </div>
        <div slot="headline" id="config-item-headline">{{ props.configRef.name }}</div>
        <div slot="subhead" id="config-item-subhead">{{ props.configRef.name }}</div>
        <div slot="text" id="config-item-text">
            <s-scroll-view>
                <!-- <p id="config-hotkeys">Hotkeys: {{ displayHotKeys }}</p> -->
                <p id="config-item-description">{{ props.configRef.desc }}</p>
                <div class="placeholder"></div>
            </s-scroll-view>
        </div>

    </s-card>


</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, useTemplateRef } from 'vue'
import TapeConfig from '../js/configManager';
import { ImageHelper } from '../../../helper/ImageHelper';

const props = defineProps({
    configRef: {
        type: TapeConfig,
        required: true
    }
})
const img = ref('');

const cardRef = useTemplateRef("cardRef");

const clicked = ref(false);

const handleClick = (event: MouseEvent) => {
    const cardElement = cardRef.value as HTMLElement;
    clicked.value = !clicked.value;
    //debug
    console.log('clicked:', clicked.value, cardElement.getBoundingClientRect());
    if (clicked.value) {
        playSelectedAnim(cardElement, event, cardElement.getBoundingClientRect());
    } else {
        playUnselectedAnim(cardElement, event, cardElement.getBoundingClientRect());
    }
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




onMounted(async () => {
    console.log('configRef:', props.configRef);
    if (props.configRef.tape_front) {
        img.value = await ImageHelper.getImageUrlFromLocalPath(props.configRef.tape_front);
    }
})

defineExpose({
    clicked,
    click: handleClick,
    playSelectedAnim,
    playUnselectedAnim
})
</script>

<style scoped>
#config-image {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}

.plain-config-card {
    width: 250px;
    height: 350px;
    background-color: var(--s-color-surface-container-low);
}

.plain-config-card.selected {
    background-color: var(--s-color-surface-container-high);
    perspective: 500px;
    background-color: var(--s-color-surface-container-low);
    border: 5px solid transparent;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-image: linear-gradient(to right, var(--s-color-surface-container-low), var(--s-color-surface-container-low)), linear-gradient(90deg, var(--s-color-primary), var(--s-color-secondary));
    box-sizing: border-box;
    transform: rotate3d(1, 1, 0, 0deg) scale(0.95);
    border-radius: 0px 32px 0px 32px;
}
</style>
