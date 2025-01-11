<template>
  <DialogTemplate id="edit-mod-dialog" ref="edit-mod-dialog" maxWidth="1000px">
    <template v-slot:content>
      <h3 style="height: fit-content;margin: -5px 30px 5px 30px;font-size: 26px;z-index:1" class="font-hongmeng">
        {{ $t('editDialog.edit-mod-info') }}
      </h3>

      <div id="edit-mod-info-dialog-container" style="display: flex;flex-direction: column;align-items: center;width: 100%;  font-size: 15px;z-index:1">
        <div id="edit-mod-info-dialog-top" style="display: flex;width: 100%;">
          <!-- 展示mod当前名称、图片 -->
          <div class="OO-box"
            style="width: 280px;min-width: 0;display:flex;flex-direction: column;align-items: center;flex-wrap: nowrap;justify-content: flex-start;"
            id="edit-mod-info-left">
            <div class="OO-box OO-shade-box"
              style="width: calc(100% - 40px);padding: 10px 20px;margin:0;border-radius: 15px;">
              <h3 id="editDialog-mod-info-name" style="white-space:normal;word-break:keep-all;height: fit-content;">
                {{ modInfo ? modInfo.name : "no name" }}</h3>
            </div>
            <p id="editDialog-mod-info-character"
              style="margin-top: 2px;font-size: small;color: gray;height: fit-content;width: fit-content;margin-bottom: 0;padding-bottom: 10px;">
              {{ props.mod ? props.mod.character : "no character" }}</p>

            <div id="img-container" style="width: 280px;height: 224px;border-radius: 0 30px;overflow: hidden;">
              <img id="editDialog-mod-info-image"
                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;" :src="img" />
            </div>

            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-image') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-image-tip') }} </p>
              </s-tooltip>

              <s-tooltip style="position: relative; left: 15px;">
                <s-icon-button icon="image" @click="handleSelectImage" class="OO-icon-button"
                  style="border: 5px solid var(--s-color-surface-container-high);transform: scale(1);" slot="trigger">
                  <s-icon type="add"></s-icon>
                </s-icon-button>

                <p style="line-height: 1.2;">
                  {{ $t('editDialog.edit-mod-image-preview') }} </p>
              </s-tooltip>
            </div>
          </div>

          <div style="height: 100%;margin-left: 1%;flex: 1;" id="edit-mod-info-content" class="OO-box">

            <!-- -mod名称 -->
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-name') }} </h3>
                <p
                  style="line-height: 1.2; word-wrap: break-word; max-width: 120px; overflow-wrap: break-word; white-space: normal;">
                  {{ $t('editDialog.mod-info-name-tip') }} </p>
              </s-tooltip>

              <s-button>
                <p id="edit-mod-name"> {{ modInfo ? modInfo.name : "no name" }} </p>
              </s-button>
            </div>

            <!-- -mod角色 -->
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-character') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-character-tip') }} </p>
              </s-tooltip>
              <s-text-field :value="modInfo.character" @input="modInfo.character = $event.target.value" />
            </div>

            <!-- -mod链接 -->
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-url') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-url-tip') }} </p>
              </s-tooltip>
              <div class="OO-s-text-field-container">
                <s-text-field :value="modInfo.url" @input="modInfo.url = $event.target.value" />
                <s-icon-button type="filled" slot="start" class="OO-icon-button" @click="iManager.openUrl(modInfo.url)">
                  <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                      <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                    </svg></s-icon>
                </s-icon-button>
              </div>
            </div>

            <!-- -mod快捷键 -->
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-hotkeys') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-hotkeys-tip') }} </p>
              </s-tooltip>

              <div style="display: flex;flex-direction: row;align-items: center;justify-content: space-between;">
                <div v-for="(hotkey, index) in modInfo.hotkeys" :key="index">
                  <s-tooltip>
                    <s-chip style="margin: 0px 1px;height: 35px;" slot="trigger">
                      {{ hotkey.key }}
                    </s-chip>

                    <p style="line-height: 1.2;">
                      {{ hotkey.description }} </p>
                  </s-tooltip>
                </div>
                <s-popup align="left">
                  <s-tooltip slot="trigger" style="position: relative;left: 15px;">
                    <s-icon-button icon="image" class="OO-icon-button"
                      style="border: 5px solid var(--s-color-surface-container-high);transform: scale(1);" slot="trigger">
                      <s-icon type="chevron_down"></s-icon>
                    </s-icon-button>

                    <p style="line-height: 1.2;">
                      {{ $t('editDialog.edit-mod-hotkeys') }} </p>
                  </s-tooltip>

                  <div class="OO-box OO-shade-box" style="width: 70vb;height: fit-content;overflow: hidden;">
                    <div v-for="(hotkey, index) in modInfo.hotkeys" :key="index" class="hotkey-item OO-setting-bar">
                      <s-text-field :value="hotkey.description" @input="hotkey.description = $event.target.value"
                        style="left: 5px;" />
                      <s-text-field :value="hotkey.key" @change="handleHotkeyInput(hotkey, $event.target.value)" />
                    </div>
                    <div class="hotkey-item OO-setting-bar">

                      <s-text-field
                        @change="(event) => { addNewHotkeyByDescription(event.target.value); event.target.value = ''; }"
                        style="left: 5px;" :placeholder="$t('editDialog.mod-info-hotkeys-description')" />
                      <s-text-field
                        @change="(event) => { addNewHotkeyByHotkey(event.target.value); event.target.value = ''; }"
                        :placeholder="$t('editDialog.mod-info-hotkeys-hotkey')" />
                    </div>
                  </div>

                </s-popup>
              </div>
            </div>

            <!-- -mod描述 -->
            <div class="OO-setting-bar"
              style="display: flex;flex-direction: column;align-items: flex-start;justify-content: space-between;height:150px;">
              <s-tooltip style="padding:15px 0;">
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-description') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-description-tip') }} </p>
              </s-tooltip>
              <s-text-field class="OO-shade-box"
                style="min-height: calc(100% - 50px);height: 0px;border-radius: 20px;bottom: 5px;top: 45px;left: 5px;right: 5px;max-width: calc(100% - 10px);width: calc(100% - 10px);"
                multiLine="true" :value="modInfo.description" @input="modInfo.description = $event.target.value"
                id="edit-mod-description"></s-text-field>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:action>
      <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng" @click="handleCancel" style="margin-left: 20px;
    margin-right: 20px;"><p>{{ $t('buttons.cancel') }}</p></s-button>
            <s-button slot="action" type="text" id="preset-add-confirm" class="OO-button font-hongmeng OO-color-gradient" @click="handleSave" style="color: var(--s-color-surface);margin-left: 20px;
    margin-right: 20px;"> <p>{{ $t('buttons.save') }}</p></s-button>
    </template>

  </DialogTemplate>

  <!-- -取消时再次询问是否保存 -->
  <!-- -提示是否保存更改 -->
  <!-- <s-dialog id="save-change-dialog">
    <div slot="headline" data-translate-key="save-change"> 检测到未保存的更改 </div>
    <div slot="text">
      <p data-translate-key="dialog-ask-for-save-change"> 是否保存更改？ </p>
    </div>
    <s-button slot="action" type="text" id="save-change-ignore" @click="handleCancel"> {{ $t('editDialog.ignore') }}
    </s-button>
    <s-button slot="action" type="text" id="save-change-confirm" @click="handleSave"> {{ $t('editDialog.save') }}
    </s-button>
  </s-dialog> -->
  <DialogTemplate id="save-change-dialog">
    <template v-slot:content>
      <h2 style="padding: 0;margin: 0;">{{ $t('editDialog.changeNotSave') }}</h2>
      <h3 style="z-index:1">{{ $t('editDialog.ifSaveChange') }}</h3>
    </template>
    <template v-slot:action>
      <s-button slot="action" type="text" id="save-change-ignore" @click="handleCancel"
        style="margin-left: 20px;margin-left: 20px;" class="OO-button">{{ $t('editDialog.ignore') }}</s-button>
      <s-button slot="action" type="text" id="save-change-confirm" @click="handleSave"
        style="margin-left: 20px;margin-left: 20px;color: var(--s-color-on-surface);" class="OO-button">{{
          $t('editDialog.save') }}</s-button>
    </template>
  </DialogTemplate>
