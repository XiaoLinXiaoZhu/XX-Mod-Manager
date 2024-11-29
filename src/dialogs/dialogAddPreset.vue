<template>
    <s-dialog id="add-preset-dialog">
      <div slot="headline" class="font-hongmeng">
        <p data-translate-key="ask-preset-name">请输入预设名称</p>
        <div class="OO-setting-bar">
            <h3>预设名称</h3>
            <s-text-field v-model="presetName" placeholder="请输入预设名称" id="preset-name">

            </s-text-field>
        </div>
      </div>
      <s-button slot="action" type="text" id="dialog-cancel" data-translate-key="cancel">取消</s-button>
      <s-button slot="action" type="text" id="preset-add-confirm" data-translate-key="confirm" @click="handleAddPreset">确认</s-button>
    </s-dialog>
</template>

<script setup>
import { ref } from 'vue'
import IManager from '../../electron/IManager';
const { ipcRenderer } = require('electron');
const iManager = new IManager();

const presetName = ref('');


function handleAddPreset() {
    console.log('add preset', presetName.value);
    if (presetName.value) {
        // 检查 是否 已经存在
        const presetList = iManager.data.presetList;
        if (presetList.includes(presetName.value)) {
            //debug
            console.log("presetName already exists");
            ipcRenderer.send('snack', '预设名称已存在', 'error');
        }
        else {
            //debug
            console.log("presetName is not exists");
            iManager.addPreset(presetName.value);
            iManager.loadConfig();
            ipcRenderer.send('snack', '预设添加成功', 'info');
        }
    }
    else {
        //debug
        console.log("presetName is empty");
        ipcRenderer.send('snack', '预设名称不能为空', 'error');
    }
    //清空输入框
    presetName.value = '';
}
</script>

<style scoped>
p{
    margin: 10px;
}

</style>