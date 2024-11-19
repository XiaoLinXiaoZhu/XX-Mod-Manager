import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Tween, Easing, Group } from '@tweenjs/tween.js'; // 引入Tween.js库
import { Tape, TapeManager } from './tape.js';
import { createBulbLight } from './bulbLight.js';

//-========================后期处理========================
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { LuminosityShader } from 'three/addons/shaders/LuminosityShader.js';

// later in your init routine


import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ClearPass } from 'three/addons/postprocessing/ClearPass.js';
import { CubeTexturePass } from 'three/addons/postprocessing/CubeTexturePass.js';
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { HalftonePass } from 'three/addons/postprocessing/HalftonePass.js';
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
import { MaskPass } from 'three/addons/postprocessing/MaskPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { RenderTransitionPass } from 'three/addons/postprocessing/RenderTransitionPass.js';
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
import { SavePass } from 'three/addons/postprocessing/SavePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import { TexturePass } from 'three/addons/postprocessing/TexturePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { pixelationPass } from 'three/examples/jsm/tsl/display/PixelationPassNode.js';


let scene, camera, renderer, shelf = null;
let composer = null;
const sceneContainer = document.getElementById('scene-container');

//-=========================init=========================
let tweens = [];
let tapeManager = null;

function initLight(scene) {
    // 创建光源
    // 直线光
    const light = new THREE.DirectionalLight(0x44AAAA, 0.05);

    light.position.set(1, 0, 5);
    light.target.position.set(0, 0, 0);
    light.castShadow = true; // default false

    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
    scene.add(light);

    const helper = new THREE.DirectionalLightHelper(light, 5);
    //scene.add(helper);


    // 环境光
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.02);
    scene.add(ambientLight);

    const bulbLight = createBulbLight(0xffbb99, 20, 100, 1.5);
    bulbLight.position.set(-1, 5, 2);
    scene.add(bulbLight);

    const bulbLight2 = createBulbLight(0xffbb99, 1, 3, 1);
    bulbLight2.position.set(-2, 0.7, 3);
    scene.add(bulbLight2);

    const bulbLight3 = createBulbLight(0xffbb99, 5, 8, 2);
    bulbLight3.position.set(0, 0, 9);
    scene.add(bulbLight3);

}


function initScene(scene) {
    // 创建书架背景
    const shelfGeometry = new THREE.BoxGeometry(81.92 / 2, 25.76 / 2, 30); // 书架的深度、宽度、高度
    const textureLoader = new THREE.TextureLoader();
    const shelfTexture = textureLoader.load('src/television.jpg');
    const shelfMaterial = new THREE.MeshLambertMaterial({ map: shelfTexture });
    shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.set(0, 1, -30); // 位置靠近相机后方
    scene.add(shelf);
    shelf.receiveShadow = true;

    // 创建磁带盒
    tapeManager = new TapeManager(scene);
    for (let i = 0; i < 15; i++) {
        const tape = new Tape(tapeManager);
        tape.SetTapeGeometry(new THREE.BoxGeometry(0.5, 4.096, 2.544));
        tape.SetTapeMaterial(Tape.defaultfrontTexture, Tape.defaultsideTexture, Tape.defaultbackTexture, Tape.defaultspineTexture);

        // debug
        console.log(`[${new Date().toLocaleTimeString()}] create tape ${i}`);
        const tapeInstance = tape.GetTape();
        tapeManager.RollTape(0);
    }
}

function initPostProcessing(scene, camera, renderer) {
    // 后期处理
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const effect1 = new ShaderPass(DotScreenShader);
    effect1.uniforms['scale'].value = 4;
    //composer.addPass( effect1 );

    const rGBShiftShader = new ShaderPass(RGBShiftShader);
    rGBShiftShader.uniforms['angle'].value = Math.PI / 6;
    rGBShiftShader.uniforms['amount'].value = 0.0005;
    //composer.addPass(rGBShiftShader);

    const dof2 = new BokehPass(scene, camera, {
        focus: 30,
        aperture: 1000,
        maxblur: 0.01,
    });
    //composer.addPass(dof2);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2, 0.5, 0.4);




    const glitchPass = new GlitchPass(648);
    composer.addPass(glitchPass);

    //5s后移除glitchPass
    setTimeout(() => {
        composer.removePass(glitchPass);


        const filmPass = new FilmPass(0.5)
        composer.addPass(filmPass);

        composer.addPass(bloomPass);
        const effect3 = new OutputPass();
        composer.addPass(effect3);
    }, 3500);
}


