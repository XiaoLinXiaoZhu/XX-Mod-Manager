<template>
    <div id="mod-card-manager" class="OO-box" ref="modCardManagerRef">
        <chipRadioBar class="characterFilter" :items="characters" @itemChange="handleFilterChange"
            :translatedItems="translateCharacters" ref="characterFilterRef" />
        <s-scroll-view style="overflow-x:hidden;overflow-y: auto;border-radius: 0 0 10px 10px;">
            <div class="refresh-placeholder" ref="refreshPlaceholderRef"></div>
            <div id="mod-container" :compact="compactMode" ref="modContainerRef">
                <modCard v-for="mod in mods" :modRef="mod" :lazyLoad=true :compactMode="compactMode" :ref="setModCardRef(mod.name)" />
            </div>
            <div class="placeholder"></div>
        </s-scroll-view>
    </div>
</template>

<script setup>
import 'sober';
import chipRadioBar from './chipRadioBar.vue';
import { ref, onMounted, computed, useTemplateRef, watch } from 'vue';
import modCard from './modCard.vue';
import { Tween, Group } from "@tweenjs/tween.js";
import IManager from '../../electron/IManager';
import { EventType, EventSystem } from '../../helper/EventSystem';

const iManager = new IManager();

// 接受参数
const props = defineProps({
    compactMode: Boolean
});

// 定义 mods 变量
const mods = ref([]);
const characters = ref(['all', 'selected']);
const translateCharacters = ref(['全部', '已选择']);
const characterFilterRef = useTemplateRef('characterFilterRef');
const currentCharacter = ref('all');

// 定义 loadMods 方法
const loadMods = async () => {
    characters.value = ['all', 'selected', ...iManager.data.characterList];
    currentCharacter.value = 'all';

    mods.value = iManager.data.modList

    // 检查是否选择了预设，如果选择了预设，则加载预设
    if (iManager.temp.currentPreset && iManager.temp.currentPreset != 'default') {
        await loadPreset(iManager.temp.currentPreset);
    }

    //debug
    console.log(`❇️❇️❇️❇️❇️❇️❇️\nsuccess load mods, mod count: ${mods.value.length}, character count: ${characters.value.length}`);
};

// 绑定 mod卡片的引用
const modCardRefs = ref({});
// 定义 setModCardRef 方法
const setModCardRef = (name) => (el) => {
    modCardRefs.value[name] = el;
};

// 定义 handleFilterChange 方法
const handleFilterChange = (character) => {
    currentCharacter.value = character;
    changeFilter(character);
    iManager.setCurrentCharacter(character);
};

