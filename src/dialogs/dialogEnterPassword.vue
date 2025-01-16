<!-- -用于获取压缩包的解压密码的对话框 -->
<template>
    <dialogTemplate id="dialog-enter-password" type="block">
        <template v-slot:content>
            <p>{{ $t('dialogEnterPassword.title') }}</p>
            <div class="OO-setting-bar">
                <h3>{{ $t('presetDialog.name') }}</h3>
                <s-text-field v-model="getPassword" :placeholder="$t('presetDialog.requireName')" id="preset-name">

                </s-text-field>
            </div>
        </template>
        <template v-slot:action>
            <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng" style="margin-left: 20px;
    margin-right: 20px;" @click="handleCancel">
                <p>{{ $t('buttons.cancel') }}</p>
            </s-button>
            <s-button slot="action" type="text" id="preset-add-confirm" @click="handleConfirm"
                class="OO-button font-hongmeng OO-color-gradient" style="color: var(--s-color-dark-surface);margin-left: 20px;
    margin-right: 20px;">
                <p>{{ $t('buttons.confirm') }}</p>
            </s-button>
        </template>
    </dialogTemplate>
</template>

<script setup>
import dialogTemplate from './dialogTemplate.vue';
import { ref, onMounted } from 'vue';


import IManager from '../../electron/IManager';
const iManager = new IManager();

const getPassword = ref('');

// 导入 i18n 的 t 函数
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


function handleCancel() {
    iManager.dismissDialog('dialog-enter-password');
    iManager.dismissDialog('loading-dialog');
    iManager.snack(t('dialogEnterPassword.cancel'), 'error');

    getPassword.value = '';
}

function handleConfirm() {
    console.log('confirm password:', getPassword.value);
    iManager.dismissDialog('dialog-enter-password');
    iManager.snack(t('dialogEnterPassword.confirm') + getPassword.value, 'info');
    iManager.archivePassword = getPassword.value;
    
    getPassword.value = '';
}


//测试用
onMounted(() => {
    console.log('dialog-enter-password mounted');
    // iManager.waitInit().then(() => {
    //     iManager.showDialog('dialog-enter-password');
    // });
})

</script>

<style scoped>
.container {
    width: 100%;
    max-width: 500px;
}
</style>