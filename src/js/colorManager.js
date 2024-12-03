import { Tween, Easing, Group } from '@tweenjs/tween.js'; // 引入Tween.js库
import { Color } from 'three';
import { ClassManager, ClassManagerService } from './classManager.js'; // 引入ClassManager类和ClassManagerService类
import IManager from '../../electron/IManager.js';
const iManager = new IManager();
// 这个js的功能是能够在任意时刻获取当前颜色。
// 当前颜色 是一个 从 荧光绿 94ad00 到 荧光黄 ffd300 的渐变色。
// 通过调用getColor()方法，可以获取当前颜色。


// 将上述代码 改为 使用 ClassManager 来管理



let startColor = new Color(0x94ad00);
let endColor = new Color(0xffd300);
let currentColor = startColor;

// 根据 theme 的变化，改变颜色
iManager.on('theme-change', (theme) => {
    if (theme === 'dark') {
        startColor = new Color(0x94ad00);
        endColor = new Color(0xffd300);
    } else {
        startColor = new Color(0x63828E);
        endColor = new Color(0x0E4F3C);
    }
    
    // 重新创建一个tween对象
    ColorTween = new Tween({ color: startColor });
    ColorTween.to({ color: endColor }, 2000)
        .easing(Easing.Quadratic.InOut)
        .onUpdate((object) => {
            currentColor = currentColor.lerp(object.color, 0.01);
        })
        .yoyo(true)
        .repeat(Infinity)
        .repeatDelay(500)
        .start();
    //清空group
    group.removeAll();
    group.add(ColorTween);
});

let ColorTween = new Tween({ color: startColor }) // 创建一个tween对象


//tween 在这两个颜色之间使用 pingPong 模式 ， easing函数为 Easing.Quadratic.InOut

ColorTween.to({ color: endColor }, 2000)
    .easing(Easing.Quadratic.InOut)
    .onUpdate((object) => {
        currentColor = currentColor.lerp(object.color, 0.01);
    })
    .yoyo(true)
    .repeat(Infinity)
    .repeatDelay(500)
    .start();

const group = new Group();
group.add(ColorTween);

function getColor() {
    return currentColor.getHexString();
}


//-======================== OO-color-gradient ========================
// 定义 classManager
const colorManager = new ClassManager('OO-color-gradient');

colorManager.onUpdate = function () {
    //debug
    group.update();
    const currentColor = getColor();
    this.items.forEach(item => {
        item.style.backgroundColor = `#${currentColor}`;
    });
}

colorManager.needRefresh = true;
colorManager.onPageInit = function () {}
colorManager.init = function (element) { }
colorManager.destroy = function (element) { }


//-========================= OO-color-gradient-svg ========================
const colorManagerSvg = new ClassManager('OO-color-gradient-svg');
colorManagerSvg.onUpdate = function () {
    const currentColor = getColor();
    this.items.forEach(item => {
        const svg = item.querySelector('svg');
        const group = svg.querySelector('g');
        group.setAttribute('fill', `#${currentColor}`);
    });
}
colorManagerSvg.needRefresh = true;
colorManagerSvg.onPageInit = function () {}
colorManagerSvg.init = function (element) { }
colorManagerSvg.destroy = function (element) { }


//-========================= OO-OO-capering ========================
// 上下浮动的效果
const caperingTween = new Tween({ y: -1 });
caperingTween.to({ y: 1 }, 500)
    .onUpdate((object) => {
        caperingManager.items.forEach(item => {
            const k = item.getAttribute('capering-k') || 1;
            //让其上下浮动，不使用transform
            const translateY =  object.y * object.y * k;
            item.style.marginTop = `${translateY }px`;
        });
    })
    .yoyo(true)
    .repeat(Infinity)
    .repeatDelay(500)
    .start();
const caperingManager = new ClassManager('OO-capering');
caperingManager.onUpdate = function () {
    caperingTween.update();
}
caperingManager.needRefresh = true;
caperingManager.onPageInit = function () {}
caperingManager.init = function (element) { }
caperingManager.destroy = function (element) { }

// console.log('colorManager', colorManager);

//-========================= OO-pumping ========================
// 高度和宽度在一定范围内波动的效果
const pumpingTween = new Tween({ scale: 1 });
pumpingTween.to({ scale: 1.1 }, 500)
    .onUpdate((object) => {
        pumpingManager.items.forEach(item => {
            
            const originalX = item.getAttribute('original-x');
            const originalY = item.getAttribute('original-y');
            //通过设置shadow来实现放大效果
            //debug
            //console.log(`pumping update, scale:${object.scale}`);
            item.style.boxShadow = `0 0 10 ${100}px ${item.style.backgroundColor}`;
        });
        //debug
        //console.log(`pumping update, scale:${object.scale}`);
    })
    .easing(Easing.Quadratic.InOut)
    .yoyo(true)
    .repeat(Infinity)
    .repeatDelay(200)
    .start();
const pumpingManager = new ClassManager('OO-pumping');
pumpingManager.onUpdate = function () {
    pumpingTween.update();
}
pumpingManager.needRefresh = true;
pumpingManager.onPageInit = function () {}
pumpingManager.init = function (element) {
    element.setAttribute('original-x', element.offsetWidth);
    element.setAttribute('original-y', element.offsetHeight);
}
pumpingManager.destroy = function (element) { }


// console.log('pumpingManager', pumpingManager);