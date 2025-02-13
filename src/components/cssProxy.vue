<template>
    <div class="css-proxy" style="display: none;"></div>
</template>

<script setup>
import backgroundImage from '../assets/background.png';
import { EventSystem } from '../../helper/EventSystem';

let currentTheme = "";
const changeTheme = (theme) =>{
    if (currentTheme == theme) return;
    currentTheme = theme

    const appContainer = document.querySelector('#app-container');
    if (!appContainer) return;
    
    appContainer.setAttribute('theme', theme);
    
    if (theme === 'dark') {
        appContainer.style.backgroundImage = `url(${backgroundImage})`;
    } else {
        appContainer.style.backgroundImage = 'none';
    }
}

EventSystem.on('themeChange', changeTheme);
</script>