let isShowingLogo = false;
const showLogoTweenGroup = new Group();
function showLogo() {
    isShowingLogo = true;
    // 将 scene-container 的 index 设置为 1，使得 logo 在最上层
    sceneContainer.style.zIndex = 99;

    const logoTexture = new THREE.TextureLoader().load('src/icon.png');
    const logoMaterial = new THREE.MeshBasicMaterial({ map: logoTexture });
    const logoGeometry = new THREE.PlaneGeometry(1, 1);
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, 0, 16);
    scene.add(logo);

    // 黑色背景，用来遮蔽后面的书架
    const bgGeometry = new THREE.PlaneGeometry(81.92 / 2, 25.76 / 2);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.set(0, 0, 15);
    scene.add(bg);

    // 增加环境光照
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    // 设置相机位置
    camera.position.z = 20;

    // logo 从远端旋转飞到屏幕中央
    const logoTween = new Tween({ z: 21 }).to({ z: 16 }, 2000).easing(Easing.Quadratic.Out).onUpdate((object) => {
        logo.position.z = object.z;
    }).delay(1000).start();

    const logoRotateTween = new Tween({ x: 0, y: -3, z: 0 }).to({ x: 0, y: 0, z: 0 }, 2000).easing(Easing.Quadratic.Out).onUpdate((object) => {
        logo.rotation.x = object.x;
        logo.rotation.y = object.y;
        logo.rotation.z = object.z;
    }).delay(1000).start();

    showLogoTweenGroup.add(logoTween);
    showLogoTweenGroup.add(logoRotateTween);


    // 5s后镜头回到书架，删除logo和背景
    setTimeout(() => {
        scene.remove(logo);
        scene.remove(bg);
        scene.remove(ambientLight);
        camera.position.z = 10;
        isShowingLogo = false;
        sceneContainer.style.zIndex = -1;
    }, 3500);
}

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x111111, 0, 100);


    // 创建相机
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 0;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    document.getElementById('scene-container').appendChild(renderer.domElement);

    initLight(scene);
    initScene(scene);
    initPostProcessing(scene, camera, renderer);

    showLogo();


    window.addEventListener('resize', onWindowResize, false);
    // window.addEventListener('click', onClick, false);

    animate();
}


let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
function animate() {
    requestAnimationFrame(animate);

    // 更新所有的动画
    tweens.forEach(t => t.update());

    //renderer.render(scene, camera);
    composer.render();

    if (isShowingLogo) {
        showLogoTweenGroup.update();
        return;
    }


    let str = `state of tapes: `;
    // 更新所有的磁带盒
    tapeManager.update();
    //console.log(str);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick() {
    const currentIndex = tapeManager.currentIndex;
    console.log(`[${new Date().toLocaleTimeString()}] click tape ${currentIndex}`);
    tapeManager.onClick();
}

function nextTape() {
    console.log(`click next, currentIndex: ${tapeManager.currentIndex} of ${tapeManager.tapes.length}`);
    tapeManager.RollTape(1);
}

function prevTape() {
    console.log(`click prev, currentIndex: ${tapeManager.currentIndex} of ${tapeManager.tapes.length}`);
    tapeManager.RollTape(-1);
}

// 按钮点击事件
document.getElementById('next-btn').addEventListener('click', nextTape);
document.getElementById('prev-btn').addEventListener('click', prevTape);

// 鼠标滚动时，切换磁带
document.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
        nextTape();
    } else {
        prevTape();
    }
}
);

document.addEventListener('mousedown', (event) => {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
});

document.addEventListener('mouseup', (event) => {
    mouseDown = false;

    if (event.clientX === lastMouseX && event.clientY === lastMouseY) {
        onClick();
    }
});

document.addEventListener('mousemove', (event) => {
    if (mouseDown) {
        const currentMouseX = event.clientX;
        const deltaX = currentMouseX - lastMouseX;

        if (Math.abs(deltaX) > 40) { // 只有滑动超过50像素才会切换到下一个
            if (deltaX < 0) {
                nextTape();
            } else if (deltaX > 0) {
                prevTape();
            }
            lastMouseX = currentMouseX;
        }
    }
});

document.querySelectorAll(".button-svg").forEach((btn) => {
    // 创建一个svg元素
    const svgContainer = document.createElement('div');
    svgContainer.style.height = '10vh';

    svgContainer.innerHTML = `
<svg height="100%" width="100%" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" version="1.1" fill="#000000">
    <g fill="white">
        <path d="m388.07016,240.917l-157.66878,-234.666c-2.68014,-4.011 -6.32108,-6.251 -10.13401,-6.251l-71.66708,0c-5.79096,0 -11.03702,5.184 -13.24416,13.163c-2.22192,7.979 -0.98901,17.152 3.11015,23.253l147.53477,219.584l-147.53477,219.584c-4.09916,6.101 -5.33206,15.275 -3.11015,23.253c2.20714,7.979 7.4532,13.163 13.24416,13.163l71.66775,0c3.81294,0 7.4532,-2.24 10.13401,-6.251l157.66878,-234.667c5.6035,-8.341 5.6035,-21.823 -0.00067,-30.165z"/>
    </g>
</svg>`;

{/* <svg fill="#000000" height="100%" width="100%" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512" xml:space="preserve">
        <g fill="white">
            		<path d="M441.749,240.917L207.082,6.251C203.093,2.24,197.674,0,191.999,0H85.333c-8.619,0-16.427,5.184-19.712,13.163
			c-3.307,7.979-1.472,17.152,4.629,23.253L289.834,256L70.25,475.584c-6.101,6.101-7.936,15.275-4.629,23.253
			C68.906,506.816,76.714,512,85.333,512H192c5.675,0,11.093-2.24,15.083-6.251L441.75,271.082
			C450.09,262.741,450.09,249.259,441.749,240.917z"/>
        </g>
</svg> */}
    btn.appendChild(svgContainer);

    btn.addEventListener('mouseover', (e) => {
        const svg = btn.querySelector('g');
        svg.style.fill = 'gray';
    }
    );

    btn.addEventListener('mouseout', (e) => {
        const svg = btn.querySelector('g');
        svg.style.fill = 'white';
    }
    );

    btn.addEventListener('mousedown', (e) => {
        const svg = btn.querySelector('g');
        svg.style.fill = 'gray';
    });

    btn.addEventListener('mouseup', (e) => {
        const svg = btn.querySelector('g');
        //闪烁一下荧光绿
        svg.style.fill = '#94ad00';
        setTimeout(() => {
            svg.style.fill = 'white';
        }, 200);

        //debug
        console.log(`click ${btn.id}`);
    });
});



//-==============================程序入口==============================
init();

