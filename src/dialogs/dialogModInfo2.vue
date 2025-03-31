<template>
  <DialogTemplate id="edit-mod-dialog" ref="edit-mod-dialog" maxWidth="1000px">
    <template v-slot:content>
      <h3 style="height: fit-content;margin: -5px 30px 5px 30px;font-size: 26px;z-index:1" class="font-hongmeng">
        {{ $t('editDialog.edit-mod-info') }}
      </h3>

      <div id="edit-mod-info-dialog-container"
        style="display: flex;flex-direction: column;align-items: center;width: 100%;  font-size: 15px;z-index:1">
        <div id="edit-mod-info-dialog-top" style="display: flex;width: 100%;">
          <!-- 展示mod当前名称、图片 -->
          <div class="OO-box"
            style="width: 280px;min-width: 0;display:flex;flex-direction: column;align-items: center;flex-wrap: nowrap;justify-content: flex-start;"
            id="edit-mod-info-left">
            <div class="OO-box OO-shade-box"
              style="width: calc(100% - 40px);padding: 10px 20px;margin:0;border-radius: 15px;">
              <h3 id="editDialog-mod-info-name" style="white-space:normal;word-break:keep-all;height: fit-content;">
                {{ tempModInfo ? tempModInfo.name : "no name" }}</h3>
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
                <horizontalScrollBar class="hotkey-container">
                  <p
                    style="line-height: 1.2; word-wrap: break-word; max-width: 120px; overflow-wrap: break-word; white-space: normal;">
                    {{ $t('editDialog.mod-info-name-tip') }} </p>
                </horizontalScrollBar>
              </s-tooltip>

              <!-- <s-button>
                <p id="edit-mod-name"> {{ tempModInfo ? tempModInfo.name : "no name" }} </p>
              </s-button> -->
              <s-text-field :value="tempModInfo.name" @change="handleModNameChange" id="edit-mod-name" />
            </div>

            <!-- -mod角色 -->
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-character') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-character-tip') }} </p>
              </s-tooltip>
              <s-text-field :value="tempModInfo.character" @input="tempModInfo.character = $event.target.value" />
            </div>

            <!-- -mod链接 -->
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger"> {{ $t('editDialog.mod-info-url') }} </h3>
                <p style="line-height: 1.2;">
                  {{ $t('editDialog.mod-info-url-tip') }} </p>
              </s-tooltip>
              <div class="OO-s-text-field-container">
                <s-text-field :value="tempModInfo.url" @input="tempModInfo.url = $event.target.value" />
                <s-icon-button type="filled" slot="start" class="OO-icon-button"
                  @click="iManager.openUrl(tempModInfo.url)">
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
                <horizontalScrollBar class="OO-box OO-shade-box hotkey-container" scrollSpeed=0.5 dragSpeed=1>
                  <div style="display: flex;flex-direction: row;flex-wrap: nowrap;padding: 0 10px;">
                    <div v-for="(hotkey, index) in tempModInfo.hotkeys" :key="index">
                      <s-tooltip>
                        <div
                          style="margin: 0px 3px;height: 35px;padding: 20px 15px 20px 15px;transform: skew(-20deg);border-radius: 0;min-width: 50px"
                          slot="trigger" class="OO-button">
                          <p style="transform: skew(20deg);">
                            {{ hotkey.key }}
                          </p>
                        </div>
                        <p style="line-height: 1.2;">
                          {{ hotkey.description }} </p>
                      </s-tooltip>
                    </div>
                  </div>
                </horizontalScrollBar>
                <s-popup align="left">
                  <s-tooltip slot="trigger" style="position: relative;left: 15px;">
                    <s-icon-button icon="image" class="OO-icon-button"
                      style="border: 5px solid var(--s-color-surface-container-high);transform: scale(1);"
                      slot="trigger">
                      <s-icon type="chevron_down"></s-icon>
                    </s-icon-button>

                    <p style="line-height: 1.2;">
                      {{ $t('editDialog.edit-mod-hotkeys') }} </p>
                  </s-tooltip>

                  <div class="OO-box OO-shade-box" style="width: 70vb;height: fit-content;overflow: hidden;">
                    <div v-for="(hotkey, index) in tempModInfo.hotkeys" :key="index" class="hotkey-item OO-setting-bar">
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
                multiLine="true" :value="tempModInfo.description" @input="tempModInfo.description = $event.target.value"
                id="edit-mod-description"></s-text-field>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-slot:action>
      <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng" @click="handleCancel"
        style="margin-left: 20px;
    margin-right: 20px;">
        <p>{{ $t('buttons.cancel') }}</p>
      </s-button>
      <s-button slot="action" type="text" id="preset-add-confirm" class="OO-button font-hongmeng OO-color-gradient"
        @click="handleSave" style="color: var(--s-color-surface);margin-left: 20px;
    margin-right: 20px;">
        <p>{{ $t('buttons.save') }}</p>
      </s-button>
    </template>

  </DialogTemplate>

  <!-- -取消时再次询问是否保存 -->
  <!-- -提示是否保存更改 -->
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
import IManager from '../../electron/IManager';
import DialogTemplate from './dialogTemplate.vue';
import horizontalScrollBar from '../components/horizontalScrollBar.vue';
import { ModData } from '../../core/ModHelper';
import { TranslatedText } from '../../helper/Language';
const iManager = new IManager();

// 参数为 字符串类型的 mod，之后通过 iManager.getModInfo(mod) 获取 mod 信息
const props = defineProps({
  mod: ModData,
});

let saved = false;

// modInfo 为 mod 信息，用于储存临时修改的 mod 信息，最后保存时再将其赋值给 props.mod
const tempModInfo = ref(ModData.fromJson({
  name: 'unknown',
  character: '',
  url: '',
  hotkeys: [],
  description: '',
  preview: '',
}));

