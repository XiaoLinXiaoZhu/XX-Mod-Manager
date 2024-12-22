<template>
    <div id="mod-card-manager" class="OO-box">
        <mod-filter-container @changeFilter="handleFilterChange" :filterItems="characters" />
        <s-scroll-view> 
            <div class="refresh-placeholder" ref="refreshPlaceholderRef"></div>
            <div id="mod-container" :compact="compactMode" ref="modContainerRef">
                <modCard v-for="mod in mods" :key="mod.name" 
                    :mod="mod.name" 
                    :character="mod.character"
                    :description="mod.description"
                    :hotKeys="mod.hotkeys"
                    :lazyLoad="true"
                    :imagePath="mod.preview"
                    @click="click"
                    :compactMode="compactMode"
                    :invokeClickChange=false
                    :ref="setModCardRef(mod.name)"
                />
            </div>
            <div class="placeholder"></div>
        </s-scroll-view>
    </div>
</template>

<script setup>
import 'sober';

import { ref, onMounted,computed,useTemplateRef,watch } from 'vue';
import modCard from './modCard.vue';
import modFilterContainer from '../components/modFilterContainer.vue';
import { Tween,Group } from "@tweenjs/tween.js";
import IManager from '../../electron/IManager';
import { mod } from 'three/tsl';

const iManager = new IManager();

// 接受参数
const props = defineProps({
    compactMode: Boolean
});

// 定义 mods 变量
const mods = ref(null);
const characters = ref(['all', 'selected']);
const currentCharacter = ref('all');

// 定义 loadMods 方法
const loadMods = async () => {
    const loadMods = iManager.data.modList;
    mods.value = loadMods;
    characters.value = ['all', 'selected', ...iManager.data.characterList];

    //debug
    console.log(`❇️❇️❇️❇️❇️❇️❇️success load mods, mod count: ${mods.value.length}, character count: ${characters.value.length}`);
};

const modCardRefs = ref({});
// 定义 setModCardRef 方法
const setModCardRef = (name) => (el) => {
    modCardRefs.value[name] = el;
};

const emit = defineEmits(['click']);
// 定义 lastClickedMod 变量
const lastClickedMod = ref(null);

// 定义 click 方法
const click = (mod) => {};

// 定义 handleFilterChange 方法
const handleFilterChange = (character) => {
    currentCharacter.value = character;
    //debug
    console.log(currentCharacter.value);

    // 通过设置 card 的 display 属性来实现筛选
    if (character === 'all') {
        mods.value.forEach((mod) => {
            const modItem = document.getElementById(mod.name);
            modItem.style.display = 'block';
        });
    } else if (character === 'selected') {
        mods.value.forEach((mod) => {
            const modItem = document.getElementById(mod.name);
            if (modItem.getAttribute('clicked') === 'true') {
                modItem.style.display = 'block';
            } else {
                modItem.style.display = 'none';
            }
        });
    } else {
        mods.value.forEach((mod) => {
            const modItem = document.getElementById(mod.name);
            if (mod.character === character) {
                modItem.style.display = 'block';
            } else {
                modItem.style.display = 'none';
            }
        });
    }
};

async function loadPreset(presetName) {
    const mods =await iManager.loadPreset(presetName);
    //遍历modCardRefs，如果 满足 mods.includes(mod.name) ^ mod.clicked 则调用click
    for (const [key, value] of Object.entries(modCardRefs.value)) {
        //debug
        //console.log(`LoadPreset: in mod ${key},mods.includes:${mods.includes(key)},clicked:${clicked}`);
        if (!value) continue;
        const clicked = value.$el.getAttribute('clicked') == 'true';
        if (mods.includes(key) ^ clicked) {
            value.click();
        }
    }
        
    //debug
    console.log('loadPreset',mods);
    // handleFilterChange('已选择');
};

const animate = new Group();
const modContainerRef = useTemplateRef('modContainerRef');
// 监控 compactMode 变量，为其的 grid-auto-rows 添加过渡效果
let isAnimating = false;
// 两个动画效果：从 350px 到 150px，从 150px 到 350px
const compactAnimation = new Tween({height: 350}).to({height: 150}, 200).onComplete(isAnimating = false);
compactAnimation.onUpdate((object) => {
    modContainerRef.value.style.gridAutoRows = `${object.height}px`;
});
const expandAnimation = new Tween({height: 150}).to({height: 350}, 200).onComplete(isAnimating = false);
expandAnimation.onUpdate((object) => {
    modContainerRef.value.style.gridAutoRows = `${object.height}px`;
});

animate.add(compactAnimation);
animate.add(expandAnimation);

