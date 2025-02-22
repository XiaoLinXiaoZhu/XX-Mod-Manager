import * as THREE from 'three';
import { Tween, Easing, Group } from '@tweenjs/tween.js';

const fs = require('fs');

const textureLoader = new THREE.TextureLoader();

// 创建磁带盒材质
function createTapeMaterial(frontTexture, sideTexture, backTexture, spineTexture) {
    const materials = [
        new THREE.MeshLambertMaterial({
            map: frontTexture,
            normalMap: textureLoader.load(`../src/assets/tape/normal.png`), //法线贴图
            //设置深浅程度，默认值(1,1)。
            normalScale: new THREE.Vector2(-1, 1),
        }), //材质对象Material
        new THREE.MeshLambertMaterial({ map: backTexture }),   // 后面
        new THREE.MeshLambertMaterial({ map: sideTexture }),   // 左侧
        new THREE.MeshLambertMaterial({ map: sideTexture }),   // 右侧
        new THREE.MeshLambertMaterial({
            map: spineTexture,
            normalMap: textureLoader.load(`../src/assets/tape/normal.png`), //法线贴图
            //设置深浅程度，默认值(1,1)。
            normalScale: new THREE.Vector2(3, 3)
        }),    // 顶面
        new THREE.MeshLambertMaterial({
            map: spineTexture,
            normalMap: textureLoader.load(`../src/assets/tape/normal.png`), //法线贴图
            //设置深浅程度，默认值(1,1)。
            normalScale: new THREE.Vector2(1, 1)
        })    // 底面
    ];
    return materials;
}

//-=========================Tape=========================

class Tape {
    //--------------audio----------------
    static bookAudio = new Audio('../src/assets/tape/book.ogg');
    static clickedAudio = new Audio('../src/assets/tape/display.ogg');
    static defaultVolume = 0.1;

    static playAudio(audio, volume = Tape.defaultVolume) {
        if (audio.paused) {
            audio.volume = volume;
            audio.play();
        }else{
            audio.currentTime = 0.05;
        }
    }


    //--------------tween----------------

    tweens = [];
    tapeManager = null;
    instance = null;
    idx = 0;
    constructor(handler) {
        this.tapeManager = handler;
        this.tapeManager.AddTape(this);
        this.idx = this.tapeManager.tapes.length - 1;
    }

    //--------------tween----------------
    ClearTweens() {
        this.tweens.forEach(t => t.stop());
        this.tweens = [];
    }

    //--------------texture----------------
    static defaultfrontTexture = textureLoader.load(`../src/assets/tape/tape_front.jpg`);
    static defaultsideTexture = textureLoader.load(`../src/assets/tape/tape_side.jpg`);
    static defaultbackTexture = textureLoader.load(`../src/assets/tape/tape_back.jpg`);
    static defaultspineTexture = textureLoader.load(`../src/assets/tape/tape_spine.png`);

    frontTexture = Tape.defaultfrontTexture;
    sideTexture = Tape.defaultsideTexture;
    backTexture = Tape.defaultbackTexture;
    spineTexture = Tape.defaultspineTexture;

    SetTapeMaterial(frontTexture, sideTexture, backTexture, spineTexture) {
        this.frontTexture = frontTexture;
        this.sideTexture = sideTexture;
        this.backTexture = backTexture;
        this.spineTexture = spineTexture
    }

    SetTapeMaterialFromUrl(urls) {
        // 从 路径 加载纹理，如果加载失败则使用默认纹理
        const frontTexture = fs.existsSync(urls.tape_front) ? textureLoader.load(urls.tape_front) : Tape.defaultfrontTexture;
        const sideTexture = fs.existsSync(urls.tape_side) ? textureLoader.load(urls.tape_side) : Tape.defaultsideTexture;
        const backTexture = fs.existsSync(urls.tape_back) ? textureLoader.load(urls.tape_back) : Tape.defaultbackTexture;
        const spineTexture = fs.existsSync(urls.tape_spine) ? textureLoader.load(urls.tape_spine) : Tape.defaultspineTexture;

        this.SetTapeMaterial(frontTexture, sideTexture, backTexture, spineTexture);
    }

    //--------------geometry----------------
    tapeGeometry = new THREE.BoxGeometry(0.5, 4.096, 2.544); // 磁带盒的尺寸

    SetTapeGeometry(geometry) {
        this.tapeGeometry = geometry
    }

