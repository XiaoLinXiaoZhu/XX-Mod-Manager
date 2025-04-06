<!-- 这个是原本的上面的横幅，但是现在我将其封装起来，只留下接口 -->
<template>
    <horizontalScrollBar class="chip-radio-bar" id="character-filter-bar" style="height: fit-content;">
        <chipButton id="search-filter-chip" @click="updateSliderByEvent($event);" ref="searchChip">
            <s-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path
                        d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z">
                    </path>
                </svg>
            </s-icon>
            <div id="search-input-container"  style="display: none;align-items: center;flex: 1; margin-left: 8px;">
                <s-text-field id="search-input" class="OO-shade-box" style="min-height: 25px;flex: 1;background-color:var(--s-color-surface);border-radius: 5px;" @input="handleSearchInput" v-model="searchInput">

                </s-text-field>
            </div>
        </chipButton>
        <chipButton :text="$t('buttons.all')" id="all-filter-chip" @click="updateSliderByEvent($event)"></chipButton>
        <chipButton :text="$t('buttons.selected')" id="selected-filter-chip" @click="updateSliderByEvent($event)"></chipButton>
        <!-- 所有角色的filter -->
        <chipButton v-for="(item, index) in characterList" :key="index" :text="item" :filterCharacter="item"
            @click="updateSliderByEvent($event)"></chipButton>
        <div class="slider OO-color-gradient" :style="sliderStyle"></div>
    </horizontalScrollBar>
</template>

<script setup lang="ts">
import ChipRadioBar from './chipRadioBar.vue';
import horizontalScrollBar from './horizontalScrollBar.vue';
import { ref, reactive, onMounted, useTemplateRef, watch, Ref } from 'vue';
import chipButton from './chipButton.vue';

import { g_config_vue } from '../../electron/IManager';
import { g_data_vue } from '../../electron/IManager';
import { EventSystem, EventType } from '../../helper/EventSystem';

const lastClickedElement = ref<HTMLElement | null>(null);
const searchInput = ref<string>('');

const language = g_config_vue.language;
const characterList = g_data_vue.characterList as Ref<string[]>;
watch(language, (newValue) => {
    // 刷新一下滑块，因为不同语言的长度不一样
    //debug
    console.log(`g_config_vue.language changed: `, newValue)
    const elment = lastClickedElement.value;
    if (!elment) return;
    updateSlider(elment);
}, { immediate: true });

//-=============== 定义事件 ===============
// 1. itemChange事件，发生在筛选项发生变化时
// 2. filterChangeToAll事件，发生在筛选项为全部时
// 3. filterChangeToSelected事件，发生在筛选项为已选时
// 4. filterChangeToSearch事件，发生在筛选项为搜索时，包含一个参数，表示搜索的内容

const emit = defineEmits([
    'itemChange',
    'filterChangeToAll',
    'filterChangeToSelected',
    'filterChangeToSearch'
]);

//-=============== 滑块 ===============
const sliderStyle = reactive({
    width: '0px',
    left: '0px'
});
const updateSlider = (element) => {
    //debug
    // console.log(`updateSlider: `, element)
    if (!element) return;
    lastClickedElement.value = element;
    sliderStyle.width = `${element.offsetWidth}px`;
    sliderStyle.left = `${element.offsetLeft}px`;
};

