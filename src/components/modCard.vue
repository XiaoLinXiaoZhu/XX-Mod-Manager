<template>
    <s-card ref="modItemRef" class="mod-item" :clicked=clicked clickable="true" :id="props.mod" inWindow="none"
        :character="props.character" @click="click" :compact="props.compactMode"
        @contextmenu.prevent.stop="openEditModDialog">

        <div slot="image" style="height: 200px;" v-if="ifDisplayImage">
            <img id="editDialog-mod-info-image"
                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;" alt="Mod Image"
                :src="getImage" v-if="!props.lazyLoad || enteredWindow || img != null">
            <s-skeleton id="editDialog-mod-info-image"
                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;" v-else />
        </div>

        <div slot="headline" id="mod-item-headline">{{ props.mod }}</div>
        <div slot="subhead" id="mod-item-subhead">{{ props.character }}</div>
        <div slot="text" id="mod-item-text">
            <s-scroll-view>
                <!-- <p id="mod-hotkeys">Hotkeys: {{ displayHotKeys }}</p> -->
                <p id="mod-item-description">{{ props.description }}</p>
                <div class="placeholder"></div>
            </s-scroll-view>
            <horizontalScrollBar class="OO-box OO-shade-box hotkey-container" scrollSpeed=0.1 dragSpeed=1>
                <div style="display: flex;flex-direction: row;flex-wrap: nowrap;">
                    <div v-for="(hotkey, index) in props.hotKeys" :key="index">
                        <s-tooltip>
                            <div style="margin: 0px 3px;height: 35px;padding: 20px 5px 20px 5px;transform: skew(-20deg);border-radius: 0;min-width: 35px;align-items: center;justify-content: center;"
                                slot="trigger" class="OO-button">
                                <p style="transform: skew(20deg);">
                                    {{ hotkey.key }}
                                </p>
                            </div>
                            <p style="line-height: 1.2;">
                                {{ hotkey.description }} </p>
                        </s-tooltip>
                    </div>
                </div>
            </horizontalScrollBar>
        </div>
    </s-card>
</template>

<script setup>
import 'sober'
import { useTemplateRef, computed, defineProps, onMounted, ref, watch } from 'vue'
import IManager, { snack } from '../../electron/IManager';
import horizontalScrollBar from './horizontalScrollBar.vue';
const iManager = new IManager();
import { EventSystem } from '../../helper/EventSystem';

const props = defineProps({
    mod: String,
    character: String,
    description: String,
    imagePath: String,
    lazyLoad: Boolean,
    compactMode: Boolean,
    hotKeys: {
        type: Array,
        default: () => []
    }
})
const enteredWindow = ref(false);

const displayHotKeys = computed(() => {
    // hotKeys: [{key: 'Ctrl', description: 'description'}]
    return props.hotKeys.map((hotKey) => {
        return `${hotKey.key}: ${hotKey.description}`;
    }).join(', ');
})

const ifDisplayImage = ref(true);

const img = ref(null);

// const getImage = () => {
//     // 直到需要时才加载图片，加载后保存到 img.value
//     if (img.value == null) {
//         iManager.getImageBase64(props.imagePath).then((imageBase64) => {
//             img.value = 'data:image/png;base64,' + imageBase64;
//         });
//     }
//     return img.value;
// }

const getImage = computed(() => {
    // 直到需要时才加载图片，加载后保存到 img.value
    if (img.value == null) {
        iManager.getImageBase64(props.imagePath).then((imageBase64) => {
            img.value = 'data:image/png;base64,' + imageBase64;
        });
    }
    return img.value;
})

EventSystem.on('addMod',(mod)=>{
    // 在mod 添加的时候，检查一下 图片是否正常刷新
    //debug
    console.log(`modItem ${props.mod} received addMod event`,enteredWindow.value,props.lazyLoad,img.value == null);
    //! 这里是临时的解决方案，应该在图片加载失败的时候，重新加载图片
    // ifDisplayImage.value = false;
    
    // setTimeout(() => {
    //     ifDisplayImage.value = true;
    // }, 1);
})

const clicked = ref(false);
const modItemRef = useTemplateRef('modItemRef');
const emit = defineEmits(['click'])