    //---------------info----------------
    name = 'Tape';
    description = 'This is a tape.';
    
    //--------------instance----------------
    GetTape() {
        if (this.instance === null) {
            // 创建磁带盒
            const materials = createTapeMaterial(this.frontTexture, this.sideTexture, this.backTexture, this.spineTexture);
            this.instance = new THREE.Mesh(this.tapeGeometry, materials);
            this.instance.castShadow = true;
            this.instance.receiveShadow = true;
            this.tapeManager.scene.add(this.instance);
        }
        // 如果发生了更改，则删除原来的磁带盒，并重新创建
        var isChanged = false;
        if (this.instance.geometry !== this.tapeGeometry) {
            isChanged = true;
        }
        if (this.instance.material[0].map !== this.frontTexture) {
            isChanged = true;
        }
        if (this.instance.material[2].map !== this.sideTexture) {
            isChanged = true;
        }
        if (this.instance.material[1].map !== this.backTexture) {
            isChanged = true;
        }
        if (isChanged) {
            this.tapeManager.scene.remove(this.instance);
            this.instance = null;
            return this.GetTape();
        }
        return this.instance;
    }

    Delete() {
        this.tapeManager.scene.remove(this.instance);
        this.instance.geometry.dispose();
        this.instance.material.forEach(m => m.dispose());

        this.instance = null;
    }


    //--------------state----------------
    static state = ['inQueue', 'display', 'clicked']
    state = Tape.state[0];
    targetState = Tape.state[0];

    targetPosition = { x: 0, z: -2, y: 0 };
    targetRotation = { x: 0, y: 0, z: 0 };

    SetState(state) { this.targetState = state; }

    SetQueue(pos) {
        //debug
        //console.log(`[${new Date().toLocaleTimeString()}] #Function.SetQueue: in tape ${this.idx} set position to (${pos.x}, ${pos.y}, ${pos.z})`);


        this.targetPosition.x = pos.x;
        this.targetPosition.z = pos.z;
        this.targetPosition.y = pos.y;
        if (this.state === 'inQueue') this.inQueue();
        else{
            //播放 Tape.bookAudio 音频
            if (Tape.bookAudio.paused) {
                Tape.bookAudio.volume = 0.3;
                Tape.bookAudio.play();
            }else{
                Tape.bookAudio.currentTime = 0.05;
            }
        }
        this.targetState = 'inQueue';
    }

