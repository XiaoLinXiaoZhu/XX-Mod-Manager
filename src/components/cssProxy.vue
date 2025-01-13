<template>
    <div class="css-proxy" style="display: none;"></div>
</template>

<script setup>
import backgroundImage from '../assets/background.png';
import { waitInitIManager } from '../../electron/IManager';

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


waitInitIManager().then((iManager) =>{
    iManager.on('themeChange', changeTheme);
    // changeTheme(iManager.config.theme);
    // iManager.trigger('themeChange', iManager.config.theme);
    // setTimeout(()=>{iManager.on('themeChange', changeTheme);},1);
});
</script>