const updateSliderByEvent = (e) => {
    const elment = e.currentTarget;
    //debug
    // console.log(`updateSlider: `, elment)
    if (!elment) return;
    // debug
    // console.log(`updateSliderByEvent: `, elment, lastClickedElement.value)

    // 如果 lastClickedElement和当前点击的元素相同，则不处理
    if (lastClickedElement.value != elment) {
        // 对于点击的元素分别处理
        const id = elment.id;
        if (id === 'all-filter-chip') {
            emit('filterChangeToAll');
        } else if (id === 'selected-filter-chip') {
            emit('filterChangeToSelected');
        } else if (id === 'search-filter-chip') {
            // 发送搜索请求
            const searchText = searchInput.value;
            //debug
            console.log('searchText', searchText)
            if (searchText) {
                emit('filterChangeToSearch', searchText);
            }
        } else {
            // 其他的元素
            const filterCharacter = elment.getAttribute('filterCharacter');
            if (filterCharacter) emit('itemChange', filterCharacter);
        }
    }

    
    // 将element的checked属性设置为true，并且将其他的设置为false
    const children = elment.parentElement?.children;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (child !== elment) {
            child.setAttribute('checked', 'false');
        } else {
            child.setAttribute('checked', 'true');
        }
    }

    // 如果点击的不是搜索按钮，则将搜索按钮的宽度设置为fit-content
    if (elment.id !== 'search-filter-chip') {
        const searchChipElement = document.getElementById('search-filter-chip');
        if (searchChipElement) {
            searchChipElement.style.width = 'fit-content';
            searchChipElement.style.transition = 'width 0.3s ease-in-out';
            searchChipElement.style.overflow = 'hidden';
            searchChipElement.style.color = 'var(--s-color-on-primary)';
            // 改变其下的svg的颜色
            const svgElement = searchChipElement.querySelector('svg');
            if (svgElement) {
                svgElement.style.fill = 'var(--s-color-on-surface)';
            }
            // 隐藏搜索框
            const searchInputElement = document.getElementById('search-input-container');
            if (searchInputElement) {
                searchInputElement.style.display = 'none';
            }
        }
    } else {
        // 如果点击的是搜索按钮，则将搜索按钮的宽度设置为200px
        console.log('search button clicked')
        const searchChipElement = document.getElementById('search-filter-chip');
        console.log('searchChipElement', searchChipElement)
        if (searchChipElement) {
            searchChipElement.style.width = '200px';
            searchChipElement.style.transition = 'width 0.3s ease-in-out';
            searchChipElement.style.overflow = 'hidden';
            searchChipElement.style.color = 'var(--s-color-on-primary)';
            // 改变其下的svg的颜色
            const svgElement = searchChipElement.querySelector('svg');
            if (svgElement) {
                svgElement.style.fill = 'var(--s-color-surface)';
            }
            // 显示搜索框
            const searchInputElement = document.getElementById('search-input-container');
            if (searchInputElement) {
                searchInputElement.style.display = 'flex';
            }
        }
    }

    // 更新滑块
    updateSlider(elment);
};

//-=============== 搜索按钮 ===============
const handleSearchInput = (e) => {
    //debug
    console.log('search input', e.target.value)
    // 发送搜索请求
    const searchText = e.target.value;
    if (searchText) {
        emit('filterChangeToSearch', searchText);
    } else {
        // 如果搜索框为空，则发送空搜索请求
        emit('filterChangeToAll');
    }
}

//-=============== 对外的接口 ===============
const selectItemByName = (name) => {
    // 对于all-filter-chip和selected-filter-chip的处理
    if (name === 'all') {
        const allFilterChip = document.getElementById('all-filter-chip');
        if (allFilterChip) {
            allFilterChip.click();
        }
        return;
    } else if (name === 'selected') {
        const selectedFilterChip = document.getElementById('selected-filter-chip');
        if (selectedFilterChip) {
            selectedFilterChip.click();
        }
        return;
    }
    const index = characterList.value.indexOf(name);
    if (index === -1) return;
    // 那么 这个按钮应该是第 index + 3个按钮
    // 因为前面有 search-filter-chip, all, selected三个按钮
    // 主要的目的是滑块同步，lastClickedElement.value = elment
    const characterFilterBar = document.getElementById("character-filter-bar");
    if (!characterFilterBar) return;
    const elment = characterFilterBar.children[index + 3] as HTMLElement;
    if (!elment) return;
    // console.log(`selectItemByName: `, name, index, elment)
    lastClickedElement.value = elment;
    // 直接调用updateSliderByEvent
    updateSliderByEvent({ currentTarget: elment });
};

// EventSystem.on(EventType.currentCharacterChanged, (character) => {
//     // 对于all-filter-chip和selected-filter-chip的处理
//     if (character === 'all') {
//         const allFilterChip = document.getElementById('all-filter-chip');
//         if (allFilterChip) {
//             allFilterChip.click();
//         }
//     } else if (character === 'selected') {
//         const selectedFilterChip = document.getElementById('selected-filter-chip');
//         if (selectedFilterChip) {
//             selectedFilterChip.click();
//         }
//     }
//     selectItemByName(character);
// });


defineExpose({
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
        transition: all 0.1s ease-in-out;
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
    top: 3px;
    transform: skew(-20deg);
    background-color: var(--s-color-primary);
    transition: left 0.3s, width 0.3s;

    will-change: left, width;
}
</style>