    update() {
        if (this.state !== this.targetState) {
            //debug
            //console.log(`[${new Date().toLocaleTimeString()}] in tape ${this.idx} state change: ${this.state} -> ${this.targetState}`);
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

        this.tweens.forEach(t => t.update());
    }

    inQueue() {
        //debug
        //console.log(`[${new Date().toLocaleTimeString()}] in tape ${this.idx} inQueue from ${this.instance.position.x}, ${this.instance.position.y}, ${this.instance.position.z} to ${this.targetPosition.x}, ${this.targetPosition.y}, ${this.targetPosition.z}`);

        this.state = 'inQueue';
        this.ClearTweens();

        //旋转两圈之后，恢复到原来的位置
        const tapeInstance = this.GetTape();
        const rotationTween = new Tween(tapeInstance.rotation)
            .to({ x: this.targetRotation.x, y: this.targetRotation.y, z: this.targetRotation.z }, 300)
            .easing(Easing.Quadratic.Out);

        const positionTween = new Tween(tapeInstance.position)
            .to(this.targetPosition, 200)
            .easing(Easing.Quadratic.Out);

        rotationTween.start();
        positionTween.start();

        this.tweens.push(rotationTween, positionTween);
    }

    display() {
        if (this.state === 'clicked') {
            //播放 Tape.clickedAudio 音频
            Tape.playAudio(Tape.clickedAudio);
            Tape.playAudio(Tape.bookAudio);
        }

        this.state = 'display';
        this.ClearTweens();

        // 第一步：磁带靠近摄像头
        const positionTween = new Tween(this.instance.position)
            .to({ x: 0, z: 2, y: 0.3 }, 300)
            .easing(Easing.Quadratic.Out)

        // 第二步：磁带旋转
        const spinTween = new Tween(this.instance.rotation)
            .to({ x: Math.PI * 0.06, y: -Math.PI * 0.35, z: Math.PI * 0.23 }, 300) // 2圈 + 之前的45度
            .easing(Easing.Quadratic.Out);
        // const targetRotation = this.calculateEulerAnglesFromInitialToTarget(new THREE.Vector3(0, 1, 1), Math.PI * 0);
        // const spinTween = new Tween(this.instance.rotation)
        //     .to({ x: targetRotation.x, y: targetRotation.y, z: targetRotation.z }, 300)
        //     .easing(Easing.Quadratic.Out);

        spinTween.start();
        this.tweens.push(spinTween);

        positionTween.start();
        this.tweens.push(positionTween);
    }

    clicked() {
        this.state = 'clicked';
        this.ClearTweens();

        // 第一步：磁带靠近摄像头
        const positionTween = new Tween(this.instance.position)
            .to({ x: 0, z: 6, y: 0.3 }, 300)
            .easing(Easing.Cubic.InOut);

        // 第二步：磁带旋转
        const spinTween = new Tween(this.instance.rotation)
            .to({ x: Math.PI * 0.06, y: -Math.PI * 2.35, z: Math.PI * 0.03 }, 600) // 2圈 + 之前的45度
            .easing(Easing.Cubic.Out);
        spinTween.start();
        this.tweens.push(spinTween);

        positionTween.start();
        this.tweens.push(positionTween);

        //播放 Tape.clickedAudio 音频
        Tape.playAudio(Tape.clickedAudio);
    }

    RotationByAxis(axis, angle, originRotation = { x: 0, y: 0, z: 0 }) {
        // 将沿着某一任意轴 axis 旋转 angle 角度 的 动作 分解为 3 个分别绕 x, y, z 轴旋转的动作
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, angle);

        // 将轴线绘制到屏幕上
        const arrowHelper = new THREE.ArrowHelper(axis.normalize(), new THREE.Vector3(0, 0, 0), 1, 0xff0000);
        this.tapeManager.scene.add(arrowHelper);


        const euler = new THREE.Euler();
        euler.setFromQuaternion(quaternion);
        //debug
        console.log(`[${new Date().toLocaleTimeString()}] Rotation by axis ${axis.x}, ${axis.y}, ${axis.z} and angle ${angle} to euler ${euler.x}, ${euler.y}, ${euler.z}`);
        const targetRotation = { x: originRotation.x + euler.x, y: originRotation.y + euler.y, z: originRotation.z + euler.z };
        return targetRotation;
    }


    /**
     * 根据初始法线、目标法线和旋转角度，计算物体绕 X、Y、Z 轴的旋转角度。
     * 
     * @param {THREE.Vector3} initialNormal 初始法线方向
     * @param {THREE.Vector3} targetNormal 目标法线方向
     * @param {number} rotationAngle 绕目标法线的旋转角度（单位：弧度）
     * @returns {THREE.Euler} 绕 X、Y、Z 轴的旋转角度（欧拉角，单位：弧度）
     */
    calculateEulerAnglesFromInitialToTarget(targetNormal, rotationAngle, initialNormal = new THREE.Vector3(1, 0, 0)) {
        // 计算旋转轴：由初始法线到目标法线的旋转轴
        const axis = new THREE.Vector3().crossVectors(initialNormal, targetNormal).normalize();

        // 计算旋转角度：初始法线到目标法线的夹角
        const angle = initialNormal.angleTo(targetNormal);

        // 创建旋转四元数，表示从初始法线到目标法线的旋转
        const quaternionToTarget = new THREE.Quaternion().setFromUnitVectors(initialNormal, targetNormal);

        // 创建旋转四元数，表示绕目标法线旋转指定的角度
        const quaternionRotation = new THREE.Quaternion().setFromAxisAngle(targetNormal, rotationAngle);

        // 组合这两个旋转
        const finalQuaternion = quaternionToTarget.multiply(quaternionRotation);

        // 将旋转四元数转换为欧拉角
        const euler = new THREE.Euler().setFromQuaternion(finalQuaternion);

        return euler;
    }

}


//-=========================TapeManager=========================
class TapeManager {
    scene = null;
    tapes = [];
    currentIndex = 0;

    constructor(scene) {
        this.tapes = [];
        this.scene = scene;
    }

    AddTape(tape) {
        this.tapes.push(tape);
    }

    RemoveTape(tape) {
        tape.Delete();
        this.tapes = this.tapes.filter(t => t !== tape);
    }

    update() {
        this.tapes.forEach(t => t.update());
    }

