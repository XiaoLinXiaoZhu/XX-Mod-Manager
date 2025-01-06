import { Tween, Easing, Group } from '@tweenjs/tween.js'; // 引入Tween.js库
import { ClassManager, ClassManagerService } from './classManager.js'; // 引入ClassManager类和ClassManagerService类
import IManager from '../../electron/IManager.js';
const iManager = new IManager();
// 这个js的功能是能够在任意时刻获取当前颜色。
// 当前颜色 是一个 从 荧光绿 94ad00 到 荧光黄 ffd300 的渐变色。
// 通过调用getColor()方法，可以获取当前颜色。

// 创建一个Color类，用于表示颜色
class Color {
    constructor(hex) {
        this.hex = hex;
        this.r = hex >> 16;
        this.g = (hex >> 8) & 0xff;
        this.b = hex & 0xff;
    }

    r = this.hex >> 16;
    g = (this.hex >> 8) & 0xff;
    b = this.hex & 0xff;

    clone() {
        return new Color(this.hex);
    }

    lerp(color, alpha) {
        // 通过lerp函数，计算两个颜色之间的插值
        const hex = this.hex;
        const hex2 = color.hex;
        const r = hex >> 16;
        const g = (hex >> 8) & 0xff;
        const b = hex & 0xff;
        const r2 = hex2 >> 16;
        const g2 = (hex2 >> 8) & 0xff;
        const b2 = hex2 & 0xff;
        const r3 = r + (r2 - r) * alpha;
        const g3 = g + (g2 - g) * alpha;
        const b3 = b + (b2 - b) * alpha;
        const hex3 = (r3 && 0xff) << 16 + (g3 && 0xff) << 8 + (b3 && 0xff);
        return new Color((r3 && 0xff) << 16 + (g3 && 0xff) << 8 + (b3 && 0xff));
    }

    getHexString() {
        //debg
        return this.hex.toString(16);
    }

    setColor(r, g, b) {
        // 设置颜色
        // 需要过滤掉小数部分
        this.r = Math.floor(r);
        this.g = Math.floor(g);
        this.b = Math.floor(b);
        this.hex = (this.r << 16) + (this.g << 8) + this.b;
    }
}

// 将上述代码 改为 使用 ClassManager 来管理

const lightColor ={
    startColor: new Color(0x53727E),
    endColor: new Color(0x0E3F3C)
}

const darkColor = {
    startColor: new Color(0x9fb900),
    endColor: new Color(0xf2d900)
}


let startColor = new Color(0x94ad00);
let endColor = new Color(0xffd300);
let currentColor = new Color(0x94ad00);
startColor = darkColor.startColor;
endColor = darkColor.endColor;

currentColor = startColor.clone();

const colorChangeTime = 2000; // 颜色变化的时间

// 根据 theme 的变化，改变颜色
iManager.on('themeChange', (theme) => {
    if (theme === 'dark') {
        startColor = darkColor.startColor;
        endColor = darkColor.endColor;
    } else {
        startColor = lightColor.startColor;
        endColor = lightColor.endColor
    }

    //debug
    console.log('theme change', theme, startColor, endColor);
    
    // 重新创建一个tween对象
    ColorTween = new Tween({ r: startColor.r, g: startColor.g, b: startColor.b }) // 创建一个tween对象
    ColorTween.to({ r: endColor.r, g: endColor.g, b: endColor.b }, colorChangeTime)
        .easing(Easing.Quadratic.InOut)
        .onUpdate((object) => {
            currentColor.setColor(object.r, object.g, object.b);
            // console.log(`currentColor: ${currentColor.getHexString()}`);
        })
        .yoyo(true)
        .repeat(Infinity)
        .repeatDelay(500)
        .start();
    //清空group
    group.removeAll();
    group.add(ColorTween);
});

let ColorTween = new Tween({ r: startColor.r, g: startColor.g, b: startColor.b })
//tween 在这两个颜色之间使用 pingPong 模式 ， easing函数为 Easing.Quadratic.InOut

ColorTween.to({ r: endColor.r, g: endColor.g, b: endColor.b }, colorChangeTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate((object) => {
        currentColor.setColor(object.r, object.g, object.b);
        //debug
        // console.log(`currentColor: ${currentColor.getHexString()}`);
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
colorManager.destroy = function (element) {
    element.style.backgroundColor = '';
}

//-======================== OO-color-gradient-word ========================
// 定义 classManager
const colorManager2 = new ClassManager('OO-color-gradient-word');

colorManager2.onUpdate = function () {
    //debug
    // group.update();
    const currentColor = getColor();
    this.items.forEach(item => {
        item.style.color = `#${currentColor}`;
    });
}

colorManager2.needRefresh = true;
colorManager2.onPageInit = function () {}
colorManager2.init = function (element) { }
colorManager2.destroy = function (element) {
    element.style.color = '';
}

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