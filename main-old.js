import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Tween, Easing } from '@tweenjs/tween.js'; // 引入Tween.js库

let scene, camera, renderer, tapeBoxes = [], currentIndex = 0;
let selectedTape = null, shelf = null;

const textureLoader = new THREE.TextureLoader();



class Tape {
    tapeManager = null;
    tape = null;
    constructor(tapeManager) {
        console.log('Tape constructor');
        this.tapeManager = tapeManager;
        this.tapeManager.addTape(this);
    }
    static defaultfrontTexture = textureLoader.load(`./src/tape_front.jpg`);
    static defaultsideTexture = textureLoader.load(`./src/tape_side.jpg`);
    static defaultbackTexture = textureLoader.load(`./src/tape_back.jpg`);

    frontTexture = Tape.defaultfrontTexture;
    sideTexture = Tape.defaultsideTexture;
    backTexture = Tape.defaultbackTexture;

    SetTapeMaterial(frontTexture, sideTexture, backTexture) {
        this.frontTexture = frontTexture;
        this.sideTexture = sideTexture;
        this.backTexture = backTexture;
    }

    tapeGeometry = new THREE.BoxGeometry(0.5, 5, 2.5); // 磁带盒的尺寸

    SetTapeGeometry(geometry) {
        this.tapeGeometry = geometry
    }

    GetTape() {
        if (this.tape === null) {
            // 创建磁带盒
            // debug
            console.log('tape create');
            const materials = createTapeMaterial(this.frontTexture, this.sideTexture, this.backTexture);
            this.tape = new THREE.Mesh(this.tapeGeometry, materials);
            scene.add(this.tape);
        }
        // 如果发生了更改，则删除原来的磁带盒，并重新创建
        var isChanged = false;
        if (this.tape.geometry !== this.tapeGeometry) {
            isChanged = true;
        }
        if (this.tape.material[0].map !== this.frontTexture) {
            isChanged = true;
        }
        if (this.tape.material[2].map !== this.sideTexture) {
            isChanged = true;
        }
        if (this.tape.material[1].map !== this.backTexture) {
            isChanged = true;
        }

        if (isChanged) {
            // debug
            console.log('tape changed');
            // 重新创建磁带盒
            scene.remove(this.tape);
            this.tape = new THREE.Mesh(this.tapeGeometry, createTapeMaterial(this.frontTexture, this.sideTexture, this.backTexture));
            scene.add(this.tape);
        }
        // debug
        console.log('tape get');
        return this.tape;
    }

    static state = ['inQueue', 'display', 'clicked']
    state = Tape.state[0];
    targetState = Tape.state[0];
    queueIndex = 0;

    SetState(state) { this.targetState = state; }

    SetQueue(idx) { 
        this.queueIndex = idx;
        this.inQueue();
    }

    update() {
        if (this.state !== this.targetState) {
            //debug
            console.log(`[${new Date().toLocaleTimeString()}] in tape ${this.queueIndex} state change: ${this.state} -> ${this.targetState}`);
            switch (this.targetState) {
                case 'display':
                    this.display();
                    break;
                case 'clicked':
                    this.clicked();
                    break;
                default:
                    this.inQueue();
            }
        }
    }

    inQueue() {
        //旋转两圈之后，恢复到原来的位置
        const tapeInstance = this.GetTape();
        const rotationTween = new Tween(tapeInstance.rotation)
            .to({ y: 0 }, 2000)
            .easing(Easing.Quadratic.Out);
        
        const positionTween = new Tween(tapeInstance.position)
            .to({ x: -5 + this.queueIndex, z: -5, y: 0 }, 2000)
            .easing(Easing.Quadratic.Out);

        rotationTween.start();
        positionTween.start();

        tweens.push(rotationTween, positionTween);

        this.state = 'inQueue';
    }

    display() {
        this.state = 'display';
        this.tapeManager.tapes.forEach(t => {
            if (t == this) return;
            t.SetState(Tape.state[0]);
            t.tape.rotation.y = 0;
            t.tape.material[0].opacity = 0.5;
        });

        this.tape.rotation.y = Math.PI / 6;
        this.tape.material[0].opacity = 1;

        // 移动到相机前方
        const positionTween = new Tween(this.tape.position)
            .to({ x: 0, z: -2, y: 0 }, 2000)
            .easing(Easing.Quadratic.Out);

        positionTween.start();
        tweens.push(positionTween);

        // 保存当前选中的磁带
        selectedTape = this;
    }

    clicked() {
        console.log('clicked');
    }
}

class TapeManager {
    tapes = [];

    constructor() {
        this.tapes = [];
    }

    addTape(tape) {
        this.tapes.push(tape);
    }