watch(() => props.compactMode, (newVal) => {
    if (newVal) {
        modContainerRef.value.style.gridAutoRows = '150px';
        isAnimating = true;
        compactAnimation.start();
        updateAnimate();
    } else {
        modContainerRef.value.style.gridAutoRows = '350px';
        isAnimating = true;
        expandAnimation.start();
        updateAnimate();
    }
});

function updateAnimate() {
    if (!isAnimating) return;
	requestAnimationFrame(updateAnimate)
	animate.update()
}

// 定义 observer 变量
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const modItem = entry.target;
        // 如果元素在视口内，则使其inWindow属性为true
        
        // 这里时一个优化，卡片默认不加载图片，直到 enterWindow 为 true 时才加载图片
        if (modItem.getAttribute('inWindow') == 'none') {
            //debug
            if (entry.isIntersecting) {
                //debug
                // console.log(`item ${modItem.id} enter window , load image`,entry.isIntersecting);
                modCardRefs.value[modItem.id].enterWindow();
            }
            return;
        }

        modItem.inWindow = entry.isIntersecting;
        modItem.setAttribute('inWindow', entry.isIntersecting);
        
        //debug
        //console.log(`modItem ${modItem.id} inWindow:${modItem.inWindow}`);
    });
    }, {
        root: null, // 使用视口作为根
        rootMargin: '600px 50px', // 扩展视口边界
        threshold: 0 // 只要元素进入视口就触发回调
});

// 在 loadMods 方法中为每个 mod-item 添加 observer
const observeMods = () => {
    document.querySelectorAll('.mod-item').forEach(item => {
        observer.observe(item);
    });
};

const refreshPlaceholderRef = useTemplateRef('refreshPlaceholderRef');

// 在组件挂载时调用 observeMods 方法
onMounted(async () => {
    await iManager.waitInit();
    await loadMods();
    observeMods();
    refreshPlaceholderRef.value.style.height = '0px';

    iManager.on('modInfoChanged', (modInfo) => {
        //debug
        console.log('get modInfoChanged');
        mods.value =  null;
        setTimeout(async () => {
            await loadMods();
            observeMods();

            iManager.setLastClickedModByName(modInfo.name);
            iManager.setCurrentCharacter(modInfo.character);
        }, 1);
    });

    iManager.on('addMod', () => {
        //debug
        console.log('get addMod');
        mods.value =  null;
        setTimeout(() => {
            loadMods();
            observeMods();
        }, 1);
    });

    iManager.on('lastClickedModChanged', (mod) => {
            lastClickedMod.value = mod;
    });

    iManager.on('currentCharacterChanged', (character) => {
        currentCharacter.value = character;
        handleFilterChange(character);
    });

    iManager.on('currentPresetChanged', (preset) => {
        loadPreset(preset);
    });

    // 接受文件拖拽事件，可以直接通过拖拽文件到窗口中导入 mod，或者拖拽图片到窗口中为 mod 添加预览图
    modContainerRef.value.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const modItem = event.target.closest('.mod-item');
        if (modItem && modItem.id != iManager.temp.lastClickedMod.name) {
            event.dataTransfer.dropEffect = 'copy';
            iManager.setLastClickedModByName(modItem.id);
        }
    });

    modContainerRef.value.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        // console.log('drop', event,event.dataTransfer.files,event.dataTransfer.items);
        iManager.handleDrop(event);
    });
});



defineExpose({
    loadPreset
});
</script>

<style scoped>
#mod-container {
    width: 100%;
    height: fit-content;
    display: grid;
    /* grid-column: span 4;
    grid-column-start: span 4; */
    grid-column-end: auto;
    grid-template-columns: repeat(auto-fill, 250px);
    grid-row-end: auto;
    grid-auto-rows: 350px;
    gap: 12px;
    justify-content: start;
    justify-items: center;
    min-height: 500px;

    transition: all 0.5s;
}

#mod-card-manager {
    margin: 0 10px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-width: 250px;
    flex: 2;
    height: 100%;
    flex-wrap: nowrap;
}



.placeholder {
    height: 300px;
    width: 100%;
}


.refresh-placeholder {
    height: 100%;
    width: 100%;
    transition: height 0.5s;
}

#mod-container[compact="true"] {
    display: grid;
    grid-column: span 4;
    grid-column-start: span 4;
    grid-column-end: auto;
    grid-auto-rows: 150px;
    grid-template-columns: repeat(auto-fill, 250px);
    gap: 12px;
    justify-content: start;
    justify-items: center;

    transition: all 0.5s;

    .mod-item {
        width: 250px;
        height: 150px;
        transition: height 0.4s;
    }
}
</style>