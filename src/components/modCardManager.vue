<template>
    <div id="mod-card-manager" class="OO-box" ref="modCardManagerRef">
        <!-- <chipRadioBar class="characterFilter" :items="characters" @itemChange="handleFilterChange"
            :translatedItems="translateCharacters" ref="characterFilterRef" /> -->
        <ModCharacterFilter class="characterFilter" @itemChange="handleFilterChange" ref="characterFilterRef" @filterChangeToAll="handleFilterChangeToAll"
            @filterChangeToSelected="handleFilterChangeToSelected" @filterChangeToSearch="handleFilterChangeToSearch" />
        <s-scroll-view style="overflow-x:hidden;overflow-y: auto;border-radius: 0 0 10px 10px;">
            <div class="refresh-placeholder" ref="refreshPlaceholderRef"></div>
            <div id="mod-container" :compact="compactMode" ref="modContainerRef">
                <modCard v-for="mod in mods" :modRef="mod" :lazyLoad=true :compactMode="compactMode"
                    :ref="setModCardRef(mod.id)" />
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
import IManager, { g_data_vue } from '../../electron/IManager';
import { g_config_vue, g_temp_vue } from '../../electron/IManager';
import { EventType, EventSystem } from '../../helper/EventSystem';
import ModCharacterFilter from './modCharacterFilter.vue';

const iManager = new IManager();

// 接受参数
const props = defineProps({
    compactMode: Boolean
});

// 定义 mods 变量
const mods = ref([]);

const characterFilterRef = useTemplateRef('characterFilterRef');
const currentCharacter = g_temp_vue.currentCharacter;

watch(currentCharacter, (newVal) => {
    if (newVal) {
        //debug
        console.log('currentCharacter changed:', newVal);
        characterFilterRef.value.selectItemByName(newVal);
        changeFilter(newVal);
    }
});

// 切换语言的时候，all 和 全部 的长度不一样，所以需要切换
watch(g_config_vue.language, (newVal) => {
    setTimeout(() => {
        characterFilterRef.value.selectItemByName(currentCharacter.value);
    }, 0);
});

const characters = computed(() => {
    const characterList = g_data_vue.characterList;
    if (!characterList) return [];
    //debug
    console.log('get characterList', characterList.value);
    return ['all', 'selected', ...characterList.value];
});

const translateCharacters = computed(() => {
    if (g_config_vue.language.value == 'zh_cn') {
        return ['全部', '已选择'];
    } else {
        return ['All', 'Selected'];
    }
});

// 定义 loadMods 方法
const loadMods = async () => {
    mods.value = iManager.data.modList

    // 检查是否选择了预设，如果选择了预设，则加载预设
    if (iManager.temp.currentPreset && iManager.temp.currentPreset != 'default') {
        await loadPreset(iManager.temp.currentPreset);
    }

    // 检查是否选择了角色，如果选择了角色，则筛选角色
    // 这里再刷新一次的原因是，因为 mod卡片全部重新加载了之后，之前的筛选就失效了
    // debug
    console.log('changeFilter to currentCharacter:', currentCharacter.value);
    if (currentCharacter.value) {
        setTimeout(() => {
            changeFilter(currentCharacter.value);
        }, 0);
    }

    //debug
    console.log(`❇️❇️❇️❇️❇️❇️❇️\nsuccess load mods, mod count: ${mods.value.length}, character count: ${characters.value.length}`);
};

// 绑定 mod卡片的引用
const modCardRefs = ref({});
// 定义 setModCardRef 方法
const setModCardRef = (id) => (el) => {
    modCardRefs.value[id] = el;
};

let wasSearching = false;
// 定义 handleFilterChange 方法
const handleFilterChange = (character) => {
    iManager.setCurrentCharacter(character);
};

const handleFilterChangeToAll = () => {
    iManager.setCurrentCharacter('all');
    if (wasSearching) {
        wasSearching = false;
        changeFilterToSearch('');
    } else {
        changeFilter('all');
    }
};

const handleFilterChangeToSelected = () => {
    iManager.setCurrentCharacter('selected');
    if (wasSearching) {
        wasSearching = false;
        changeFilterToSearch('');
    } else {
        changeFilter('selected');
    }
};

const handleFilterChangeToSearch = (search) => {
    console.log('handleFilterChangeToSearch', search);
    // currentCharacter变成all
    // iManager.setCurrentCharacter('all');
    // 但是筛选并不按照currentCharacter来筛选，而是按照搜索的内容来筛选
    changeFilterToSearch(search);
    wasSearching = true;
};

async function changeFilterToSearch(search){
    // 筛选出所有 mod-item 元素
    const modItems = document.querySelectorAll('.mod-item');
    // 如果搜索内容为空，则显示所有 mod-item 元素
    if (search === '') {
        modItems.forEach(item => {
            item.classList.remove('hidden');
        });
        return;
    }
    // 遍历 mod-item 元素，判断是否包含搜索内容
    modItems.forEach(item => {
        // 获取 mod-item 的名称
        const name = item.getAttribute('name');
        // 如果名称包含搜索内容，则显示，否则隐藏
        if (name && name.includes(search)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

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

EventSystem.on('modInfoChanged', (modInfo) => {
    //debug
    console.log('get modInfoChanged, reload display mods');
    mods.value = null;
    setTimeout(async () => {
        await loadMods();
        if (modInfo) {
            iManager.setCurrentCharacter(modInfo.character);
        }
        observeMods();
    }, 1);
});

EventSystem.on(EventType.modListChanged, () => {
    //debug
    console.log('get modListChanged, reload display mods');
    mods.value = null;
    setTimeout(() => {
        loadMods();
        observeMods();
    }, 1);
});

EventSystem.on('currentPresetChanged', (preset) => {
    loadPreset(preset);
});




// 定义动画效果

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
        if (modItem && modItem.id != iManager.temp.currentMod.id) {
            event.dataTransfer.dropEffect = 'copy';
            // iManager.setLastClickedMod_ByName(modItem.id);
            iManager.setCurrentModById(modItem.id);
        }
    });

    modCardManagerRef.value.addEventListener('drop', (event) => {
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