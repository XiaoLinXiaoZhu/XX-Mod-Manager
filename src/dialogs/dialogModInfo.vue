<template>
  <s-dialog id="edit-mod-dialog" ref="edit-mod-dialog">
    <div slot="headline" class="font-hongmeng">
      <h3 data-translate-key="edit-mod-info" style="height: fit-content;margin: 10px 30px 5px 30px;font-size: 26px;">
        编辑mod信息
      </h3>

      <div id="edit-mod-info-dialog-container" style="display: flex;flex-direction: column;align-items: center;">
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
                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;" alt="Mod Image"
                :src="img" />

            </div>
          </div>

          <div style="height: 100%;margin-left: 1%;flex: 1;" id="edit-mod-info-content" class="OO-box">
            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger" data-translate-key="mod-info-name"> mod名称 </h3>
                <p style="line-height: 1.2; word-wrap: break-word; max-width: 120px; overflow-wrap: break-word; white-space: normal;"
                  data-translate-key="mod-info-name-tip"> Mod名称就是文件夹名称，点击下方按钮前往文件夹处修改 </p>
              </s-tooltip>

              <s-button>
                <p id="edit-mod-name"> {{ modInfo ? modInfo.name : "no name" }} </p>
              </s-button>
            </div>

            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger" data-translate-key="mod-info-character"> 角色 </h3>
                <p style="line-height: 1.2;" data-translate-key="mod-info-character-tip">
                  角色是mod所属的角色当然你也可以将其归为unknow、tools或者mise，它会作为分类的依据 </p>
              </s-tooltip>
              <s-text-field :value="modInfo.character" @input="modInfo.character = $event.target.value"/>
            </div>


            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger" data-translate-key="mod-info-image"> mod图片 </h3>
                <p style="line-height: 1.2;" data-translate-key="mod-info-image-tip">
                  mod图片是mod的展示图片(比例为3:2)，点击按钮选择图片
                </p>
              </s-tooltip>
              <s-button type="outlined" id="edit-mod-image-select"
                data-translate-key="edit-mod-image-preview">选择图片</s-button>
            </div>


            <div class="OO-setting-bar">
              <s-tooltip>
                <h3 slot="trigger" data-translate-key="mod-info-url"> mod链接 </h3>
                <p style="line-height: 1.2;" data-translate-key="mod-info-url-tip">
                  mod链接是mod的来源，可以是gamebanana、caimogu等 </p>
              </s-tooltip>
              <s-text-field :value="modInfo.url" @input="modInfo.url = $event.target.value"/>
            </div>
            <div class="OO-setting-bar" style="
                          display: flex;
                          flex-direction: column;
                          align-items: flex-start;
                          justify-content: space-between;height:150px;">
              <s-tooltip style="padding:15px 0;">
                <h3 slot="trigger" data-translate-key="mod-info-description"> mod描述 </h3>
                <p style="line-height: 1.2;" data-translate-key="mod-info-description-tip">
                  mod描述是对mod的简单描述，可以是作者、mod功能等 </p>
              </s-tooltip>
              <s-text-field class="OO-shade-box"
              style="min-height: calc(100% - 50px);height: 0px;border-radius: 20px;bottom: 5px;top: 45px;left: 5px;right: 5px;max-width: calc(100% - 10px);width: calc(100% - 10px);" multiLine="true" :value="modInfo.description"
                @input="modInfo.description = $event.target.value" id="edit-mod-description"></s-text-field>
            </div>

            <div>
              <s-button type="text" id="edit-mod-info-cancel" data-translate-key="cancel">取消</s-button>
              <s-button type="text" id="edit-mod-info-save" data-translate-key="save">保存</s-button>
            </div>
          </div>

        </div>
      </div>
    </div>

  </s-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { defineProps, defineEmits, onMounted, computed, watch,useTemplateRef } from 'vue';
import IManager from '../../electron/IManager';
import { mod } from 'three/webgpu';
const iManager = new IManager();

// 参数为 字符串类型的 mod，之后通过 iManager.getModInfo(mod) 获取 mod 信息
const props = defineProps({
  mod: Object
});
// modInfo 为 mod 信息，用于储存临时修改的 mod 信息，最后保存时再将其赋值给 props.mod
const modInfo = ref({
  name: 'no name',
  character: 'unknow',
  preview: '',
  url: '',
  description: 'no description'
});
const editModInfoDialog = useTemplateRef('edit-mod-dialog');
const img = ref(null);
watch(() => props.mod, async (newVal) => {
  //debug
  console.log('mod changed', newVal);
  if (newVal) {
    const imgBase64 = await iManager.getImageBase64(newVal.preview);
    modInfo.value = newVal;
    img.value = "data:image/png;base64," + imgBase64;
  }
});

const modImage = computed(() => {
  //debug
  console.log('modInfo.value.preview', modInfo.value.preview);
  return iManager.getImageBase64(modInfo.value.preview);
});


onMounted(() => {
  const editModInfoDialogStyle = document.createElement('style');
  editModInfoDialogStyle.innerHTML = `
    .container {
      width: calc(30% + 400px) !important;
      min-width: calc(600px) !important;
      max-width: 900px !important;
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
  editModInfoDialog.value.shadowRoot.appendChild(editModInfoDialogStyle);
});

</script>