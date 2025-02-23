<!--
* @Author: XLXZ
* @Description: 使用 chipButton 作为单选按钮的 UI 组件，实现了滚动条和滑块的联动，以及滑块的拖动功能，只作为 UI 组件，不涉及具体的业务逻辑

* @Input: items: Array<string> 传入的选项列表
*        translatedItems: Array<string> 选项列表的翻译

* @Output: itemChange: string 当选项发生变化时触发

* @function: selectItem: (item: string) => void 选中某个选项

* -->

<!-- <div class="chip-radio-bar" @wheel="onWheel" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"
    ref="containerRef">
    <chipButton v-for="(item, index) in items"
        :key="item"
        :text="translatedItems[index] || item"
        :checked="item === currentItem"
        @click="selectItem(item, index)">
    </chipButton>
    <div class="slider OO-color-gradient" :style="sliderStyle"></div>
</div> -->

<template>
    <horizontalScrollBar class="chip-radio-bar">
        <chipButton v-for="(item, index) in items" :key="item" 
            :text="translatedItems[index] || item"
            :checked="item === currentItem" 
            style="margin-right: 5px;" 
            :ref="setChipButtonRef(item)"
            @click="selectItem(item, index)">
        </chipButton>
        <div class="slider OO-color-gradient" :style="sliderStyle"></div>
    </horizontalScrollBar>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import chipButton from './chipButton.vue';
import horizontalScrollBar from './horizontalScrollBar.vue';

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


//-=============== 按钮引用 ===============
const chipButtonRefs = ref({});
const setChipButtonRef = (index) => (el) => {
    chipButtonRefs.value[index] = el;
}

const currentItem = ref(props.items[0]);

//-=============== 滑块 ===============
const sliderStyle = reactive({
    width: '0px',
    left: '0px'
});
const updateSlider = (index) => {
    const selectedChip = chipButtonRefs.value[props.items[index]];
    //debug
    // console.log(`updateSlider: `, selectedChip)

    if (!selectedChip) return;
    sliderStyle.width = `${selectedChip.$el.offsetWidth}px`;
    sliderStyle.left = `${selectedChip.$el.offsetLeft}px`;
};


//-=============== 浮动滑块 ===============
const selectItem = (item, index) => {
    updateSlider(index);
    if (item === currentItem.value) return;
    currentItem.value = item;

    emit('itemChange', item);
};

const selectItemByName = (name) => {
    const index = props.items.indexOf(name);
    if (index === -1) return;
    selectItem(name, index);
};

// onMounted(() => {
//     //debug
//     // console.log('onMounted', props.translatedItems, props.items)
//     waitInitIManager().then(() => {
//         updateSlider(0);
//     });
// });

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
    top: 3px;
    transform: skew(-20deg);
    background-color: var(--s-color-primary);
    transition: left 0.3s, width 0.3s;

    will-change: left, width;
}
</style>