    removeTape(tape) {
        this.tapes = this.tapes.filter(t => t !== tape);
    }

    update() {
        this.tapes.forEach(t => t.update());
    }

    RollTape(dertaIdx) {
        this.tapes.forEach(t => {
            t.queueIndex = (t.queueIndex + dertaIdx + this.tapes.length) % this.tapes.length;
            t.SetQueue(t.queueIndex);
        });
    }
}

const tapeManager = new TapeManager();


// 创建磁带盒材质
function createTapeMaterial(frontTexture, sideTexture, backTexture) {
    const materials = [
        new THREE.MeshBasicMaterial({ map: frontTexture }),  // 前面
        new THREE.MeshBasicMaterial({ map: backTexture }),   // 后面
        new THREE.MeshBasicMaterial({ map: sideTexture }),   // 左侧
        new THREE.MeshBasicMaterial({ map: sideTexture }),   // 右侧
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF }),    // 顶面
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })     // 底面
    ];
    return materials;
}

let tweens = [];

function init() {
    // 创建场景
    scene = new THREE.Scene();

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // 创建书架背景
    const shelfGeometry = new THREE.BoxGeometry(20, 1, 10); // 书架的深度、宽度、高度
    const shelfMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.set(0, -1, -30); // 位置靠近相机后方
    scene.add(shelf);

    // 创建磁带盒
    for (let i = 0; i < 10; i++) {
        const tape = new Tape(tapeManager);
        tape.SetTapeGeometry(new THREE.BoxGeometry(0.5, 5, 2.5));
        tape.SetTapeMaterial(Tape.defaultfrontTexture, Tape.defaultsideTexture, Tape.defaultbackTexture);
        tape.SetQueue(i);

        const tapeInstance = tape.GetTape();
        tapeInstance.position.set(-5 + i, 0, -5);
        tapeBoxes.push(tapeInstance);
    }

    camera.position.z = 10;
    camera.position.y = 2;

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // 更新所有的动画
    tweens.forEach(t => t.update());

    renderer.render(scene, camera);

    let str = `state of tapes: `;
    // 更新所有的磁带盒
    tapeManager.tapes.forEach(t => {
        t.update();
        str += `${t.state} `;
    });
    //console.log(str);
}

function showTape(tape) {
    // const tape = tapeBoxes[index];
    // tapeBoxes.forEach(t => t.rotation.y = 0);
    // tape.rotation.y = Math.PI / 6; // 倾斜 30 度
    // tapeBoxes.forEach(t => {
    //     if (t !== tape) {
    //         t.material[0].opacity = 0.5;
    //     }
    // });
    tape.SetState(Tape.state[1]);

}

function nextTape() {
    currentIndex = (currentIndex + 1) % tapeBoxes.length;
    //debug
    console.log(`click next, currentIndex: ${currentIndex} of ${tapeManager.tapes.length}`);
    tapeManager.RollTape(1);
    showTape(tapeManager.tapes[currentIndex]);
}

function prevTape() {
    currentIndex = (currentIndex - 1 + tapeBoxes.length) % tapeBoxes.length;
    //debug
    console.log(`click prev, currentIndex: ${currentIndex} of ${tapeManager.tapes.length}`);
    tapeManager.RollTape(-1);
    showTape(tapeManager.tapes[currentIndex]);
}

// 按钮点击事件
document.getElementById('next-btn').addEventListener('click', nextTape);
document.getElementById('prev-btn').addEventListener('click', prevTape);

// 开始动画
function startTapeAnimation() {
    const tape = tapeBoxes[currentIndex];

    // 创建旋转的动画（旋转两圈）
    const rotationTween = new Tween(tape.rotation)
        .to({ y: tape.rotation.y + Math.PI * 2 }, 2000)
        .easing(Easing.Quadratic.Out);

    // 创建位置的动画（移动磁带到更靠近相机的位置）
    const positionTween = new Tween(tape.position)
        .to({ x: 0, z: -2, y: 0 }, 2000)
        .easing(Easing.Quadratic.Out);

    // 创建倾斜的动画（将磁带倾斜到 -30 度）
    const rotationFinalTween = new Tween(tape.rotation)
        .to({ y: Math.PI / 6 }, 1000)
        .easing(Easing.Quadratic.InOut);

    // 启动这些动画
    rotationTween.start();
    positionTween.start();
    rotationFinalTween.start();

    // 将这些动画保存起来
    tweens.push(rotationTween, positionTween, rotationFinalTween);
}

// 在每次点击磁带时，触发动画
document.getElementById('start-btn').addEventListener('click', startTapeAnimation);

// 初始化场景
init();
