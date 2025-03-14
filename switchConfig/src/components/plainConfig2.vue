<template>
    <clickableCard ref="cardRef" :useDefaultClickEvent=false>
        <s-card class="plain-config-card" clickable="true" :class="{ selected : clicked }">
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

    </clickableCard>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, useTemplateRef, Ref, watch } from 'vue'
import TapeConfig from '../js/configManager';
import clickableCard from '../../../src/components/clickableCard.vue';
import { ImageHelper } from '../../../helper/ImageHelper';

const props = defineProps({
    configRef: {
        type: TapeConfig,
        required: true
    }
})
const img = ref('');

const cardRef = useTemplateRef<InstanceType<typeof clickableCard>>("cardRef");

const clicked = ref(false);

watch(() => cardRef.value?.clicked, (value) => {
    if (value !== undefined) {
        clicked.value = value;
    }
})
// let handleClick: ((event: MouseEvent, ifToggle?: boolean) => void) | null = null;
// let playFlipAnim: ((cardElement: HTMLElement, event: MouseEvent | null, rect: DOMRect | null) => void) | null = null;
// let playSelectedAnim: ((cardElement: HTMLElement, event: MouseEvent | null, rect: DOMRect | null) => void) | null = null;
// let playUnselectedAnim: ((cardElement: HTMLElement, event: MouseEvent | null, rect: DOMRect | null) => void) | null = null;
const getClickedRef = () => {
    return cardRef.value?.getClickedRef();
}
const handleClick = (event: MouseEvent, ifToggle: boolean = true) => {
    cardRef.value?.click(event, ifToggle);
}
const playFlipAnim = (cardElement: HTMLElement, event: MouseEvent | null = null, rect: DOMRect | null = null) => {
    cardRef.value?.playFlipAnim(cardElement, event, rect);
}
const playSelectedAnim = (cardElement: HTMLElement, event: MouseEvent | null = null, rect: DOMRect | null = null) => {
    cardRef.value?.playSelectedAnim(cardElement, event, rect);
}
const playUnselectedAnim = (cardElement: HTMLElement, event: MouseEvent | null = null, rect: DOMRect | null = null) => {
    cardRef.value?.playUnselectedAnim(cardElement, event, rect);
}

onMounted(async () => {
    console.log('configRef:', props.configRef);
    if (props.configRef.tape_front) {
        img.value = await ImageHelper.getImageUrlFromLocalPath(props.configRef.tape_front);
    }
})

defineExpose({
    clicked: clicked,
    getClickedRef,
    click: handleClick,
    playSelectedAnim,
    playUnselectedAnim,
    playFlipAnim
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