const click = (event) => {
    const clickedAttr = modItemRef.value.getAttribute('clicked');
    clicked.value = clickedAttr == 'true' ? false : true;
    modItemRef.value.setAttribute('clicked', clicked.value);
    if (event != null) {
        playClickAnim(modItemRef.value, event, modItemRef.value.getBoundingClientRect());
        //debug
        console.log(`click: ${props.mod},current clicked: ${clicked.value},attribute: ${modItemRef.value.getAttribute('clicked')}`);
        //emit('click', props.mod);
        // iManager.setLastClickedMod_ByName(props.mod);
        iManager.setCurrentModByName(props.mod);
        iManager.toggledModByName(props.mod);
    }
    else {
        playClickAnim(modItemRef.value);
    }
}

const openEditModDialog = () => {
    // iManager.setLastClickedMod_ByName(props.mod);
    iManager.setCurrentModByName(props.mod);
    iManager.showDialog('edit-mod-dialog');
}

function playClickAnim(modItem, event = null, rect = null) {
    //获取鼠标相对于卡片的位置（百分比）
    let x, y, rotateX, rotateY;
    let rotateLevel = -20;
    const clicked = modItem.getAttribute('clicked') == 'true';
    if (event != null && rect != null) {
        //如果传入了event，则使用event的位置
        //获取鼠标相对于卡片的位置（百分比）
        x = (event.clientX - rect.left) / rect.width;
        y = (event.clientY - rect.top) / rect.height;
    }
    else {
        //如果没有传入event，且modItem.clicked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
        x = !modItem.clicked ? 0 : Math.random() / 5 + 0.7;
        y = !modItem.clicked ? 0.7 : Math.random() / 5;
    }
    //根据鼠标相对于卡片的位置设置反转程度
    rotateX = 2 * (y - 0.5);
    rotateY = -2 * (x - 0.5);

    if (modItem.inWindow == undefined) {
        //如果modItem.inWindow未定义，则设置为true
        modItem.inWindow = true;
    }
    if (!modItem.inWindow) {
        //如果modItem不在视窗内，则不进行动画
        console.log(`${modItem.id} is not in window: prop inWindow is ${modItem.inWindow}`);
        return;
    }

    if (modItem.inWindow == undefined) {
        //如果modItem.inWindow未定义，则设置为true
        modItem.inWindow = true;
    }

    if (modItem.inWindow == false) {
        //如果modItem不在视窗内，则不进行动画
        console.log(`${modItem.id} is not in window: prop inWindow is ${modItem.inWindow}`);
        return;
    }

    //添加动画
    if (clicked) {

        modItem.animate([
            { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` },
            { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1.05)` },
            //缩小一点
            { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1)` },
            { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            iterations: 1
        });
    }
    else {
        modItem.animate([
            { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` },

            { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(0.88)` },
            //缩小一点
            { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(1)` },
            { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            iterations: 1
        });
    }

    //todo: 使用tween.js
}

//-==================== compact mode ====================-//
const enterCompactMode = (item) => {
    item.animate([
        { height: '350px' },
        { height: '150px' }
    ], {
        duration: 300,
        easing: 'ease-in-out',
        iterations: 1
    });
    //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓上移
    //获取这些元素
    //遍历子元素，匹配slot属性
    item.childNodes.forEach(child => {
        if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
            child.animate([
                { transform: 'translateY(200px)' },
                { transform: 'translateY(0px)' }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                iterations: 1
            });
        }
        if (child.slot == 'image') {
            //获取slot下的img元素
            const img = child.querySelector('img');
            if (img)
                img.animate([
                    { opacity: 1, filter: 'blur(0px)' },
                    { opacity: 0.2, filter: 'blur(5px)' }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });
        }
    });
};
const exitCompactMod = (item) => {
    item.animate([
        { height: '150px' },
        { height: '350px' }
    ], {
        duration: 300,
        easing: 'ease-in-out',
        iterations: 1
    });

    //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓下移
    //获取这些元素
    //遍历子元素，匹配slot属性

    item.childNodes.forEach(child => {
        if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
            child.animate([
                { transform: 'translateY(-200px)' },
                { transform: 'translateY(0px)' }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                iterations: 1
            });
        }
        if (child.slot == 'image') {
            //获取slot下的img元素
            const img = child.querySelector('img');
            if (img)
                img.animate([
                    { opacity: 0.2, filter: 'blur(5px)' },
                    { opacity: 1, filter: 'blur(0px)' }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });
        }
    });
}

