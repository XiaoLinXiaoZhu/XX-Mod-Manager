<template>
    <div class="css-proxy" style="display: none;"></div>
</template>

<script setup>
import backButtonImage from '../assets/backButton.png';
import backgroundImage from '../assets/background.png';
import IManager from '../../electron/IManager';
const iManager = new IManager();
import { watch } from 'vue';


iManager.waitInit().then(() => {
    iManager.on('themeChange', (theme) => {
        const appContainer = document.querySelector('#app-container');
        if (!appContainer) return;
        appContainer.setAttribute('theme', theme);
        
        if (theme === 'dark') {
            appContainer.style.backgroundImage = `url(${backgroundImage})`;
        } else {
            appContainer.style.backgroundImage = 'none';
        }
    });

    iManager.trigger('themeChange', iManager.config.theme);

    
});

</script>