<template>
  <!-- -帮助页面 -->
  <div id="help-section">
    <leftMenu :tabs="tabs" :translatedTabs="translatedTabs" @tabChange="handleTabChange">
    </leftMenu>
    <div class="help-content OO-box">
      <!--  中文帮助页面 -->
      <div id="help-dialog-cn" v-if="language === 'zh_cn'" class="font-hongmeng OO-scorll-box"
        style="display: flex;padding: 0px;flex-direction: column;width: 100%;padding: 0px;height: 100%;">
        <!-- 根据选择的设置选项展示不同的设置内容 -->
        <!-- -预设 -->
        <div id="help-dialog-help-preset" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-preset'">
          <div class="OO-setting-bar">
            <h3> 使用【预设】管理你的mod </h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>你可以将一系列的mod选项保存到【预设】中，以便快速切换不同的mod组合。所有预设的相关按钮都在右侧的预设栏里。点击标题栏右侧的预设按钮可以打开或关闭预设栏。</p>
          </div>
          <div class="OO-setting-bar">
            <h3>创建【预设】：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. 点击位于预设栏中部的【添加预设】按钮</p>
            <p>2. 输入预设名称</p>
            <p>3. 点击【确定】按钮</p>
            <p>之后，当前选中的mod将会被保存到新的预设中。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>应用【预设】：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. 选择想要应用的【预设】</p>
            <p>2. 点击主页面中的【应用配置】按钮</p>
            <p>随后，所选预设将会被加载到模组加载器中。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>编辑【预设】：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>任何对预设的更改都会自动保存。如果不希望保存更改，可以选择不使用预设或创建一个临时预设。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>删除【预设】：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. 点击【编辑预设】按钮后，每个预设旁边会出现【删除】按钮</p>
            <p>2. 点击【删除】按钮即可删除该预设（无法删除当前正在使用的预设）</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
        <!-- -mod -->
        <div id="help-dialog-help-mod" class="help-dialog-tab" style="overflow: auto;" v-if="currentTab === 'help-mod'">
          <div class="OO-setting-bar">
            <h3>导入mod：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>有两种方法可以导入mod：</p>
            <p>1. 将mod文件夹拖放到主窗口中，它会自动移动到【modSource】中。但在管理员模式下，由于安全限制，拖放功能不可用。</p>
            <p>2. 手动将文件夹移到【modSource】中。</p>
            <p>目前还不支持直接导入zip文件，请先解压后再进行导入。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>配置mod信息：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. 在mod列表中点击某个mod，在右侧会出现mod的信息。点击右侧菜单栏中的【编辑mod信息】按钮，按照提示填写信息。</p>
            <p>2. 右键点击mod列表中的mod，同样可以打开编辑对话框填写信息。</p>
            <p>完成编辑后，mod信息会被保存在【modSource】中，并在mod列表中显示。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>配置mod封面：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>有三种方式可以配置mod封面：</p>
            <p>1. 在编辑mod信息的对话框中，点击【设置封面图片】按钮，然后选择图片。</p>
            <p>2. 直接将图片拖放到mod卡片上（可以从网页中拖放），但在管理员模式下此功能受限。</p>
            <p>3. 手动将图片放到mod文件夹中，文件名为cover.jpg或cover.png。</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>

        <!-- -多个游戏 -->
        <div id="help-dialog-help-multiple-games" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-multiple-games'">
          <div class="OO-setting-bar">
            <h3>适配多个游戏</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>程序通过保存不同的配置文件夹来适应不同的游戏。可以在设置中启用询问切换配置，这样启动时程序会询问选择哪个配置文件夹以适配特定的游戏。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>将当前配置保存到配置文件：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. 设置当前游戏的mod根目录、mod背包目录、mod加载器目录和游戏目录。</p>
            <p>2. 在设置页面的“切换配置”部分指定配置文件夹的位置。</p>
            <p>3. 点击【保存当前配置到配置文件夹】按钮。</p>
            <p>4. 之后可以通过设置页面的“切换配置”来切换配置文件夹。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>切换配置文件夹：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. 在设置页面的“切换配置”部分点击【切换配置】按钮。</p>
            <p>2. 程序会根据选择的配置文件夹启动。</p>
            <p>另外，也可以开启自动询问切换配置的功能，这样每次启动时程序都会询问选择哪个配置文件夹。</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>

        <!-- -自动化 -->
        <div id="help-dialog-help-auto" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-auto'">
          <div class="OO-setting-bar">
            <h3> 让【自动化】解放你的双手 </h3>
          </div>
          <div class="OO-setting-bar">
            <h3>【自动化】</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>本程序能够自动启动游戏和modLoader，并在应用mod时激活绝区零的窗口并刷新，但这需要一定的配置。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>自动应用：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>可以在设置中启用【自动应用】配置，这样每当选择或取消选择mod时，程序会自动应用这些改变。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>自动刷新：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>当mod被应用时，程序会自动激活zzz的窗口并刷新，这样就无需手动操作了。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>自动启动游戏：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>程序启动时可以自动启动游戏和modLoader，但需在高级设置中正确设置游戏和modLoader的路径。</p>
          </div>

          <div class="OO-setting-bar">
            <h3>使用管理员权限：</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>程序启动时将以管理员权限运行，这使得游戏也能以管理员权限启动，避免UAC提示。不过，在管理员模式下，拖放操作将被禁用，因此不能通过拖放来导入mod或设置封面图片。</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>

        <!-- -故障排除 -->
        <div id="help-dialog-help-trouble" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-trouble'">
          <div class="OO-setting-bar">
            <h3>故障排除</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>如果遇到问题，可以尝试以下步骤解决问题：</p>
            <p>1. 按F5刷新页面，可能解决某些问题。</p>
            <p>2. 重启程序，有时候重启就能解决问题。</p>
            <p>3. 按Ctrl + Shift + I打开开发者工具查看控制台错误信息，有助于定位问题。</p>
            <p>如果以上方法无效，可以截图控制台错误信息并提交到GitHub或GameBanana寻求帮助。</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
      </div>

      <!-- -帮助页面，但是英文 -->
      <div id="help-dialog-en" v-else class="font-hongmeng"
        style="display: flex;padding: 0px;flex-direction: column;width: 100%;padding: 0px;height: 100%;">
        <!-- -Presets -->
        <div id="help-dialog-help-preset-en" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-preset'">
          <div class="OO-setting-bar">
            <h3>Manage your mods with presets</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>You can save a series of mod options to a preset, allowing you to quickly switch between different mod
              combinations. All relevant buttons for presets are in the preset panel on the right. You can click the
              preset button on the right side of the title bar to open/close the preset panel.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Create a preset:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. Click the Add Preset button, located in the middle of the preset panel</p>
            <p>2. Enter the preset name</p>
            <p>3. Click the OK button</p>
            <p>Afterward, the selected mods will be saved to this preset.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Apply a preset:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. Select the preset you want to apply</p>
            <p>2. Click the Apply Configuration button on the main page</p>
            <p>Afterward, your preset will be applied to the mod loader.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Edit a preset:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>All changes will be saved to the current preset. If you do not wish to save, you can create a new
              temporary preset or start the program without selecting a preset.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Delete a preset:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. Click the Edit Preset button, and a delete button will appear to the right of each preset</p>
            <p>2. Click the delete button, and it will remove the preset (you cannot delete the currently applied
              preset)</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
        <!-- -Mods -->
        <div id="help-dialog-help-mod-en" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-mod'">
          <div class="OO-setting-bar">
            <h3>Import mods:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>There are two ways to import mods</p>
            <p>1. Drag the mod folder into the main window, and it will automatically move your mod folder to the
              modSource, but dragging actions will be disabled due to security restrictions when in administrator mode
            </p>
            <p>2. Manually move the folder to the modSource</p>
            <p>Zip file imports are not supported at the moment. If you need to import a zip file, please extract it
              first before importing</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Configure mod information:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. Click on a mod in the mod list, and its information will be displayed on the right. Click the Edit
              Mod Information button in the right menu, and a dialog box for editing mod information will pop up. Fill
              in the mod information as prompted</p>
            <p>2. Right-click on a mod in the mod list, and a dialog box for editing mod information will pop up. Fill
              in the mod information as prompted</p>
            <p>Afterward, your mod information will be saved to the modSource, and you can see your mod information in
              the mod list</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Configure mod cover:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>There are three ways to configure a mod cover:</p>
            <p>1. In the edit mod information dialog box, click the Set Cover Image button, which will open a file
              selector. Choose your cover image</p>
            <p>2. Drag your image into the mod card, and it will automatically set as the mod cover (you can drag
              directly from a webpage), but dragging actions will be disabled due to security restrictions when in
              administrator mode</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
        <!-- -Multiple games -->
        <div id="help-dialog-help-multiple-games-en" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-multiple-games'">
          <div class="OO-setting-bar">
            <h3>Adapt to multiple games</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>This program adapts to different games by saving different configuration folders. You can enable the
              prompt to switch configurations in the settings. This way, when the program starts, it will ask you to
              choose which configuration folder to use, adapting to different games.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Save current configuration:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. Configure the mod root directory, mod backpack directory, mod loader directory, and game directory
              for the current game</p>
            <p>2. Set the location of the configuration folder in the "Switch Configuration" section of the settings
              page</p>
            <p>3. Click "Save current configuration to configuration folder" to save the current configuration to the
              configuration folder</p>
            <p>4. After that, you can click "Switch Configuration" in the "Switch Configuration" section of the
              settings page to switch configuration folders</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Switch configuration folders:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>1. Click "Switch Configuration" in the "Switch Configuration" section of the settings page</p>
            <p>2. The program will then use the configuration folder you selected to start</p>
            <p>Additionally, you can enable the automatic prompt to switch configurations. This way, when the program
              starts, it will ask you to choose which configuration folder to use, adapting to different games.</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
        <!-- -Automation -->
        <div id="help-dialog-help-auto-en" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-auto'">
          <div class="OO-setting-bar">
            <h3>Let automation free your hands</h3>
          </div>
          <div class="OO-setting-bar">
            <h3>Automation</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>This program can automate the opening of the game and modLoader, and when applying mods, it will
              automatically activate and refresh the zzz window, but this requires some configuration</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Auto-apply:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>You can enable auto-apply settings so that when you select/deselect mods, the program will
              automatically apply the configuration, applying the selected mods to the mod loader.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Auto-refresh:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>When a mod is applied, the program will automatically activate the zzz window and refresh it, so you
              don't have to manually switch windows and press F10 to refresh.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Auto-launch game:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>When the program starts, it will automatically launch the game and modLoader, but this requires setting
              the game directory and modLoader directory in the advanced settings.</p>
          </div>
          <div class="OO-setting-bar">
            <h3>Use administrator privileges:</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>When the program starts, it will use administrator privileges. This way, when the game is launched
              automatically, it will also start with administrator privileges without prompting a UAC dialog. However,
              using administrator mode will disable dragging actions, and importing mods and setting mod cover images
              by dragging will be disabled.</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
        <!-- -Troubleshooting -->
        <div id="help-dialog-help-trouble-en" class="help-dialog-tab" style="overflow: auto;"
          v-if="currentTab === 'help-trouble'">
          <div class="OO-setting-bar">
            <h3>Troubleshooting</h3>
          </div>
          <div class="OO-box OO-shade-box">
            <p>If the program malfunctions, you can try the following methods to resolve the issue:</p>
            <p>1. Press F5 to refresh the page, which may solve some issues</p>
            <p>2. Restart the program, which may solve some issues</p>
            <p>3. Press Ctrl + Shift + I to open the console and view error messages, which may help you identify the
              problem</p>
            <p>If none of the above methods work, you can take a screenshot of the error message in the console and
              submit it to GitHub or GameBanana, and I will do my best to help you solve the problem</p>
          </div>
          <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
        </div>
      </div>

    </div>
  </div>