watch(() => props.compactMode, (newVal, oldVal) => {
    //debug
    // console.log(`modItem ${props.mod} compactMode changed from ${oldVal} to ${newVal}`);

    const modItem = modItemRef.value;
    //debug
    // console.log(`modItem ${modItem.id} inWindow:${modItem.getAttribute('inWindow')}`);
    // 如果 为 hidden，则不进行动画
    if (modItem.classList.contains('hidden')) {
        return;
    }
    if (modItem.getAttribute('inWindow') != 'true') {
        //如果modItem不在视窗内，则不进行动画
        console.log(`${modItem.id} is not in window: prop inWindow is ${modItem.getAttribute('inWindow')}`);
        return;
    }
    if (newVal) {
        enterCompactMode(modItemRef.value);
    }
    else {
        exitCompactMod(modItemRef.value);
    }
})

//==================== init ====================//
onMounted(() => {
    iManager.waitInit().then(() => {

    });
})

const enterWindow = () => {
    enteredWindow.value = true;
}


defineExpose({
    click,
    playClickAnim,
    enterWindow
})
</script>

<style>
.mod-item.hidden {
    display: none;
}

.mod-item[clicked="true"] {
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

.mod-item[clicked="false"] {
    perspective: 500px;
    background-color: var(--s-color-surface-container-low);
    border: 1px solid transparent;
    border: "";
    transform: rotate3d(1, 1, 0, 0deg);
    border-radius: 0px 30px 0px 30px;
}

.mod-item {
    perspective: 500px;
    width: 250px;
    height: 350px;
    margin-bottom: 0px;
    will-change: transform;

    transition: x, y 0.5s cubic-bezier(.36, -0.64, .34, 1.76);

    >div[slot="image"] {
        width: 250px;
        height: 200px;
    }
}

.mod-item img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    user-drag: none;
    -webkit-user-drag: none;
}

.mod-item #mod-item-headline {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 12px;
}

.mod-item #mod-item-subhead {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: -2px;
}

.mod-item #mod-item-text {
    height: 100px;
    margin-top: -10px;
    border: 0;
}

.mod-item s-scroll-view {
    height: 100%;
    width: 110%;
}

.mod-item .placeholder {
    height: 80px;
    border: 0;
}

/* .mod-item.compact img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    position: absolute;
    filter: blur(5px);
    opacity: 0.2;
}

.mod-item.compact div[slot="image"] {
    position: absolute;
    z-index: -1;
} */

/* .mod-item[compact="true"] {
    perspective: 500px;
    width: 250px;
    height: 200px;
    margin-bottom: 0px;
    will-change: transform;
    transition: x, y 0.5s cubic-bezier(.36, -0.64, .34, 1.76);
    border-radius: 0px 30px 0px 30px;
} */


.mod-item[compact="true"] {
    width: 250px;
    height: 150px;
    transition: all 0.4s;
}

.mod-item[compact="true"] img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    /* position: absolute; */
    filter: blur(5px);
    opacity: 0.2;
}

.mod-item[compact="true"] div[slot="image"] {
    position: absolute;
    z-index: -1;
}



/* 使用 css 的 animation 实现折叠效果 */
/* 
@keyframes identifier {
    0% {
        margin-top: 200px;
        color: red;
    }

    100% {
        margin-top: 0px;
        color: blue;
    }
}

.mod-item[compact="true"] #mod-item-headline {
    animation: identifier 1s ease-in-out;
    animation-fill-mode: forwards;
    animation-iteration-count: 1;
} */
</style>

<style scoped>
.hotkey-container {
    overflow-y: hidden;
    overflow-x: auto;
    height: 25px;
    align-items: center;
    max-width: 450px;
    padding: 0px 0px;
    border-radius: 0 20px 0 20px;

    position: absolute;
    bottom: 5px;
    left: 10px;
    right: 5px;
}
</style>