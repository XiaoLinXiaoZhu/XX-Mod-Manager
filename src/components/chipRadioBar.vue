<!--
* @Author: XLXZ
* @Description: 使用 chipButton 作为单选按钮的 UI 组件，实现了滚动条和滑块的联动，以及滑块的拖动功能，只作为 UI 组件，不涉及具体的业务逻辑

* @Input: items: Array<string> 传入的选项列表
*        translatedItems: Array<string> 选项列表的翻译

* @Output: itemChange: string 当选项发生变化时触发

* @function: selectItem: (item: string) => void 选中某个选项

* -->
<!-- <template>
    <div class="chip-radio-bar" @wheel="onWheel" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"
        ref="containerRef">
        <chipButton v-for="(item, index) in computedFilterItems" :key="item.text" :text="item.transLatedText"
            :checked="item.checked" @click="selectItem(item, index)">
        </chipButton>
        <div class="slider OO-color-gradient" :style="sliderStyle"></div>
    </div>
</template> -->

<template>
    <div class="chip-radio-bar" @wheel="onWheel" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"
        ref="containerRef">
        <chipButton v-for="(item, index) in items"
            :key="item"
            :text="translatedItems[index] || item"
            :checked="item === currentItem"
            @click="selectItem(item, index)">
        </chipButton>
        <div class="slider OO-color-gradient" :style="sliderStyle"></div>
    </div>
</template>

<script setup>
import { useTemplateRef, ref, reactive, onMounted, watch, computed } from 'vue';
import chipButton from './chipButton.vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import IManager from '../../electron/IManager';
const iManager = new IManager();

const props = defineProps({
    items: {
        type: Array
    },
    translatedItems: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['itemChange']);

const currentItem = ref(props.items[0]);

const sliderStyle = reactive({
    width: '0px',
    left: '0px'
});

const containerRef = useTemplateRef('containerRef');
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

const selectItem = (item, index) => {
    if (item === currentItem.value) return;
    currentItem.value = item;

    updateSlider(index);

    emit('itemChange', item);
};

const selectItemByName = (name) => {
    const index = props.items.indexOf(name);
    if (index === -1) return;
    selectItem(name, index);
};

const updateSlider = (index) => {
    //debug
    //console.log(containerRef.value)
    const chipButtons = containerRef.value.querySelectorAll('s-chip');
    const selectedChip = chipButtons[index];
    //debug
    //console.log(`updateSlider: ${selectedChip}`)
    sliderStyle.width = `${selectedChip.offsetWidth}px`;
    sliderStyle.left = `${selectedChip.offsetLeft}px`;
};

const onWheel = (event) => {
    const container = containerRef.value;
    container.scrollLeft += event.deltaY;
};

const onMouseDown = (event) => {
    isDragging.value = true;
    startX.value = event.pageX - containerRef.value.offsetLeft;
    scrollLeft.value = containerRef.value.scrollLeft;
};

const onMouseUp = () => {
    isDragging.value = false;
};

const onMouseMove = (event) => {
    if (!isDragging.value) return;
    event.preventDefault();
    const x = event.pageX - containerRef.value.offsetLeft;
    const walk = (x - startX.value) * 2; // Scroll-fast
    containerRef.value.scrollLeft = scrollLeft.value - walk;
};

onMounted(() => {
    //debug
    console.log('onMounted',props.translatedItems,props.items)
    updateSlider(0); // Initialize the slider position

});

//-============对外的接口================
defineExpose({
    currentItem,
    selectItem,
    selectItemByName
});

</script>

<style scoped>
.chip-radio-bar {
    display: flex;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    height: fit-content;
    padding: 3px 10px;
    width: calc(100% - 20px);
    min-height: 35px;

    >* {
        margin-right: 5px;
    }

}

.slider {
    /* height: 35px; */
    transform: skew(-20deg);
    z-index: 0;
    padding: 0px 16px;
    box-sizing: border-box;
    border: 1px solid #00000000;
    border-radius: 8px;
    white-space: nowrap;
    overflow: hidden;
    position: absolute;
    height: 35px;
    transform: skew(-20deg);
    background-color: var(--s-color-primary);
    transition: left 0.3s, width 0.3s;
}
</style>