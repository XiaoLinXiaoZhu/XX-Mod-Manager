<template>
    <dialogTemplate id="add-preset-dialog">
        <template v-slot:content>
            <p>{{ $t('presetDialog.requireName') }}</p>
            <div class="OO-setting-bar">
                <h3>{{ $t('presetDialog.name') }}</h3>
                <s-text-field v-model="presetName" :placeholder="$t('presetDialog.requireName')" id="preset-name">

                </s-text-field>
            </div>
        </template>
        <template v-slot:action>
            <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng" style="    margin-left: 20px;
    margin-right: 20px;">
                <p>{{ $t('buttons.cancel') }}</p>
            </s-button>
            <s-button slot="action" type="text" id="preset-add-confirm" @click="handleAddPreset"
                class="OO-button font-hongmeng OO-color-gradient" style="color: var(--s-color-dark-surface);margin-left: 20px;
    margin-right: 20px;">
                <p>{{ $t('buttons.confirm') }}</p>
            </s-button>
        </template>
    </dialogTemplate>


</template>

<script setup>
import { ref } from 'vue'
import dialogTemplate from './dialogTemplate.vue';

import IManager from '../../electron/IManager';
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
            iManager.snack(t('presetDialog.nameExist'), 'error');
        }
        else {
            //debug
            console.log("presetName is not exists");
            iManager.addPreset(presetName.value);
            iManager.snack(t('presetDialog.success'), 'info');
        }
    }
    else {
        //debug
        console.log("presetName is empty");
        iManager.snack(t('presetDialog.emptyName'), 'error');
    }
    //清空输入框
    presetName.value = '';
}

</script>