    RollTape(dertaIdx) {
        this.currentIndex = (this.currentIndex + dertaIdx + this.tapes.length) % this.tapes.length;
        //debug
        //console.log(`[${new Date().toLocaleTimeString()}] Roll tape to ${this.currentIndex}`);
        const length = this.tapes.length;
        const halfLength = Math.floor(this.tapes.length / 2);

        for (let i = 0; i < length; i++) {
            if (i == this.currentIndex) {
                this.tapes[i].SetState('display');
                continue;
            }
            // 通过虚拟索引计算磁带的位置，虚拟索引是 将 全部的磁带按照当前选中的磁带为 0 的位置进行计算的，它的范围是 [-tapes.length/2, tapes.length/2]
            let virtualIndex = i - this.currentIndex;
            if (virtualIndex > halfLength) {
                virtualIndex -= length;
            }
            if (virtualIndex < -halfLength) virtualIndex += this.tapes.length;

            this.tapes[i].targetRotation = this.getRotationByVirtualIndex(virtualIndex, this.tapes.length);

            // 比如说对于 length = 7 那么 virtualIndex 的范围是 [-3, 3]
            // 如果对于 length = 6 那么 virtualIndex 的范围是 [-2, 3]
            // 特殊处理一下头和尾，当向前滚动到头部额时候，直接将坐标设置到尾部，当向后滚动到尾部的时候，直接将坐标设置到头部     
            //console.log(`[${new Date().toLocaleTimeString()}] Handle the tape ${i} from virtual index ${virtualIndex}`);       
            if (length % 2 === 0) {
                if (dertaIdx < 0 && virtualIndex === -halfLength + 1) {
                    const currentTape = this.tapes[i].instance;
                    const position = this.getPositionByVirtualIndex(-halfLength - 2, this.tapes.length);
                    currentTape.position.set(position.x, position.y, position.z);
                }
                if (dertaIdx > 0 && virtualIndex === halfLength) {
                    const currentTape = this.tapes[i].instance;
                    const position = this.getPositionByVirtualIndex(halfLength + 3, this.tapes.length);
                    currentTape.position.set(position.x, position.y, position.z);

                    //debug
                    //console.log(`[${new Date().toLocaleTimeString()}] Handle the tail tape ${i} from virtual index ${virtualIndex} to ${halfLength + 1}`);
                }
            }
            else {
                if (dertaIdx < 0 && virtualIndex === -halfLength) {
                    const currentTape = this.tapes[i].instance;
                    const position = this.getPositionByVirtualIndex(-halfLength - 2, this.tapes.length);
                    currentTape.position.set(position.x, position.y, position.z);
                }
                if (dertaIdx > 0 && virtualIndex === halfLength) {
                    const currentTape = this.tapes[i].instance;
                    const position = this.getPositionByVirtualIndex(halfLength + 2, this.tapes.length);
                    currentTape.position.set(position.x, position.y, position.z);

                    //debug
                    //console.log(`[${new Date().toLocaleTimeString()}] Handle the tail tape ${i} from virtual index ${virtualIndex} to ${halfLength + 2}`);
                }
            }
            let position = this.getPositionByVirtualIndex(virtualIndex, this.tapes.length);
            //debug
            //console.log(`[${new Date().toLocaleTimeString()}] Set tape ${i} to visual index ${virtualIndex} at position (${position.x}, ${position.y}, ${position.z})`);
            this.tapes[i].SetQueue(position);
        }
    }

    onClick() {
        if (this.tapes.length === 0) return;
        if (this.tapes[this.currentIndex].state === 'clicked') {
            this.tapes[this.currentIndex].SetState('display');
            return;
        }

        this.tapes[this.currentIndex].SetState('clicked'); 
    }

    getPositionByVirtualIndex(virtualIndex, length) {
        const x = virtualIndex * 1.2;
        const z = -2 - Math.abs(virtualIndex) * 0.2;
        const y = 0;
        return { x, z, y };
    }

    getRotationByVirtualIndex(virtualIndex, length) {
        const x = 0.2 * Math.PI / 15 * Math.abs(virtualIndex);
        const y = 0.5 * Math.PI / 15 * virtualIndex;
        const z = -0.5 * Math.PI / 15 * virtualIndex;
        return { x, y, z };
    }

    GetCurrentTapeInfo() {
        const tape = this.tapes[this.currentIndex];
        return { name: tape.name, description: tape.description };
    }
}


export { Tape, TapeManager };