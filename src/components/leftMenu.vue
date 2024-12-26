<!-- *
* @ Author: XLXZ
* @ Description: 只在左侧显示的菜单栏，仅作为 UI 组件，不涉及具体业务逻辑

* @ Input: tabs: Array<string> 选项卡列表
*         translatedTabs: Array<string> 选项卡列表的翻译
* @ Output: tabChange: string 当选项卡发生变化时触发

* @ function: selectTab: (tab: string) => void 选中某个选项卡

* @ Slot: up-button: 用于自定义上方按钮
*        down-button: 用于自定义下方按钮
* -->
<template>
    <div class="left-menu OO-box">
        <div class="OO-button-box" id="up-button">
            <slot name="up-button">
                <s-icon type="arrow_drop_up"></s-icon>
            </slot>
        </div>
        <div>
            <div class="slider OO-color-gradient" :style="sliderStyle"></div>
                <div 
                    v-for="(tab, index) in tabs" 
                    :key="index" 
                    :class="['tab', { active: currentTab === tab }]" 
                    @click="selectTab(tab)"
                >
                    <p> {{ translatedTabs[index] || tab }} </p>
                    <s-ripple attached="true"></s-ripple>
                </div>
        </div>
        <div class="placeholder"></div>
    <div class="OO-button-box" id="down-button">
        <slot name="down-button">
            <s-icon type="arrow_drop_down"></s-icon>
        </slot>
    </div>
        
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
    tabs: {
        type: Array,
        required: true
    },
    translatedTabs: {
        type: Array,
        required: false,
        default: () => []
    }
});

const emit = defineEmits(['tabChange']);

const currentTab = ref(props.tabs[0]);

const selectTab = (tab) => {
    if (tab === currentTab.value) return;
    currentTab.value = tab;
    emit('tabChange', tab);
};

const sliderStyle = computed(() => {
    const index = props.tabs.indexOf(currentTab.value);
    return {
        transform: `translateY(${index * 100}%)`
    };
});

watch(() => props.tabs, (newTabs) => {
    if (!newTabs.includes(currentTab.value)) {
        currentTab.value = newTabs[0];
    }
});

defineExpose({
    currentTab, // 当前选中的选项卡,一般不使用，而是通过监听 tabChange 事件来获取
    selectTab
});

</script>

<style scoped>

.left-menu{
    display: flex;
    flex-direction: column;
    position: relative;
    width: 200px;
    min-width: 100px;
    max-width: 200px;
    height: calc(100% - 20px)
}

.tab {
    position: relative;
    padding: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    text-align: center;
    z-index: 1;
    height: 20px;


}

.tab p {
    width: 100%;
    text-align: center;
    font-weight: bolder;
    margin: 0;
    transition: color 0.3s;
}

.tab.active {
    color: var(--s-color-on-primary);

    s-ripple {
        opacity: 1;
        color: var(--s-color-primary);
        transition: opacity 0.3s, color 0.5s;
    }
}

.slider {
    position: absolute;
    width: calc(100% - 20px);
    height: 40px;
    background-color: var(--s-color-primary);
    border-radius: 10px;
    transition: transform 0.3s;
}

s-ripple {
    /* --ripple-color: var(--s-color-primary); */
    border-radius: 10px;
}

.OO-button-box{
    position: relative;
    height: 32px;
    margin: 0;
    border-radius: 16px;
    width: calc(100% - 26px);
    display: flex;
    align-items: center;
    justify-content: center;
}

#up-button{
    left: -7px;
    top: -7px;
}

.placeholder{
    flex: 1;
}

#down-button{
    left: -7px;
    bottom: -7px;
}
</style>