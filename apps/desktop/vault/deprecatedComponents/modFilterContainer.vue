<template>
  <div class="filter-container" @wheel="onWheel" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"
    ref="containerRef">
    <chipButton v-for="(item, index) in computedFilterItems" :key="item.text" :text="item.transLatedText"
      :checked="item.checked" @click="selectItem(item, index)">
    </chipButton>
    <div class="slider OO-color-gradient" :style="sliderStyle"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

import IManager from "../../electron/IManager";

const iManager = new IManager();

import { EventSystem } from "../../helper/EventSystem";

const props = defineProps({
  filterItems: Array,
  currentCharacter: String,
});

const currentCharacter = ref("all");
const _computedFilterItems = computed(() => {
  return getFilterItems().map((item) => {
    const transLatedText =
      item === "all" || item === "selected"
        ? t(`element.filter.${item}`)
        : item;
    return {
      text: item,
      transLatedText: transLatedText,
      checked: item === currentCharacter.value,
    };
  });
});

const sliderStyle = reactive({
  width: "0px",
  left: "0px",
});
const containerRef = useTemplateRef("containerRef");
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

const _selectItem = (item, index) => {
  //debug
  console.log(`selected ${item.text}`);
  if (item.text === currentCharacter.value) return;

  currentCharacter.value = item.text;
  iManager.setCurrentCharacter(item.text);
  updateSlider(index);
  emitCurrentCharacter();
};

const updateSlider = (index) => {
  //debug
  //console.log(containerRef.value)
  const chipButtons = containerRef.value.querySelectorAll("s-chip");
  const selectedChip = chipButtons[index];
  //debug
  //console.log(`updateSlider: ${selectedChip}`)
  sliderStyle.width = `${selectedChip.offsetWidth}px`;
  sliderStyle.left = `${selectedChip.offsetLeft}px`;
};

const _onWheel = (event) => {
  const container = containerRef.value;
  container.scrollLeft += event.deltaY;
};

const _onMouseDown = (event) => {
  isDragging.value = true;
  startX.value = event.pageX - containerRef.value.offsetLeft;
  scrollLeft.value = containerRef.value.scrollLeft;
};

const _onMouseUp = () => {
  isDragging.value = false;
};

const _onMouseMove = (event) => {
  if (!isDragging.value) return;
  event.preventDefault();
  const x = event.pageX - containerRef.value.offsetLeft;
  const walk = (x - startX.value) * 2; // Scroll-fast
  containerRef.value.scrollLeft = scrollLeft.value - walk;
};

EventSystem.on("currentCharacterChanged", (character) => {
  if (character === currentCharacter.value) return;
  //debug
  console.log(`get currentCharacterChanged: ${character}`);
  currentCharacter.value = character;
  const index = getFilterItems().indexOf(character);
  console.log(`get index: ${index}`);
  updateSlider(index);
});

onMounted(async () => {
  console.log(
    `✅✅✅✅✅✅✅ get currentCharacter.value: ${currentCharacter.value}`,
  );
}, 1);

watch(currentCharacter, (newVal, _oldVal) => {
  const filterItems = getFilterItems();
  //debug
  //console.log(`watch: ${filterItems}`)
  const index = filterItems.indexOf(newVal);
  updateSlider(index);
});

function getFilterItems() {
  if (!props.filterItems) {
    props.filterItems = ["全部", "已选择", "1"];
  }
  return props.filterItems;
}

//-============对外的接口================
const emit = defineEmits(["changeFilter"]);
const emitCurrentCharacter = () => {
  emit("changeFilter", currentCharacter.value);
};
</script>

<style scoped>
.filter-container {
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