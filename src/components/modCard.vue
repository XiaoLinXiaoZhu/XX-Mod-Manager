<script setup>
import 'sober'
import { defineProps, ref } from 'vue'
import { Tween,Easing,Group } from '@tweenjs/tween.js';

const props = defineProps({
    mod: String,
    character: String,
    description: String,
    image: String,
    hotKeys:{
        type: Array,
        default: () => []
    }
})

const checked = ref(false);
const modItemInfo = ref(null);
const click = (event) => {
    //debug
    console.log('clicked')
    checked.value = !checked.value
    const modItem = document.getElementById(props.mod)
    clickModItem(modItem, event, modItem.getBoundingClientRect())
}

const turnOnTween = new Tween({ x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1 })
            .to({ x: -rotateY * 15, y: rotateX * 15, rotateX: rotateX * rotateLevel, rotateY: rotateY * rotateLevel, scale: 1.05 }, 600)
            .easing(Easing.Cubic.InOut)
            .onUpdate((object) => {
                modItem.style.transform = `perspective( 500px ) translate(${object.x}px,${object.y}px) rotateX(${object.rotateX}deg) rotateY(${object.rotateY}deg) scale(${object.scale})`;
            });

const turnOffTween = new Tween({ x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1 })
    .to({ x: -rotateY * 5, y: rotateX * 5, rotateX: rotateX * rotateLevel, rotateY: rotateY * rotateLevel * 0.2, scale: 0.88 }, 800)
    .easing(Easing.Cubic.InOut)
    .onUpdate((object) => {
        modItem.style.transform = `perspective( 500px ) translate(${object.x}px,${object.y}px) rotateX(${object.rotateX}deg) rotateY(${object.rotateY}deg) scale(${object.scale})`;
    });

// let AnimationGroup = new Group();
// const setAnimationGroup = (group) => {
//     AnimationGroup = group;

//     //添加动画
//     AnimationGroup.add(turnOnTween);
//     AnimationGroup.add(turnOffTween);
// }

function clickModItem(modItem, event = null, rect = null) {
        //获取鼠标相对于卡片的位置（百分比）
        let x, y, rotateX, rotateY;
        let rotateLevel = -20;
        if (event != null) {
            //如果传入了event，则使用event的位置
            //获取鼠标相对于卡片的位置（百分比）
            x = (event.clientX - rect.left) / rect.width;
            y = (event.clientY - rect.top) / rect.height;
        }
        else {
            //如果没有传入event，且modItem.checked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
            x = modItem.checked ? 0 : Math.random() / 5 + 0.7;
            y = modItem.checked ? 0.7 : Math.random() / 5;
        }
        //根据鼠标相对于卡片的位置设置反转程度
        rotateX = 2 * (y - 0.5);
        rotateY = -2 * (x - 0.5);

        //反转卡片状态
        modItem.checked = !modItem.checked;
        modItem.setAttribute('checked', modItem.checked ? 'true' : 'false');
        if (modItem.inWindow == undefined) {
            //如果modItem.inWindow未定义，则设置为true
            modItem.inWindow = true;
        }
        if (!modItem.inWindow) {
            //如果modItem不在视窗内，则不进行动画
            console.log(`${modItem.id} is not in window: prop inWindow is ${modItem.inWindow}`);
            return;
        }


        添加动画
        if (modItem.checked == true) {

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
        // if (modItem.checked == true) {
        //     turnOnTween.start();
        // }
        // else {
        //     turnOffTween.start();
        // }
    }


</script>


<template>
    <s-card ref="modItemRef" class="mod-item" :checked="checked" clickable="true" :id="props.mod" inWindow="true" :character="props.character" @click="click">
        <div slot="image" style="height: 200px;">
            <img :src="props.image" alt="mod image" />
        </div>
        <div slot="headline" id="mod-item-headline">{{ props.mod }}</div>
        <div slot="subhead" id="mod-item-subhead">{{ props.character }}</div>
        <div slot="text" id="mod-item-text">
            <s-scroll-view>
                <p id="mod-hotkeys">Hotkeys: {{ props.hotKeys.join(', ') }}</p>
                <p id="mod-item-description">{{ props.description }}</p>
                <div class="placeholder"></div>
            </s-scroll-view>
        </div>
    </s-card>
</template>


<style scoped>



.mod-item[checked="true"] {
    perspective: 500px;
    background-color: var(--s-color-surface-container-low);
    border: 5px solid transparent;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-image: linear-gradient(to right, var(--s-color-surface-container-low), var(--s-color-surface-container-low)), linear-gradient(90deg, var(--s-color-primary), #e4d403);
    box-sizing: border-box;
    transform: rotate3d(1, 1, 0, 0deg) scale(0.95);
    border-radius: 0px 32px 0px 32px;
}

.mod-item[checked="false"] {
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
    height: 30px;
    border: 0;
}

</style>