const editModInfoDialog = useTemplateRef('edit-mod-dialog');
const img = ref(null);

// 需要显示的mod发生变化时，更新 临时mod信息
watch(() => props.mod, async (newVal) => {
  console.log('[dialogModInfo2] watch props.mod changed', newVal.name);
  // 检查newVal 的类型，应当为 ModData 类型，如果不是则尝试转化为 ModData 类型
  if (!(newVal instanceof ModData)) {
    console.error('mod is not a ModData instance');
    return;
  }
  if (newVal) {
    // 显式销毁之前的 tempModInfo
    tempModInfo?.value?.destroy();
    tempModInfo.value = newVal.copy();
    img.value = await newVal.getPreviewBase64(true);
  }
});

const handleModNameChange = (event) => {
  //debug
  console.log(`input mod name`,event.target.value,`of`,tempModInfo.value.id);
  tempModInfo.value.name = event.target.value;

  // 检查 mod 名称是否为空，如果为空则设置为默认值
  if (tempModInfo.value.name === '') {
    tempModInfo.value.name = props.mod.name;
    const tt = new TranslatedText(`Cannot set mod name to empty`, `无法将 mod 名称设置为空`);
    iManager.t_snack(tt, `error`);
  }

  // 检查 mod 名称是否重复，如果重复则设置为默认值
  if (tempModInfo.value.name !== props.mod.name) {
    const modList = iManager.data.modList;
    const modNameList = modList.map(mod => mod.name);
    if (modNameList.includes(tempModInfo.value.name)) {
      tempModInfo.value.name = props.mod.name;
      const tt = new TranslatedText(`Mod name already exists`, `mod 名称已存在`);
      iManager.t_snack(tt, `error`);
    }
  }
}

const handleHotkeyInput = (hotkey, value) => {
  //debug
  console.log(`input hot key`,hotkey,value,`to`,tempModInfo.value.id);
  if (value === '') {
    // 删除快捷键
    const index = tempModInfo.value.hotkeys.indexOf(hotkey);
    tempModInfo.value.hotkeys.splice(index, 1);
    return;
  }
  hotkey.key = value;
}

const addNewHotkeyByDescription = (description) => {
  console.log(`add hot key`,description,`to`,tempModInfo.value.id);
  tempModInfo.value.addHotkey("", description);
}

const addNewHotkeyByHotkey = (key) => {
  console.log(`add hot key`,key,`to`,tempModInfo.value.id);
  tempModInfo.value.addHotkey(key, "");
}

const handleSelectImage = async () => {
  const imgPath = await iManager.getFilePath('preview', 'image',tempModInfo.value.preview);
  if (imgPath) {
    const imgBase64 = await iManager.getImageBase64(imgPath);
    img.value = "data:image/png;base64," + imgBase64;
    tempModInfo.value.preview = imgPath;
  }
}

const handleCancel = async () => {
  tempModInfo.value = props.mod.copy();
  img.value = await props.mod.getPreviewBase64(true);
}

const handleSave = () => {
  //debug
  const ifEqual = props.mod.equals(tempModInfo.value);
  console.log('saved', saved,`equals`,ifEqual);
  // 保存修改的 mod 信息

  if (ifEqual) {
    // editModInfoDialog.value.$el.dismiss();
    // 点击按钮自动会关闭dialog，这里如果手动关闭会导致再次触发dismiss事件，导致不必要的性能消耗
    return;
  }

  // 处理 图片 更改
  let needChangePreview = false;
  if (props.mod.preview !== tempModInfo.value.preview) {
    needChangePreview = true;
  }

  // 保存修改的 mod 信息
  props.mod.editModInfo(tempModInfo.value);

  if (needChangePreview) {
    props.mod.setPreviewByPath(tempModInfo.value.preview);
  }
  // 如果是通过粘贴操作更改的预览图片，则保存到本地
  if (changdPreviewByPaste) {
    props.mod.setPreviewByBase64(img.value);
  }

  tempModInfo.value = props.mod.copy();
  saved = true;

  props.mod.saveModInfo();

  props.mod.triggerChanged();
  props.mod.triggerCurrentModChanged();
}

let changdPreviewByPaste = false;
onMounted(() => {
  // 监听 dialog 的 dismiss 事件，如果未保存则弹出保存更改的 dialog
  editModInfoDialog.value.$el.addEventListener('dismiss', () => {
    console.log('dismiss','props.mod',props.mod,'tempModInfo',tempModInfo.value,saved);
    if (!saved && !props.mod.equals(tempModInfo.value)) {
      iManager.showDialog('save-change-dialog');
    }
    saved = false;
  });

  // 监听 dialog 的 show 事件，再同步一次 tempModInfo
  editModInfoDialog.value.$el.addEventListener('show',async () => {
    tempModInfo.value = props.mod.copy();
    img.value = await props.mod.getPreviewBase64(true);
  });

  // 监听粘贴操作，如果粘贴的是图片则将其设置为 mod 的预览图片
  window.addEventListener('paste', async (event) => {
    //debug
    console.log('paste',event.clipboardData);
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = async (e) => {
          const imgBase64 = e.target.result;
          img.value = imgBase64;
          // tempModInfo.value.preview = imgBase64;
          changdPreviewByPaste = true;
        };
        reader.readAsDataURL(blob);
      }
    }
  });
});
</script>


<style scoped>
.hotkey-container {
  overflow-y: hidden;
  overflow-x: auto;
  height: 35px;
  align-items: center;
  max-width: 450px;
  padding: 0 10px;
  border-radius: 20px;
}
</style>