import * as THREE from '../node_modules/three/build/three.module.js';
import { Tween, Easing, Group } from '../node_modules/@tweenjs/tween.js/dist/tween.esm.js';


export function createBulbLight(color, intensity, distance = 0, decay = 2 ) {
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);
    const bulbLight = new THREE.PointLight(color, intensity, distance, decay);

    const bulbMat = new THREE.MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    });
    //bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 0, 0);
    bulbLight.castShadow = true;

    return bulbLight;
}