</template>

<script setup>
import { ref } from 'vue';
import { defineProps, defineEmits, onMounted, computed, watch, useTemplateRef } from 'vue';
import dialogTemplate from './dialogTemplate.vue';
import IManager from '../../electron/IManager';
import DialogTemplate from './dialogTemplate.vue';
const iManager = new IManager();

// 参数为 字符串类型的 mod，之后通过 iManager.getModInfo(mod) 获取 mod 信息
const props = defineProps({
  mod: Object
});

let saved = false;

// modInfo 为 mod 信息，用于储存临时修改的 mod 信息，最后保存时再将其赋值给 props.mod
const modInfo = ref({
  name: 'unknow',
  character: 'unknow',
  preview: '',
  url: '',
  description: 'unknow',
});
const editModInfoDialog = useTemplateRef('edit-mod-dialog');
const img = ref(null);
watch(() => props.mod, async (newVal) => {
  //debug
  console.log('mod changed', newVal);
  if (newVal) {
    const imgBase64 = await iManager.getImageBase64(newVal.preview);
    // modInfo.value = newVal;
    // 将其转化为 json 再 转化为对象，防止引用传递
    modInfo.value = JSON.parse(JSON.stringify(newVal));
    img.value = "data:image/png;base64," + imgBase64;
  }
});