</template>




<script setup>
import { ref, onMounted, computed } from 'vue';
import IManager from '../../electron/IManager';
import leftMenu from '../components/leftMenu.vue';
const iManager = new IManager();


const language = ref('en');

iManager.waitInit().then(() => {
  language.value = iManager.config.language;

  iManager.on('languageChange', (lang) => {
    //debug 
    console.log('helpSection languageChange', lang);
    language.value = lang;
  });
});

const tabs = ['help-preset', 'help-mod', 'help-auto', 'help-multiple-games', 'help-trouble'];
const translatedTabs = computed(() => {
  if (language.value === 'zh_cn') {
    return ['使用【预设】', '导入、配置mod', '自动化', '适配多个游戏', '故障排除'];
  } else {
    return ['Presets', 'Import Mods', 'Automation', 'Multiple Games', 'Troubleshooting'];
  }
});

const currentTab = ref(tabs[0]);

const handleTabChange = (tab) => {
  currentTab.value = tab;
};



onMounted(() => {
  iManager.waitInit().then(() => {
    language.value = iManager.config.language;
    //debug
    console.log('helpSection onMounted', language.value);
  });
});

</script>

<style scoped>
#help-section {
  display: flex;
  flex-direction: row;
  height: calc(100% - 60px);
  width: 100%;
  overflow: display;
}

.help-content {
  margin: 0 10px;
  height: calc(100% - 20px);
  /* width: calc(100% - 200px); */
  flex: 1;
  overflow-y: auto;
}

</style>