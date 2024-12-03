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
import { Tween,Group } from '@tweenjs/tween.js';
import IManager from '../../electron/IManager';

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
    console.log(`success load mods, mod count: ${mods.value.length}, character count: ${characters.value.length}`);
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

function loadPreset(mods){
    //遍历modCardRefs，如果 满足 mods.includes(mod.name) ^ mod.clicked 则调用click
    for (const [key, value] of Object.entries(modCardRefs.value)) {
        //debug
        //console.log(`LoadPreset: in mod ${key},mods.includes:${mods.includes(key)},clicked:${clicked}`);
        const clicked = value.$el.getAttribute('clicked') == 'true';
        if (mods.includes(key) ^ clicked) {
            value.click();
        }
    }
        
    //debug
    console.log('loadPreset',mods);
    //handleFilterChange('已选择');
};

const modContainerRef = useTemplateRef('modContainerRef');
// 监控 compactMode 变量，为其的 grid-auto-rows 添加过渡效果
watch(() => props.compactMode, (newVal) => {
    if (newVal) {
        modContainerRef.value.style.gridAutoRows = '150px';
    } else {
        modContainerRef.value.style.gridAutoRows = '350px';
    }
});


// 定义 observer 变量
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const modItem = entry.target;
        // 如果元素在视口内，则使其inWindow属性为true
        modItem.inWindow = entry.isIntersecting;
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

    iManager.on('modInfoChanged', () => {
        //debug
        console.log('get modInfoChanged');
        mods.value =  null;
        setTimeout(() => {
            loadMods();
            observeMods();
        }, 1);
    });

    iManager.on('lastClickedModChanged', (mod) => {
        lastClickedMod.value = mod;
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
    }
}
</style>