const handleHotkeyInput = (hotkey, value) => {
  if (value === '') {
    // 删除快捷键
    const index = modInfo.value.hotkeys.indexOf(hotkey);
    modInfo.value.hotkeys.splice(index, 1);
    return;
  }
  hotkey.key = value;
}

const addNewHotkeyByDescription = (description) => {
  if (description === '') {
    return;
  }
  modInfo.value.hotkeys.push({
    key: '',
    description: description
  });
}

const addNewHotkeyByHotkey = (key) => {
  if (key === '') {
    return;
  }
  modInfo.value.hotkeys.push({
    key: key,
    description: ''
  });
}

const handleSelectImage = async () => {
  const imgPath = await iManager.getFilePath('preview', 'image');
  if (imgPath) {
    const imgBase64 = await iManager.getImageBase64(imgPath);
    img.value = "data:image/png;base64," + imgBase64;
    modInfo.value.preview = imgPath;
  }
}

const handleCancel = async () => {
  modInfo.value = JSON.parse(JSON.stringify(props.mod));
  const imgBase64 = await iManager.getImageBase64(modInfo.value.preview);

  img.value = "data:image/png;base64," + imgBase64;
  editModInfoDialog.value.$el.dismiss();
}

const handleSave = () => {
  //debug
  console.log('modInfo.value', modInfo.value);
  // 保存修改的 mod 信息

  if (props.mod == modInfo.value) {
    editModInfoDialog.value.$el.dismiss();
    return;
  }

  // 处理 图片 更改
  if (props.mod.preview !== modInfo.value.preview) {
    // 当图片更改时，将新图片保存到本地 对应的文件夹下，并且将新的路径保存到 modInfo 中
    //debug
    console.log(`change preview of ${modInfo.value.name} to ${modInfo.value.preview}`);
    iManager.changePreview(modInfo.value.name, modInfo.value.preview);
  }
  props.mod = modInfo.value;
  iManager.saveModInfo(modInfo.value);
  saved = true;
  editModInfoDialog.value.$el.dismiss();
}

// onMounted(() => {
//   const editModInfoDialogStyle = document.createElement('style');
//   editModInfoDialogStyle.innerHTML = `
//     .container {
//       width: calc(30% + 400px) !important;
//       min-width: calc(600px) !important;
//       max-width: 900px !important;
//       height: fit-content !important;
//       min-height: 500px !important;
//       overflow: hidden !important;
//       flex:1;
//       padding-bottom: 30px;
//     }
//     .action {
//       display: none !important;
//     }
//     s-scroll-view{
//       display: none;
//     }    
//         `;
//   // editModInfoDialog.shadowRoot.appendChild(editModInfoDialogStyle);
//   editModInfoDialog.value.shadowRoot.appendChild(editModInfoDialogStyle);

//   editModInfoDialog.value.addEventListener('dismiss', async () => {
//     // 如果 modInfo 与 props.mod 不同，则询问是否保存
//     //debug
//     if (saved) {
//       saved = false;
//       return;
//     }
//     console.log('dismiss', JSON.stringify(modInfo.value), JSON.stringify(props.mod));
//     if (JSON.stringify(modInfo.value) !== JSON.stringify(props.mod)) {
//       iManager.showDialog('save-change-dialog');
//     }
//   });
// });


</script>


<style scoped></style>