async function changeFilter(character) {
    // 通过设置 card 的 class 属性来实现筛选

    //debug
    console.log('changeFilter', character);
    if (character === 'all') {
        // for (const [key, value] of Object.entries(modCardRefs.value)) {
        //     if (!value) continue;
        //     value.$el.classList.remove('hidden');
        // }
        // 使用querySelectorAll 会比遍历快很多
        document.querySelectorAll('.mod-item.hidden').forEach(item => {
            item.classList.remove('hidden');
        });
    } else if (character === 'selected') {
        // for (const [key, value] of Object.entries(modCardRefs.value)) {
        //     if (!value) continue;
        //     if (value.$el.getAttribute('clicked') === 'true') {
        //         value.$el.classList.remove('hidden');
        //     } else {
        //         value.$el.classList.add('hidden');
        //     }
        // }
        document.querySelectorAll('.mod-item').forEach(item => {
            if (item.getAttribute('clicked') === 'true') {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    } else {
        // for (const [key, value] of Object.entries(modCardRefs.value)) {
        //     if (!value) continue;
        //     if (value.$props.character === character) {
        //         value.$el.classList.remove('hidden');
        //     } else {
        //         value.$el.classList.add('hidden');
        //     }
        // }

        // return;
        document.querySelectorAll('.mod-item').forEach(item => {
            item.classList.add('hidden');
        });
        document.querySelectorAll(`.mod-item[character="${character}"]`).forEach(item => {
            item.classList.remove('hidden');
        });
    }

    // 重新触发 observer
    // observeMods();
    // 它必须要有一个“进入视口”的动作，否则不会触发 observer
    // 为了触发 observer，我们可以手动触发一次滚动事件
    window.dispatchEvent(new Event('scroll'));
}



async function loadPreset(presetName) {
    const mods = await iManager.loadPreset(presetName);
    //遍历modCardRefs，如果 满足 mods.includes(mod.name) ^ mod.clicked 则调用click
    for (const [key, value] of Object.entries(modCardRefs.value)) {
        if (!value) continue;
        const clicked = value.$el.getAttribute('clicked') == 'true';
        if (mods.includes(key) ^ clicked) {
            value.click();
        }
    }

    //debug
    console.log('loadPreset', presetName);
    // handleFilterChange('已选择');
};

const animate = new Group();
const modContainerRef = useTemplateRef('modContainerRef');
// 监控 compactMode 变量，为其的 grid-auto-rows 添加过渡效果
let isAnimating = false;
// 两个动画效果：从 350px 到 150px，从 150px 到 350px
const compactAnimation = new Tween({ height: 350 }).to({ height: 150 }, 200).onComplete(isAnimating = false);
compactAnimation.onUpdate((object) => {
    modContainerRef.value.style.gridAutoRows = `${object.height}px`;
});
const expandAnimation = new Tween({ height: 150 }).to({ height: 350 }, 200).onComplete(isAnimating = false);
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

                modItem.setAttribute('inWindow', entry.isIntersecting);
                modItem.inWindow = entry.isIntersecting;
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
    rootMargin: '1000px 0px 1000px 0px', // 扩展视口边界
    threshold: 0 // 只要元素进入视口就触发回调
});

// 在 loadMods 方法中为每个 mod-item 添加 observer
const observeMods = () => {
    document.querySelectorAll('.mod-item').forEach(item => {
        observer.observe(item);
    });
};

const refreshPlaceholderRef = useTemplateRef('refreshPlaceholderRef');
const modCardManagerRef = useTemplateRef('modCardManagerRef');
// 在组件挂载时调用 observeMods 方法
onMounted(async () => {
    await iManager.waitInit();
    await loadMods();
    observeMods();
    refreshPlaceholderRef.value.style.height = '0px';

    // 接受文件拖拽事件，可以直接通过拖拽文件到窗口中导入 mod，或者拖拽图片到窗口中为 mod 添加预览图
    modCardManagerRef.value.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const modItem = event.target.closest('.mod-item');
        if (modItem && modItem.id != iManager.temp.currentMod.name) {
            event.dataTransfer.dropEffect = 'copy';
            // iManager.setLastClickedMod_ByName(modItem.id);
            iManager.setCurrentModByName(modItem.id);
        }
    });

    modCardManagerRef.value.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        // console.log('drop', event,event.dataTransfer.files,event.dataTransfer.items);
        iManager.handleDrop(event);
    });
});

EventSystem.on(EventType.languageChange, (language) => {
    if (language == 'zh_cn') {
        translateCharacters.value = ['全部', '已选择'];
    } else {
        translateCharacters.value = ['All', 'Selected'];
    }
});

EventSystem.on('modInfoChanged', (modInfo) => {
    //debug
    console.log('get modInfoChanged');
    mods.value = null;
    characters.value = null;
    setTimeout(async () => {
        await loadMods();
        observeMods();

        // iManager.setLastClickedMod_ByName(modInfo.name);
        iManager.setCurrentModByName(modInfo.name);
        iManager.setCurrentCharacter(modInfo.character);
    }, 1);
});


// ! on addMod event, reload mods
EventSystem.on('addMod', () => {
    //debug
    console.log('get addMod');
    mods.value = null;
    setTimeout(() => {
        loadMods();
        observeMods();
    }, 1);
});

EventSystem.on('currentCharacterChanged', (character) => {
    if (currentCharacter.value == character) return;
    currentCharacter.value = character;

    characterFilterRef.value.selectItemByName(character);

    changeFilter(character);
});

EventSystem.on('currentPresetChanged', (preset) => {
    loadPreset(preset);
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

.characterFilter {
    /* background-color: aqua; */
    border-radius: 10px;
}

/* #mod-container[compact="true"] {
    grid-column: span 4;
    grid-column-start: span 4;
    grid-column-end: auto;
    grid-auto-rows: 150px;
    grid-template-columns: repeat(auto-fill, 250px);
    gap: 12px;
    justify-content: start;
    justify-items: center;

    transition: all 0.5s;
} */
</style>