<template>
    <dialogTemplate id="add-preset-dialog">
        <template v-slot:content>
            <p data-translate-key="ask-preset-name">{{ $t('presetDialog.requireName') }}</p>
            <div class="OO-setting-bar">
                <h3>{{ $t('presetDialog.name') }}</h3>
                <s-text-field v-model="presetName" :placeholder="$t('presetDialog.requireName')" id="preset-name">

                </s-text-field>
            </div>
        </template>
        <template v-slot:action>
            <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng" style="    margin-left: 20px;
    margin-right: 20px;">{{ $t('buttons.cancel') }}</s-button>
            <s-button slot="action" type="text" id="preset-add-confirm" class="OO-button font-hongmeng" style="    margin-left: 20px;
    margin-right: 20px;" @click="handleAddPreset">{{ $t('buttons.confirm') }}</s-button>
        </template>
    </dialogTemplate>


</template>

<script setup>
import { onMounted, ref, useTemplateRef } from 'vue'
import IManager from '../../electron/IManager';
import dialogTemplate from './dialogTemplate.vue';
const { ipcRenderer } = require('electron');
const iManager = new IManager();

const presetName = ref('');

// 导入 i18n 的 t 函数
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

function handleAddPreset() {
    console.log('add preset', presetName.value);
    if (presetName.value) {
        // 检查 是否 已经存在
        const presetList = iManager.data.presetList;
        if (presetList.includes(presetName.value)) {
            //debug
            console.log("presetName already exists");
            ipcRenderer.send('snack', t('presetDialog.nameExist'), 'error');
        }
        else {
            //debug
            console.log("presetName is not exists");
            iManager.addPreset(presetName.value);
            iManager.loadConfig();
            ipcRenderer.send('snack', t('presetDialog.success'), 'info');
        }
    }
    else {
        //debug
        console.log("presetName is empty");
        ipcRenderer.send('snack', t('presetDialog.emptyName'), 'error');
    }
    //清空输入框
    presetName.value = '';
}

</script>