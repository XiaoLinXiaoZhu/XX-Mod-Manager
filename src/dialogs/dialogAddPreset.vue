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
        <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng">取消</s-button>
        <s-button slot="action" type="text" id="preset-add-confirm" class="OO-button font-hongmeng"
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
        opacity: 1 !important;
        filter: blur(0px) !important;
        backdrop-filter: blur(2px) !important;
    }
    .wrapper.show .scrim::after {
      content: "" !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;

      background-color: #00000000 !important;
      background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(90,90,90,.3) 5px, rgba(90,90,90,.3) 10px) !important;
    }
    .container {
      width: 100% !important;
      max-width: 100% !important;

      height: fit-content !important;
      min-height: 50px !important;

      border-radius: 0 !important;
      
      overflow: visible !important;
      flex:1;
      padding-bottom: 50px;

      align-items: center !important;
    }
    
    .container::before {
      content: "" !important;
      position: absolute !important;
      top: 0 !important;
      left: -5% !important;
      width: 110% !important;
      height: 100% !important;
        opacity: 0.4 !important;
      background-color: var(--s-color-surface-container-high) !important;
      box-shadow:inset 0 0 0px 6px var(--s-color-outline-variant), inset 1px 1px 0px 9px rgba(0, 0, 0, 0.2) !important;

        background-color:#001;
        background-image: radial-gradient(black 15%, transparent 16%),
        radial-gradient(black 15%, transparent 16%);
        background-size: 10px 10px;
        background-position: 0 0, 5px 5px;

    }

    .action {
      position: absolute !important;
      bottom: -30px !important;
      margin: 0 100px !important;
      justify-content: center !important;
      width: 100% !important;
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

div[slot="headline"] {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 100%;
    max-width: 500px;
}

s-button[slot="action"] {
    margin-left: 20px;
    margin-right: 20px;
    color: var(--s-color-on-surface);
}
</style>