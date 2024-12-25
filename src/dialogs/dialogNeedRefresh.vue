<!-- 提示程序需要刷新以应用更改 -->
<template>
    <dialogTemplate id="dialog-need-refresh" type="block">
        <template v-slot:content>
            <h1 data-translate-key="ask-preset-name" style="z-index: 1;">{{ $t('message.requireRefresh') }}</h1>
        </template>
        <template v-slot:action>
            <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng OO-color-gradient" @click="refresh">
                <p style="color: var(--s-color-dark-surface);">{{ $t('buttons.refresh') }}</p>
            </s-button>
        </template>
    </dialogTemplate>
</template>

<script setup>
import dialogTemplate from './dialogTemplate.vue';
const { ipcRenderer } = require('electron');

const refresh = () => {
    //debug
    console.log('refresh');
    ipcRenderer.send('refresh-main-window');
};
</script>