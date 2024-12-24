<template>
    <s-dialog id="add-preset-dialog" ref="componentRef">
        <div slot="headline" class="font-hongmeng">
            <p data-translate-key="ask-preset-name">请输入预设名称</p>
            <div class="OO-setting-bar">
                <h3>预设名称</h3>
                <s-text-field v-model="presetName" placeholder="请输入预设名称" id="preset-name">

                </s-text-field>
            </div>

            <div style="">
            </div>
        </div>
        <s-button slot="action" type="text" id="dialog-cancel" data-translate-key="cancel">取消</s-button>
        <s-button slot="action" type="text" id="preset-add-confirm" data-translate-key="confirm"
            @click="handleAddPreset">确认</s-button>
    </s-dialog>
</template>

<script setup>
import { onMounted, ref, useTemplateRef } from 'vue'
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


const componentRef = useTemplateRef("componentRef");
onMounted(() => {
    const editModInfoDialogStyle = document.createElement('style');
    editModInfoDialogStyle.innerHTML = `
    .wrapper.show .scrim {
      background:
        radial-gradient(black 15%, transparent 16%) 0 0,
        radial-gradient(black 15%, transparent 16%) 8px 8px,
        radial-gradient(rgba(255, 255, 255, .1) 15%, transparent 20%) 0 1px,
        radial-gradient(rgba(255, 255, 255, .1) 15%, transparent 20%) 8px 9px !important;
    background-color: #282828 !important;
    background-size: 16px 16px !important;
    opacity: 0.9 !important;
filter: blur(1px) !important;
backdrop-filter: blur(0px) !important;

    }
    .container {
      width: 100% !important;
      max-width: 100% !important;
      border-radius: 0 !important;
      height: fit-content !important;
      min-height: 500px !important;
      overflow: hidden !important;
      flex:1;
      padding-bottom: 30px;
    }
    .action {
      display: none !important;
    }
    s-scroll-view{
      display: none;
    }    
        `;
    // editModInfoDialog.shadowRoot.appendChild(editModInfoDialogStyle);
    console.log(componentRef.value);
    componentRef.value.shadowRoot.appendChild(editModInfoDialogStyle);

});
</script>

<style scoped>
p {
    margin: 10px;
}
</style>