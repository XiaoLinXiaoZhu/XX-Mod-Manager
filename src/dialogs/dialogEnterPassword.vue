<!-- -用于获取压缩包的解压密码的对话框 -->
<template>
    <dialogTemplate id="dialog-enter-password" type="block">
        <template v-slot:content>
            <p>{{ $t('dialogEnterPassword.title') }}</p>
            <settingBar :data="data"></settingBar>
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
import settingBar from '../components/settingBar.vue';
import IManager from '../../electron/IManager';
const iManager = new IManager();

// data 的格式为
// {
//     name: 'ifAblePlugin',
//     data: true,
//     type: 'boolean',
//     displayName: 'If Able Plugin',
//     description: 'If true, the plugin will be enabled',
//     t_displayName:{
//         zh_cn:'是否启用插件',
//         en:'Enable Plugin'
//     },
//     t_description:{
//         zh_cn:'如果为真，插件将被启用',
//         en:'If true, the plugin will be enabled'
//     },
//     onChange: (value) => {
//         console.log('ifAblePlugin changed:', value);
//     }
// }
const data = {
    name: 'password',
    data: '',
    type: 'string',
    displayName: 'Password',
    t_displayName: {
        zh_cn: '密码',
        en: 'Password'
    },
    onChange: (value) => {
        console.log('password changed:', value);
        data.data = value;
    }
}

function handleCancel() {
    iManager.dismissDialog('dialog-enter-password');
    data.data = '';
}

function handleConfirm() {
    console.log('confirm password:', data.data);
    iManager.dismissDialog('dialog-enter-password');
    iManager.snack('confirm password'+data.data);
    iManager.archivePassword = data.data;
    data.data = '';
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